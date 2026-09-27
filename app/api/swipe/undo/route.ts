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
    .select("id, target_id, direction")
    .eq("swiper_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastSwipe) {
    return NextResponse.json({ ok: false, error: "nothing_to_undo" }, { status: 422 });
  }

  // Guard: if the last swipe was a like that already produced a mutual match,
  // undoing it would delete the swipe but orphan the match row (and could leak
  // reveal timing). Block the undo in that case — the like is now committed.
  if (lastSwipe.direction === "like") {
    const a = user.id;
    const b = lastSwipe.target_id;
    const { data: existingMatch } = await supabaseAdmin
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${a},user_b.eq.${b}),and(user_a.eq.${b},user_b.eq.${a})`
      )
      .limit(1)
      .maybeSingle();

    if (existingMatch) {
      return NextResponse.json(
        { ok: false, error: "already_matched" },
        { status: 409 }
      );
    }
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
