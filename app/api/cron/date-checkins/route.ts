import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendPush } from "../../../../lib/push";
import { sendSMS } from "../../../../lib/sms";

// Date-safety check-in engine. MUST run frequently (every minute) — the windows
// below are 5 minutes. On Vercel this needs a Pro plan (1-min crons) OR an
// external minute-scheduler (e.g. cron-job.org) hitting this URL with the
// Authorization: Bearer <CRON_SECRET> header.
//
// State machine per check-in row:
//   pending  --(due)-->            notified   (push #1: "are you safe?")
//   notified --(+REMIND_MIN)-->    reminded   (push #2: reminder)
//   reminded --(+ESCALATE_MIN)-->  escalated  (SMS the friend)
//   any      --(user taps)-->      responded  (terminal — app sets this via RLS)

const REMIND_AFTER_MIN = 5;   // no response within 5 min of first push → remind
const ESCALATE_AFTER_MIN = 5; // no response within 5 min of reminder → tell the friend

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // 1) Due, not yet notified → first check-in push.
  const { data: due } = await supabaseAdmin
    .from("date_checkins")
    .select("id, user_id, match_id")
    .eq("status", "pending")
    .lte("due_at", nowIso)
    .limit(200);
  for (const c of due ?? []) {
    await sendPush(c.user_id, {
      title: "Date safety check 💗",
      body: "Tap to let us know you're safe.",
      url: `/chat/${c.match_id}?checkin=${c.id}`,
    });
    await supabaseAdmin.from("date_checkins").update({ status: "notified", notified_at: nowIso }).eq("id", c.id);
  }

  // 2) Notified, still no response after the remind window → reminder push.
  const remindBefore = new Date(now.getTime() - REMIND_AFTER_MIN * 60000).toISOString();
  const { data: toRemind } = await supabaseAdmin
    .from("date_checkins")
    .select("id, user_id, match_id")
    .eq("status", "notified")
    .lte("notified_at", remindBefore)
    .limit(200);
  for (const c of toRemind ?? []) {
    await sendPush(c.user_id, {
      title: "Still there? 💗",
      body: "Please check in — tap to confirm you're safe.",
      url: `/chat/${c.match_id}?checkin=${c.id}`,
    });
    await supabaseAdmin.from("date_checkins").update({ status: "reminded", reminded_at: nowIso }).eq("id", c.id);
  }

  // 3) Reminded, still no response after the escalate window → SMS the friend.
  const escalateBefore = new Date(now.getTime() - ESCALATE_AFTER_MIN * 60000).toISOString();
  const { data: toEscalate } = await supabaseAdmin
    .from("date_checkins")
    .select("id, user_id, date_plan_id")
    .eq("status", "reminded")
    .lte("reminded_at", escalateBefore)
    .limit(200);
  for (const c of toEscalate ?? []) {
    const { data: plan } = await supabaseAdmin
      .from("date_plans").select("emergency_contact_name, emergency_contact_phone").eq("id", c.date_plan_id).maybeSingle();
    if (plan?.emergency_contact_phone) {
      const { data: prof } = await supabaseAdmin.from("profiles").select("first_name").eq("user_id", c.user_id).maybeSingle();
      const first = prof?.first_name || "Your friend";
      const link = (process.env.NEXT_PUBLIC_APP_URL ?? "https://unseenapp.cz") + "/safety";
      await sendSMS(
        plan.emergency_contact_phone,
        `${first} isn't responding to our Unseen date safety check-in. Please try to reach them. ${link}`
      );
    }
    await supabaseAdmin.from("date_checkins").update({ status: "escalated", escalated_at: nowIso }).eq("id", c.id);
  }

  return NextResponse.json({
    ok: true,
    notified: (due ?? []).length,
    reminded: (toRemind ?? []).length,
    escalated: (toEscalate ?? []).length,
  });
}
