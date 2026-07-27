import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendPush } from "../../../../lib/push";

/**
 * Fire-and-forget "you have a new message" push, called by the MOBILE app after
 * it inserts a message directly into Supabase (the web app pushes inline from
 * /api/messages/send, so web senders don't use this route).
 *
 * Anti-spoof: we ignore any client-supplied content and instead read the LATEST
 * message in the match, verifying it was sent by the caller. So a user can only
 * ever trigger a notification for their own just-sent message.
 *
 * Body: { matchId: number }
 */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const matchId = typeof body?.matchId === "number" ? body.matchId : Number(body?.matchId);
  if (!matchId || Number.isNaN(matchId)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b, unmatched_at")
    .eq("id", matchId)
    .maybeSingle();
  if (!match || match.unmatched_at) return NextResponse.json({ ok: true });

  const isMember = match.user_a === user.id || match.user_b === user.id;
  if (!isMember) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { data: latest } = await supabaseAdmin
    .from("messages")
    .select("sender_id, content")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Only notify for the caller's own most recent message.
  if (!latest || latest.sender_id !== user.id) return NextResponse.json({ ok: true });

  const recipientId = match.user_a === user.id ? match.user_b : match.user_a;
  const preview = latest.content.length > 80 ? latest.content.slice(0, 77) + "…" : latest.content;

  void sendPush(
    recipientId,
    { title: "New message 💬", body: preview, url: `/chat/${matchId}` },
    "notif_messages"
  );

  return NextResponse.json({ ok: true });
}
