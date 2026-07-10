import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isPremium } from "../../../../lib/subscription";

export async function POST() {
  // Bearer-token (mobile) or cookie (web) auth.
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  if (!(await isPremium(user.id))) {
    return NextResponse.json({ ok: false, error: "not_premium" }, { status: 403 });
  }

  // Find the most recent swipe by this user
  const { data: lastSwipe } = await supabaseAdmin
    .from("swipes")
    .select("id, target_id")
    .eq("swiper_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastSwipe) {
    return NextResponse.json({ ok: false, error: "nothing_to_undo" }, { status: 422 });
  }

  const { error } = await supabaseAdmin
    .from("swipes")
    .delete()
    .eq("id", lastSwipe.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, targetId: lastSwipe.target_id });
}
