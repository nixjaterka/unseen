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
  const toDelete = authData.users.filter((u) => {
    const createdAt = new Date(u.created_at);
    return createdAt < cutoff && !onboardedIds.has(u.id);
  });

  const results = await Promise.allSettled(
    toDelete.map((u) => supabaseAdmin.auth.admin.deleteUser(u.id))
  );

  const deleted  = results.filter((r) => r.status === "fulfilled").length;
  const failed   = results.filter((r) => r.status === "rejected").length;

  console.log(`[cleanup-unonboarded] deleted=${deleted} failed=${failed} cutoff=${cutoff.toISOString()}`);

  return NextResponse.json({ deleted, failed, total: toDelete.length });
}
