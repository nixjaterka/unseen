import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { isBlockedPair } from "../../../../lib/blocks";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { checkContactInfo, checkContactInfoInContext } from "../../../../lib/contactFilter";
import { rateLimit } from "../../../../lib/rateLimit";
import { sendPush } from "../../../../lib/push";

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
  const replyToId = typeof body?.replyToId === "number" ? body.replyToId : null;

  if (!matchId || !rawContent) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (rawContent.length > MAX_LENGTH) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }

  // 1. Verify the sender is authenticated (server-side check, not cached JWT).
  //    Cookie auth for web, `Authorization: Bearer <jwt>` for the mobile apps.
  const user = await getApiUser();

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

  // Either side having blocked the other ends sending, in both directions.
  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;
  if (await isBlockedPair(user.id, otherUserId)) {
    return NextResponse.json({ ok: false, error: "blocked" }, { status: 403 });
  }

  if (match.unmatched_at) {
    return NextResponse.json({ ok: false, error: "conversation_ended" }, { status: 403 });
  }

  const matchExpiresAt = new Date(new Date(match.chat_unlock_at).getTime() + 7 * 24 * 60 * 60 * 1000);
  if (new Date() > matchExpiresAt) {
    // Only block if no messages have been sent yet — active conversations never expire
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("match_id", matchId);
    if (!count || count === 0) {
      return NextResponse.json({ ok: false, error: "conversation_expired" }, { status: 403 });
    }
  }

  if (new Date() < new Date(match.chat_unlock_at)) {
    return NextResponse.json({ ok: false, error: "chat_locked" }, { status: 403 });
  }

  // 3. Contact info filter — server-side enforcement.
  // Normalise Unicode first to defeat lookalike bypasses.
  const normalised = rawContent.normalize("NFKC");

  // Fetch last 10 messages for contextual handle detection (e.g. bare username
  // sent in response to someone asking for ig/snap). Non-fatal if this fails.
  const { data: recentMessages } = await supabaseAdmin
    .from("messages")
    .select("sender_id, content")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(10);

  const filterResult = checkContactInfoInContext(
    normalised,
    recentMessages ?? [],
    user.id
  );
  if (filterResult.blocked) {
    return NextResponse.json(
      { ok: false, error: "contact_info_blocked", reason: filterResult.reason },
      { status: 422 }
    );
  }

  // 4. Insert via service-role client (bypasses RLS; we've already verified
  //    membership above so this is safe).
  //    reply_to_id is trusted only if it belongs to the same match.
  let verifiedReplyToId: number | null = null;
  if (replyToId) {
    const { data: replyMsg } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("id", replyToId)
      .eq("match_id", matchId)
      .maybeSingle();
    verifiedReplyToId = replyMsg ? replyToId : null;
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: user.id,
      content: rawContent,
      ...(verifiedReplyToId ? { reply_to_id: verifiedReplyToId } : {}),
    })
    .select("*")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json({ ok: false, error: insertErr?.message ?? "insert_failed" }, { status: 500 });
  }

  // Push notification to the other person — fire and forget.
  void sendPush(otherUserId, {
    title: "New message 💬",
    body: rawContent.length > 80 ? rawContent.slice(0, 77) + "…" : rawContent,
    url: `/chat/${matchId}`,
  }, "notif_messages");

  return NextResponse.json({ ok: true, message: inserted });
}
