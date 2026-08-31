import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isBlockedPair } from "../../../../lib/blocks";
import { rateLimit } from "../../../../lib/rateLimit";
import { sendPush } from "../../../../lib/push";
import { checkVoiceGate } from "../../../../lib/voiceGate";

// Voice message upload. multipart/form-data:
//   audio    — the recording (m4a from mobile, webm from the browser)
//   matchId  — number
//   duration — milliseconds, client-reported
//
// The audio itself is never inspected. That is deliberate: Nikol's call is
// that the contact filter is a speed bump, not a wall, and someone who reads
// their number aloud is the other person's problem to report. Nothing here
// transcribes or scans the recording.

const MAX_DURATION_MS = 60_000;
const MAX_BYTES = 2 * 1024 * 1024; // 60s of AAC/Opus lands well under this

const ALLOWED: Record<string, string> = {
  "audio/m4a": "m4a",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  if (await rateLimit("messages:voice", user.id, { requests: 30, window: "1 m" })) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  const matchId = Number(form?.get("matchId"));
  const duration = Number(form?.get("duration"));

  if (!(file instanceof File) || !Number.isFinite(matchId) || !Number.isFinite(duration)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  if (duration <= 0 || duration > MAX_DURATION_MS) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 400 });
  }

  const ext = ALLOWED[file.type.split(";")[0].trim().toLowerCase()];
  if (!ext) {
    return NextResponse.json({ ok: false, error: "unsupported_format" }, { status: 400 });
  }

  // Same conversation-state checks the text route runs.
  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b, unmatched_at, chat_unlock_at")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ ok: false, error: "match_not_found" }, { status: 404 });
  }
  if (match.user_a !== user.id && match.user_b !== user.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (match.unmatched_at) {
    return NextResponse.json({ ok: false, error: "conversation_ended" }, { status: 403 });
  }
  if (new Date() < new Date(match.chat_unlock_at)) {
    return NextResponse.json({ ok: false, error: "chat_locked" }, { status: 403 });
  }

  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;
  if (await isBlockedPair(user.id, otherUserId)) {
    return NextResponse.json({ ok: false, error: "blocked" }, { status: 403 });
  }

  const gate = await checkVoiceGate(matchId, user.id, otherUserId);
  if (!gate.unlocked) {
    return NextResponse.json(
      { ok: false, error: "voice_locked", gate },
      { status: 403 }
    );
  }

  // Path is scoped by match so a purge can drop a whole conversation's audio.
  const path = `${matchId}/${user.id}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("voice_messages")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadErr) {
    console.error("[messages/voice] upload failed:", uploadErr);
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: user.id,
      content: "",
      kind: "voice",
      audio_path: path,
      audio_duration_ms: Math.round(duration),
    })
    .select("*")
    .single();

  if (insertErr || !inserted) {
    // Don't leave an orphaned object behind.
    await supabaseAdmin.storage.from("voice_messages").remove([path]);
    console.error("[messages/voice] insert failed:", insertErr);
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
  }

  void sendPush(
    otherUserId,
    { title: "New voice message 🎤", body: "Tap to listen", url: `/chat/${matchId}` },
    "notif_messages"
  );

  return NextResponse.json({ ok: true, message: inserted });
}
