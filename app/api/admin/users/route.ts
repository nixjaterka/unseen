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

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "all"; // all | flagged

  // Pull all auth users (up to 1000) so we see signups before onboarding too
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const authUsers = authData.users ?? [];

  // Pull all profiles for enrichment
  const { data: profileRows } = await supabaseAdmin
    .from("profiles")
    .select("user_id, display_name, city, gender, onboarded_at, flagged_at, photo_rejection_count, purge_scheduled_at");

  const profileMap = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  // Merge
  let merged = authUsers.map((u) => {
    const p = profileMap.get(u.id);
    return {
      user_id:              u.id,
      email:                u.email ?? null,
      display_name:         p?.display_name ?? null,
      city:                 p?.city ?? null,
      gender:               p?.gender ?? null,
      onboarded:            !!p?.onboarded_at,
      confirmed:            !!u.email_confirmed_at,
      flagged_at:           p?.flagged_at ?? null,
      photo_rejection_count: p?.photo_rejection_count ?? 0,
      purge_scheduled_at:   p?.purge_scheduled_at ?? null,
      created_at:           u.created_at,
    };
  });

  // Sort newest first
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filter === "flagged") merged = merged.filter((u) => !!u.flagged_at);

  return NextResponse.json({ users: merged });
}
