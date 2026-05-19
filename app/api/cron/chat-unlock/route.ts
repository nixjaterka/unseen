import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendChatUnlockedEmail } from "../../../../lib/email";
import { sendPush } from "../../../../lib/push";

// Cron endpoint — called every 15 minutes by Vercel Cron.
// Finds matches whose chat just unlocked and sends notification emails.
//
// Secured with CRON_SECRET env var — Vercel passes it automatically when
// configured in vercel.json. Set CRON_SECRET in Vercel environment variables.

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Find notifications due in the last 20 minutes that haven't been sent yet.
  // The 20-min window handles cases where the cron ran slightly late.
  const now = new Date();
  const windowStart = new Date(now.getTime() - 20 * 60 * 1000);

  const { data: pending, error } = await supabaseAdmin
    .from("match_unlock_notifications")
    .select("id, match_id, user_a, user_b, match_label")
    .eq("notified", false)
    .lte("unlock_at", now.toISOString())
    .gte("unlock_at", windowStart.toISOString());

  if (error) {
    console.error("[cron/chat-unlock] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Look up emails for all involved users in one call.
  const userIds = [...new Set(pending.flatMap((n) => [n.user_a, n.user_b]))];
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailMap = new Map(
    (authUsers?.users ?? [])
      .filter((u) => userIds.includes(u.id))
      .map((u) => [u.id, u.email ?? null])
  );

  let sent = 0;

  for (const notification of pending) {
    const emailA = emailMap.get(notification.user_a);
    const emailB = emailMap.get(notification.user_b);

    await Promise.all([
      emailA ? sendChatUnlockedEmail(emailA, notification.match_label, notification.match_id) : Promise.resolve(),
      emailB ? sendChatUnlockedEmail(emailB, notification.match_label, notification.match_id) : Promise.resolve(),
      sendPush(notification.user_a, { title: "Chat unlocked! 🔓", body: `Your chat with ${notification.match_label} is now open.`, url: `/chat/${notification.match_id}` }),
      sendPush(notification.user_b, { title: "Chat unlocked! 🔓", body: `Your chat with ${notification.match_label} is now open.`, url: `/chat/${notification.match_id}` }),
    ]);

    // Mark as notified
    await supabaseAdmin
      .from("match_unlock_notifications")
      .update({ notified: true })
      .eq("id", notification.id);

    sent++;
  }

  console.log(`[cron/chat-unlock] Sent ${sent} notifications`);
  return NextResponse.json({ ok: true, sent });
}
