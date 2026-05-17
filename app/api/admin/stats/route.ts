import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    usersTotal,
    usersWeek,
    usersToday,
    matchesTotal,
    matchesActive,
    matchesWeek,
    photosPending,
    reportsTotal,
    reportsWeek,
    flaggedAccounts,
    messagesTotal,
    messagesToday,
    recentUsers,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).is("unmatched_at", null),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabaseAdmin.from("photos").select("*", { count: "exact", head: true }).eq("moderation_status", "pending").is("deleted_at", null),
    supabaseAdmin.from("reports").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).not("flagged_at", "is", null),
    supabaseAdmin.from("messages").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("messages").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  // Build 30-day signup sparkline (count per day)
  const { data: signupRows } = await supabaseAdmin
    .from("profiles")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  const signupByDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    signupByDay[key] = 0;
  }
  for (const row of (signupRows ?? []) as Array<{ created_at: string }>) {
    const key = row.created_at.slice(0, 10);
    if (key in signupByDay) signupByDay[key]++;
  }

  return NextResponse.json({
    users: {
      total:   usersTotal.count  ?? 0,
      week:    usersWeek.count   ?? 0,
      today:   usersToday.count  ?? 0,
    },
    matches: {
      total:   matchesTotal.count  ?? 0,
      active:  matchesActive.count ?? 0,
      week:    matchesWeek.count   ?? 0,
    },
    photos: {
      pending: photosPending.count ?? 0,
    },
    reports: {
      total: reportsTotal.count ?? 0,
      week:  reportsWeek.count  ?? 0,
    },
    messages: {
      total: messagesTotal.count  ?? 0,
      today: messagesToday.count  ?? 0,
    },
    flaggedAccounts: flaggedAccounts.count ?? 0,
    recentUsers: (recentUsers.data ?? []) as Array<{ user_id: string; display_name: string | null; created_at: string }>,
    signupSparkline: Object.values(signupByDay),
  });
}
