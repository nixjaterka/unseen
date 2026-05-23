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
  void thirtyDaysAgo; // used below via allAuthUsers filter

  // Auth users — source of truth for all signups (includes unconfirmed + not-yet-onboarded)
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const allAuthUsers = authData?.users ?? [];

  const authTotal = allAuthUsers.length;
  const authWeek  = allAuthUsers.filter(u => u.created_at >= sevenDaysAgo).length;
  const authToday = allAuthUsers.filter(u => u.created_at >= todayStart).length;

  // Recent signups — newest 8, enriched with display_name from profiles
  const recentAuthUsers = [...allAuthUsers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const recentIds = recentAuthUsers.map(u => u.id);
  const { data: recentProfiles } = recentIds.length > 0
    ? await supabaseAdmin.from("profiles").select("user_id, display_name").in("user_id", recentIds)
    : { data: [] };
  const profileNameMap = new Map((recentProfiles ?? []).map((p: { user_id: string; display_name: string | null }) => [p.user_id, p.display_name]));

  const recentUsers = recentAuthUsers.map(u => ({
    user_id:      u.id,
    display_name: profileNameMap.get(u.id) ?? null,
    email:        u.email ?? null,
    confirmed:    !!u.email_confirmed_at,
    created_at:   u.created_at,
  }));

  // 30-day signup sparkline from auth users
  const signupByDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    signupByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const u of allAuthUsers) {
    const key = u.created_at.slice(0, 10);
    if (key in signupByDay) signupByDay[key]++;
  }

  const [
    matchesTotal,
    matchesActive,
    matchesWeek,
    photosPending,
    reportsTotal,
    reportsWeek,
    flaggedAccounts,
    messagesTotal,
    messagesToday,
  ] = await Promise.all([
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).is("unmatched_at", null),
    supabaseAdmin.from("matches").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabaseAdmin.from("photos").select("*", { count: "exact", head: true }).eq("moderation_status", "pending").is("deleted_at", null),
    supabaseAdmin.from("reports").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).not("flagged_at", "is", null),
    supabaseAdmin.from("messages").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("messages").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
  ]);

  return NextResponse.json({
    users: {
      total: authTotal,
      week:  authWeek,
      today: authToday,
    },
    matches: {
      total:  matchesTotal.count  ?? 0,
      active: matchesActive.count ?? 0,
      week:   matchesWeek.count   ?? 0,
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
    recentUsers,
    signupSparkline: Object.values(signupByDay),
  });
}
