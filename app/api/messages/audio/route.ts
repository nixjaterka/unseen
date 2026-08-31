import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Signed playback URL for one voice message.
//
//   GET /api/messages/audio?messageId=123  ->  { ok: true, url, expiresIn }
//
// The bucket is private, so this is the only way to hear a recording, and it
// checks that the caller is actually in the conversation first. URLs are
// short-lived — long enough to play, not to pass around.

const SIGNED_URL_TTL_SECONDS = 60 * 10;

export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const messageId = Number(new URL(req.url).searchParams.get("messageId"));
  if (!Number.isFinite(messageId)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { data: message } = await supabaseAdmin
    .from("messages")
    .select("id, match_id, kind, audio_path")
    .eq("id", messageId)
    .maybeSingle();

  if (!message || message.kind !== "voice" || !message.audio_path) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b")
    .eq("id", message.match_id)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { data: signed, error } = await supabaseAdmin.storage
    .from("voice_messages")
    .createSignedUrl(message.audio_path, SIGNED_URL_TTL_SECONDS);

  if (error || !signed?.signedUrl) {
    console.error("[messages/audio] sign failed:", error);
    return NextResponse.json({ ok: false, error: "sign_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    url: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
