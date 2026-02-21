import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET() {
  // 1) Read the logged-in user from cookies (shared auth)
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ candidate: null, reason: "not_authenticated" }, { status: 200 });
  }

  const viewerId = user.id;

  // 2) Get list of already swiped targets
  const { data: swipedRows } = await supabaseAdmin
    .from("swipes")
    .select("target_id")
    .eq("swiper_id", viewerId);

  const swipedIds = new Set((swipedRows ?? []).map((r) => r.target_id));
  swipedIds.add(viewerId); // exclude self

  // 3) Pick a candidate (simple MVP: first primary photo not yet swiped)
  const { data: photoRows, error: photoErr } = await supabaseAdmin
    .from("photos")
    .select("user_id, path")
    .eq("is_primary", true)
    .limit(50);

  if (photoErr || !photoRows || photoRows.length === 0) {
    return NextResponse.json({ candidate: null, reason: "no_photos" }, { status: 200 });
  }

  const candidate = photoRows.find((r) => !swipedIds.has(r.user_id));

  if (!candidate) {
    return NextResponse.json({ candidate: null, reason: "no_more_candidates" }, { status: 200 });
  }

  // 4) Create short-lived signed URL for swipe feed only
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("user_photos")
    .createSignedUrl(candidate.path, 60);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ candidate: null, reason: "sign_failed" }, { status: 200 });
  }

  return NextResponse.json({
    candidate: {
      candidateId: candidate.user_id,
      photoUrl: signed.signedUrl,
    },
  });
}