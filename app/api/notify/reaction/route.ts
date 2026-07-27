import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendPush } from "../../../../lib/push";

/**
 * Fire-and-forget "someone reacted to your message" push. Called by BOTH apps
 * after a reaction is added (reactions are inserted client-side directly into
 * Supabase on web and mobile, so there's no send route to hook into).
 *
 * The recipient is the SENDER of the reacted-to message. Self-reactions never
 * notify. The caller must be a member of the message's match.
 *
 * Body: { messageId: number, emoji?: string }
 */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const messageId = typeof body?.messageId === "number" ? body.messageId : Number(body?.messageId);
  if (!messageId || Number.isNaN(messageId)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  const emoji = typeof body?.emoji === "string" ? body.emoji.slice(0, 8) : "";

  const { data: message } = await supabaseAdmin
    .from("messages")
    .select("sender_id, match_id")
    .eq("id", messageId)
    .maybeSingle();
  if (!message) return NextResponse.json({ ok: true });

  // Don't notify someone for reacting to their own message.
  if (message.sender_id === user.id) return NextResponse.json({ ok: true });

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b, unmatched_at")
    .eq("id", message.match_id)
    .maybeSingle();
  if (!match || match.unmatched_at) return NextResponse.json({ ok: true });

  const callerIsMember = match.user_a === user.id || match.user_b === user.id;
  const recipientIsMember = match.user_a === message.sender_id || match.user_b === message.sender_id;
  if (!callerIsMember || !recipientIsMember) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  void sendPush(
    message.sender_id,
    {
      title: emoji ? `New reaction ${emoji}` : "New reaction",
      body: "Someone reacted to your message.",
      url: `/chat/${message.match_id}`,
    },
    "notif_message_reactions"
  );

  return NextResponse.json({ ok: true });
}
