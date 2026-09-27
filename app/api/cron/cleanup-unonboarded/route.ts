import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Cron endpoint — runs daily at 04:00 UTC.
// Deletes auth users who signed up more than 3 days ago but never completed onboarding.
// Secured with CRON_SECRET — Vercel passes it automatically.

const CRON_SECRET   = process.env.CRON_SECRET ?? "";
const DAYS_GRACE    = 3;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_GRACE);

  // Get all auth users
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  // Get all onboarded user IDs
  const { data: onboarded } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .not("onboarded_at", "is", null);

  const onboardedIds = new Set((onboarded ?? []).map((p) => p.user_id));

  // Find users older than grace period who never onboarded
  const candidates = authData.users.filter((u) => {
    const createdAt = new Date(u.created_at);
    return createdAt < cutoff && !onboardedIds.has(u.id);
  });

  // SAFETY: onboarded_at alone is not proof someone never used the app —
  // older accounts, hand-made test accounts and half-failed onboarding saves
  // can all have it empty. Anyone who has swiped or has a match has clearly
  // used the app; never hard-delete them (it would also orphan their matches,
  // leaving the other person with a ghost chat).
  const candidateIds = candidates.map((u) => u.id);
  const usedApp = new Set<string>();
  for (let i = 0; i < candidateIds.length; i += 100) {
    const chunk = candidateIds.slice(i, i + 100);
    const [{ data: swipeRows }, { data: matchRowsA }, { data: matchRowsB }] = await Promise.all([
      supabaseAdmin.from("swipes").select("swiper_id").in("swiper_id", chunk),
      supabaseAdmin.from("matches").select("user_a").in("user_a", chunk),
      supabaseAdmin.from("matches").select("user_b").in("user_b", chunk),
    ]);
    (swipeRows ?? []).forEach((r) => usedApp.add(r.swiper_id));
    (matchRowsA ?? []).forEach((r) => usedApp.add(r.user_a));
    (matchRowsB ?? []).forEach((r) => usedApp.add(r.user_b));
  }

  const toDelete = candidates.filter((u) => !usedApp.has(u.id));
  const skipped = candidates.length - toDelete.length;

  const results = await Promise.allSettled(
    toDelete.map((u) => supabaseAdmin.auth.admin.deleteUser(u.id))
  );

  const deleted  = results.filter((r) => r.status === "fulfilled").length;
  const failed   = results.filter((r) => r.status === "rejected").length;

  console.log(`[cleanup-unonboarded] deleted=${deleted} failed=${failed} skipped_used_app=${skipped} cutoff=${cutoff.toISOString()}`);

  return NextResponse.json({ deleted, failed, skipped_used_app: skipped, total: toDelete.length });
}
