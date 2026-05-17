import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Admin-only endpoint — returns the raw Sightengine response for a given
// storage path so you can diagnose moderation issues.
//
// Body: { path: string }
// Only usable by emails listed in ADMIN_EMAILS env var.

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : null;
  if (!path) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const apiUser   = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    return NextResponse.json({ error: "sightengine_not_configured" }, { status: 500 });
  }

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("user_photos")
    .createSignedUrl(path, 60);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  }

  let imageBuffer: Buffer;
  try {
    const imgRes = await fetch(signed.signedUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "fetch_failed", status: imgRes.status }, { status: 500 });
    }
    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  } catch (err) {
    return NextResponse.json({ error: "fetch_error", detail: String(err) }, { status: 500 });
  }

  const form = new FormData();
  form.append("models",     "nudity,offensive,gore,face,type");
  form.append("api_user",   apiUser);
  form.append("api_secret", apiSecret);
  form.append("media", new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }), "photo.jpg");

  try {
    const res  = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body:   form,
    });
    const data = await res.json();
    // Return the full raw response so you can see exactly what Sightengine says.
    return NextResponse.json({ sightengine: data, imageBytes: imageBuffer.length });
  } catch (err) {
    return NextResponse.json({ error: "sightengine_error", detail: String(err) }, { status: 500 });
  }
}
