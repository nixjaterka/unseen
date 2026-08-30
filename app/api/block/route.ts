import { NextResponse } from "next/server";
import { getApiUser } from "../../../lib/apiUser";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { rateLimit } from "../../../lib/rateLimit";

// Blocking. Shared by web and both mobile apps (mobile authenticates with
// `Authorization: Bearer <supabase access token>` — getApiUser handles both).
//
//   GET    → { blocked: [{ id, blocked_id, label, created_at }] }
//   POST   { targetId, matchId?, reason? }  → block + unmatch every shared match
//   DELETE { targetId }                     → unblock (does NOT restore matches)

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("blocked_users")
    .select("id, blocked_id, match_id, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Label each blocked person by the match_label they were blocked from — we
  // never expose a real name here, identities stay hidden by design.
  const matchIds = (data ?? [])
    .map((row) => row.match_id)
    .filter((id): id is number => typeof id === "number");

  const labels = new Map<number, string>();
  if (matchIds.length > 0) {
    const { data: matchRows } = await supabaseAdmin
      .from("matches")
      .select("id, match_label")
      .in("id", matchIds);
    for (const m of matchRows ?? []) labels.set(m.id as number, m.match_label as string);
  }

  return NextResponse.json({
    ok: true,
    blocked: (data ?? []).map((row) => ({
      id: row.id,
      blocked_id: row.blocked_id,
      created_at: row.created_at,
      label: row.match_id ? labels.get(row.match_id) ?? null : null,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  if (await rateLimit("block:create", user.id, { requests: 20, window: "1 m" })) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const targetId = typeof body?.targetId === "string" ? body.targetId : null;
  const matchId = typeof body?.matchId === "number" ? body.matchId : null;
  const reason = typeof body?.reason === "string" ? body.reason.slice(0, 200) : null;

  if (!targetId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  if (targetId === user.id) {
    return NextResponse.json({ ok: false, error: "cannot_block_self" }, { status: 400 });
  }

  // If a match was named, verify the caller is actually in it before trusting
  // it as the source of the block (it becomes the label shown in Settings).
  let verifiedMatchId: number | null = null;
  if (matchId) {
    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("id, user_a, user_b")
      .eq("id", matchId)
      .maybeSingle();
    if (match && (match.user_a === user.id || match.user_b === user.id)) {
      verifiedMatchId = matchId;
    }
  }

  const { error: insertErr } = await supabaseAdmin
    .from("blocked_users")
    .upsert(
      {
        blocker_id: user.id,
        blocked_id: targetId,
        match_id: verifiedMatchId,
        reason,
      },
      { onConflict: "blocker_id,blocked_id" }
    );

  if (insertErr) {
    return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
  }

  // Blocking ends every conversation between the two, not just the one the
  // block was triggered from.
  const nowIso = new Date().toISOString();
  const { data: sharedMatches } = await supabaseAdmin
    .from("matches")
    .select("id")
    .is("unmatched_at", null)
    .or(
      `and(user_a.eq.${user.id},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${user.id})`
    );

  const sharedIds = (sharedMatches ?? []).map((m) => m.id as number);
  if (sharedIds.length > 0) {
    await supabaseAdmin
      .from("matches")
      .update({ unmatched_at: nowIso, unmatched_by: user.id })
      .in("id", sharedIds);
  }

  return NextResponse.json({ ok: true, unmatched: sharedIds.length });
}

export async function DELETE(req: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const targetId = typeof body?.targetId === "string" ? body.targetId : null;
  if (!targetId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("blocked_users")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Unblocking does not restore the ended matches — that is deliberate.
  return NextResponse.json({ ok: true });
}
