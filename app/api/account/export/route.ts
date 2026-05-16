import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// GDPR data export. Returns the user's own data as a downloadable JSON file.
// Scope: data the user produced or that is uniquely about them. Does NOT include
// other people's messages — those belong to the other person.
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const uid = user.id;

  const [
    profileRes,
    profilePromptsRes,
    photosRes,
    swipesRes,
    matchesRes,
    matchPrefsRes,
    sentMessagesRes,
    datePlansRes,
    reportsRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle(),
    supabaseAdmin
      .from("profile_prompts")
      .select("prompt_id, answer")
      .eq("user_id", uid),
    supabaseAdmin
      .from("photos")
      .select("path, position, is_primary")
      .eq("user_id", uid),
    supabaseAdmin
      .from("swipes")
      .select("target_id, direction, created_at")
      .eq("swiper_id", uid),
    supabaseAdmin
      .from("matches")
      .select("id, user_a, user_b, match_label, chat_unlock_at, created_at, unmatched_at")
      .or(`user_a.eq.${uid},user_b.eq.${uid}`),
    supabaseAdmin
      .from("match_preferences")
      .select("match_id, emoji, last_read_at, updated_at")
      .eq("user_id", uid),
    supabaseAdmin
      .from("messages")
      .select("match_id, content, created_at")
      .eq("sender_id", uid),
    supabaseAdmin
      .from("date_plans")
      .select("*")
      .eq("created_by", uid),
    supabaseAdmin
      .from("reports")
      .select("*")
      .eq("reporter_id", uid),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: {
      id: uid,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
    },
    profile: profileRes.data ?? null,
    profile_prompts: profilePromptsRes.data ?? [],
    photos: photosRes.data ?? [],
    swipes: swipesRes.data ?? [],
    matches: matchesRes.data ?? [],
    match_preferences: matchPrefsRes.data ?? [],
    messages_sent: sentMessagesRes.data ?? [],
    date_plans: datePlansRes.data ?? [],
    reports_filed: reportsRes.data ?? [],
    notes:
      "This export includes your own profile data, the actions you took, and the content you authored. Messages from other people are not included — that content belongs to them.",
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="unseen-data-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
