import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { checkVoiceGate } from "../../../../lib/voiceGate";

// Whether voice messages are unlocked in this conversation yet, so the UI can
// show the mic (or explain why it isn't there) without guessing.
//
//   GET /api/messages/voice-gate?matchId=123
//     -> { ok: true, gate: { unlocked, mine, theirs, needed } }

export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const matchId = Number(new URL(req.url).searchParams.get("matchId"));
  if (!Number.isFinite(matchId)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;
  const gate = await checkVoiceGate(matchId, user.id, otherUserId);

  return NextResponse.json({ ok: true, gate });
}
