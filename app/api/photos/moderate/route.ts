import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { moderatePhotoUrl } from "../../../../lib/moderation";
import { notifyAdminPhotoPending } from "../../../../lib/email";
import { rateLimit } from "../../../../lib/rateLimit";

// Called by PhotoUploader after a file lands in storage but before the
// photos row is inserted.
//
// Returns:
//   { clean: true }                 — approved, insert the row
//   { clean: true, pending: true }  — insert the row with status = 'pending'
//   { clean: false }                — auto-blocked (nudity, no face, etc.)
//
// Body: { path: string }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : null;

  if (!path) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // 5 moderation calls per user per minute — prevents Sightengine quota abuse.
  if (await rateLimit("photos:moderate", user.id, { requests: 5, window: "1 m" })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Security: validate path strictly — must be {uuid}/{uuid}.{ext} with no
  // traversal segments. startsWith alone is insufficient because
  // "abc/../victim/photo.jpg".startsWith("abc/") evaluates to true.
  const SAFE_PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-zA-Z]{2,5}$/i;
  if (!SAFE_PATH_RE.test(path) || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("user_photos")
    .createSignedUrl(path, 60); // 60 seconds — minimal window for Sightengine.

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  }

  const result = await moderatePhotoUrl(signed.signedUrl);

  // If the photo needs human review, ping the admin — non-blocking.
  if (result.clean && result.pending) {
    void notifyAdminPhotoPending(user.id);
  }

  return NextResponse.json(result);
}
