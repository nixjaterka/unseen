import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET() {
  // For now: return any random profile that has a primary photo.
  // Later we'll exclude already-swiped, apply filters, etc.

  // 1) Get a random photo row with its user_id
  const { data: photo, error } = await supabaseAdmin
    .from("photos")
    .select("user_id, path")
    .eq("is_primary", true)
    .limit(1);

  if (error || !photo?.[0]) {
    return NextResponse.json({ candidate: null }, { status: 200 });
  }

  const candidateId = photo[0].user_id;
  const path = photo[0].path;

  // 2) Create a short-lived signed URL for swipe feed
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("user_photos")
    .createSignedUrl(path, 60); // 60 seconds

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ candidate: null }, { status: 200 });
  }

  return NextResponse.json({
    candidate: {
      candidateId,
      photoUrl: signed.signedUrl,
    },
  });
}