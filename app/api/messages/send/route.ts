import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { checkContactInfo } from "../../../../lib/contactFilter";
import { rateLimit } from "../../../../lib/rateLimit";

// Server-side message send. Enforces:
//   1. Auth (getUser — server-verified, not cached JWT)
//   2. Match membership — the sender must be user_a or user_b
//   3. Match is not unmatched and chat is unlocked
//   4. Contact info filter (same rules as client-side, but now enforceable)
//   5. Content length cap

const MAX_LENGTH = 2000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const matchId = typeof body?.matchId === "number" ? body.matchId : null;
  const rawContent = typeof body?.content === "string" ? body.content.trim() : null;

  if (!matchId || !rawContent) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (rawContent.length > MAX_LENGTH) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }

  // 1. Verify the sender is authenticated (server-side check, not cached JWT).
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  // 60 messages per user per minute — prevents spam floods.
  if (await rateLimit("messages:send", user.id, { requests: 60, window: "1 m" })) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // 2. Load the match and verify membership + state.
  const { data: match, error: matchErr } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b, unmatched_at, chat_unlock_at")
    .eq("id", matchId)
    .maybeSingle();

  if (matchErr || !match) {
    return NextResponse.json({ ok: false, error: "match_not_found" }, { status: 404 });
  }

  const isMember = match.user_a === user.id || match.user_b === user.id;
  if (!isMember) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  if (match.unmatched_at) {
    return NextResponse.json({ ok: false, error: "conversation_ended" }, { status: 403 });
  }

  if (new Date() < new Date(match.chat_unlock_at)) {
    return NextResponse.json({ ok: false, error: "chat_locked" }, { status: 403 });
  }

  // 3. Contact info filter — server-side enforcement.
  // Normalise Unicode first to defeat lookalike bypasses.
  const normalised = rawContent.normalize("NFKC");
  const filterResult = checkContactInfo(normalised);
  if (filterResult.blocked) {
    return NextResponse.json(
      { ok: false, error: "contact_info_blocked", reason: filterResult.reason },
      { status: 422 }
    );
  }

  // 4. Insert via service-role client (bypasses RLS; we've already verified
  //    membership above so this is safe).
  const { error: insertErr } = await supabaseAdmin.from("messages").insert({
    match_id: matchId,
    sender_id: user.id,
    content: rawContent,
  });

  if (insertErr) {
    return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
