import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Conversation purge.
//
// A conversation is kept for as long as EITHER person still has it displayed.
// Once both have deleted it, it is kept a further year from the last message
// and then removed for good. The year is a deliberate safety window: if
// something happened on that date, the messages are still there to be pulled.
//
// Never purged:
//   • a conversation either person still has in their list
//   • a conversation with ANY report filed against it — those are retained
//     indefinitely, same rule as account deletion uses
//
// A participant counts as "no longer displaying it" when their
// match_preferences row has hidden_at set, OR their profile is deleted.
//
// Secured with CRON_SECRET, like the other cron routes.
// Add `?dryRun=1` to see what WOULD be purged without deleting anything.

const RETENTION_DAYS = 365;
const MAX_PER_RUN = 200;   // keeps one invocation well inside the time limit
const IN_CHUNK_SIZE = 100; // Supabase encodes .in() into the URL

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // ── 1. Who has stopped displaying which conversation ──────────────────────
  const [{ data: hiddenPrefs, error: prefsErr }, { data: deletedProfiles }] =
    await Promise.all([
      supabaseAdmin
        .from("match_preferences")
        .select("match_id, user_id")
        .not("hidden_at", "is", null),
      supabaseAdmin
        .from("profiles")
        .select("user_id")
        .not("deleted_at", "is", null),
    ]);

  if (prefsErr) {
    console.error("[cron/purge-conversations] prefs error:", prefsErr);
    return NextResponse.json({ error: prefsErr.message }, { status: 500 });
  }

  const goneUsers = new Set((deletedProfiles ?? []).map((p) => p.user_id as string));

  const hiddenBy = new Map<number, Set<string>>();
  for (const row of hiddenPrefs ?? []) {
    const id = row.match_id as number;
    if (!hiddenBy.has(id)) hiddenBy.set(id, new Set());
    hiddenBy.get(id)!.add(row.user_id as string);
  }

  if (hiddenBy.size === 0) {
    return NextResponse.json({ ok: true, purged: 0, reason: "nothing_hidden" });
  }

  // ── 2. Both participants must have let go of it ───────────────────────────
  const candidateIds: number[] = [];
  // Kept from this pass so step 3 doesn't have to query the matches again —
  // and so it covers every candidate, not just the first chunk.
  const unlockAt = new Map<number, string>();

  for (const ids of chunk([...hiddenBy.keys()], IN_CHUNK_SIZE)) {
    const { data: rows } = await supabaseAdmin
      .from("matches")
      .select("id, user_a, user_b, chat_unlock_at")
      .in("id", ids);

    for (const m of rows ?? []) {
      const hidden = hiddenBy.get(m.id as number) ?? new Set<string>();
      const letGo = (uid: string) => hidden.has(uid) || goneUsers.has(uid);
      if (letGo(m.user_a as string) && letGo(m.user_b as string)) {
        candidateIds.push(m.id as number);
        unlockAt.set(m.id as number, m.chat_unlock_at as string);
      }
    }
  }

  if (candidateIds.length === 0) {
    return NextResponse.json({ ok: true, purged: 0, reason: "none_hidden_by_both" });
  }

  // ── 3. A year since the last message, and no report against it ────────────
  const lastMessageAt = new Map<number, string>();
  const reportedIds = new Set<number>();

  for (const ids of chunk(candidateIds, IN_CHUNK_SIZE)) {
    const [{ data: msgs }, { data: reports }] = await Promise.all([
      supabaseAdmin
        .from("messages")
        .select("match_id, created_at")
        .in("match_id", ids)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("reports").select("match_id").in("match_id", ids),
    ]);

    for (const m of msgs ?? []) {
      const id = m.match_id as number;
      if (!lastMessageAt.has(id)) lastMessageAt.set(id, m.created_at as string);
    }
    for (const r of reports ?? []) {
      if (r.match_id != null) reportedIds.add(r.match_id as number);
    }
  }

  // A conversation nobody ever wrote in is dated from when the chat opened
  // (unlockAt, collected above).
  const dueIds = candidateIds
    .filter((id) => {
      if (reportedIds.has(id)) return false;
      const last = lastMessageAt.get(id) ?? unlockAt.get(id);
      return !!last && new Date(last) <= cutoff;
    })
    .slice(0, MAX_PER_RUN);

  if (dueIds.length === 0) {
    return NextResponse.json({
      ok: true,
      purged: 0,
      reason: "none_past_retention",
      hiddenByBoth: candidateIds.length,
      heldByReport: [...reportedIds].length,
    });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldPurge: dueIds.length,
      matchIds: dueIds,
      heldByReport: [...reportedIds].length,
    });
  }

  // ── 4. Voice recordings first — storage objects are not covered by any
  //       foreign key, so deleting the rows alone would strand the audio in
  //       the bucket forever. Paths are `${matchId}/...`, so the whole
  //       conversation's audio can be listed and removed by prefix.
  for (const id of dueIds) {
    const { data: files } = await supabaseAdmin.storage
      .from("voice_messages")
      .list(String(id), { limit: 1000 });

    if (files && files.length > 0) {
      const { error } = await supabaseAdmin.storage
        .from("voice_messages")
        .remove(files.map((f) => `${id}/${f.name}`));
      if (error) {
        // Non-fatal: the rows still go, and a stray object is cheap. Logged so
        // it can be swept up later rather than silently accumulating.
        console.error(`[cron/purge-conversations] audio remove failed for ${id}:`, error);
      }
    }
  }

  // ── 4. Delete children first, then the match ──────────────────────────────
  // message_reactions cascades from matches, but deleting explicitly keeps
  // this correct regardless of how the FKs are configured.
  const childTables = [
    "message_reactions",
    "messages",
    "match_preferences",
    "match_unlock_notifications",
    "date_checkins",
    "date_plans",
  ];

  for (const table of childTables) {
    const { error } = await supabaseAdmin.from(table).delete().in("match_id", dueIds);
    if (error) {
      console.error(`[cron/purge-conversations] ${table} delete failed:`, error);
      return NextResponse.json(
        { error: `${table}: ${error.message}`, purged: 0 },
        { status: 500 }
      );
    }
  }

  const { error: matchErr } = await supabaseAdmin.from("matches").delete().in("id", dueIds);
  if (matchErr) {
    console.error("[cron/purge-conversations] matches delete failed:", matchErr);
    return NextResponse.json({ error: matchErr.message }, { status: 500 });
  }

  console.log(`[cron/purge-conversations] purged ${dueIds.length} conversations`);
  return NextResponse.json({ ok: true, purged: dueIds.length });
}
