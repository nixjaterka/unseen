import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Account deletion with safety retention.
//
// What happens immediately:
//   - profile marked as deleted_at = now()
//   - purge_scheduled_at set to now() + 1 year (unless reports exist against
//     this user, in which case it stays null = retain indefinitely)
//   - photos in storage AND photo rows removed (personal imagery)
//   - swipes removed (no safety value)
//   - profile_prompts removed (legacy, no safety value)
//   - reports filed BY this user removed; reports filed AGAINST kept
//   - active matches marked unmatched_at so the other party stops seeing
//     the conversation in their UI; messages and match rows stay in the DB
//     so safety investigations can still pull conversation history
//   - the Supabase auth user is NOT deleted — keeps the email locked
//     (prevents re-registration with the same address) and preserves
//     foreign-key integrity for retained data
//
// A background sweep (separate, not implemented yet) wipes records where
// profiles.purge_scheduled_at < now().
//
// Migration required (see scripts/migrations/2026-05-04-purge-scheduled-at.sql):
//   alter table profiles add column if not exists purge_scheduled_at timestamptz;

const RETENTION_DAYS = 365;

export async function POST() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const uid = user.id;
  const nowIso = new Date().toISOString();

  // 1. Decide retention. Any report against the user → keep data indefinitely.
  const { count: reportsCount } = await supabaseAdmin
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("reported_id", uid);

  const purgeScheduledAt =
    (reportsCount ?? 0) > 0
      ? null
      : new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // 2. Photos: remove storage objects, then DB rows. Personal imagery,
  //    deleted on request regardless of retention policy.
  const { data: photoRows } = await supabaseAdmin
    .from("photos")
    .select("path")
    .eq("user_id", uid);

  const paths = (photoRows ?? [])
    .map((r) => r.path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  if (paths.length > 0) {
    const { error: storageErr } = await supabaseAdmin.storage
      .from("user_photos")
      .remove(paths);
    if (storageErr) {
      console.warn("[delete] storage removal warning:", storageErr.message);
      // Don't fail the whole delete on storage errors — orphaned files
      // can be swept later.
    }
  }

  await supabaseAdmin.from("photos").delete().eq("user_id", uid);

  // 3. Swipes — both directions. No safety value, just behavioral noise.
  await supabaseAdmin.from("swipes").delete().eq("swiper_id", uid);
  await supabaseAdmin.from("swipes").delete().eq("target_id", uid);

  // 4. Profile prompts (legacy schema from before bio/prompts were removed).
  await supabaseAdmin.from("profile_prompts").delete().eq("user_id", uid);

  // 5. Reports filed BY this user → drop. Reports filed AGAINST → keep
  //    (Privacy Policy 6.4 — safety records).
  await supabaseAdmin.from("reports").delete().eq("reporter_id", uid);

  // 6. End active matches. Other party stops seeing the chat in their UI
  //    via the unmatched_at filter. Messages and match rows stay in the
  //    DB so safety investigations can pull the conversation history.
  await supabaseAdmin
    .from("matches")
    .update({ unmatched_at: nowIso })
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .is("unmatched_at", null);

  // 7. Mark profile soft-deleted with the purge schedule.
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update({
      deleted_at: nowIso,
      purge_scheduled_at: purgeScheduledAt,
      updated_at: nowIso,
    })
    .eq("user_id", uid);

  if (profileErr) {
    return NextResponse.json({ ok: false, error: profileErr.message }, { status: 500 });
  }

  // 8. Sign the user out. Auth user is kept (email stays locked).
  //    Existing sessions on other devices will continue working until they
  //    expire — for hard revoke across devices we'd need an admin API call
  //    to invalidate all sessions, a follow-up.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
