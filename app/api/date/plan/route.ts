import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendSMS } from "../../../../lib/sms";

// Create a date plan (+ optional safety check-in with a friend). Called by both
// apps. When safety is on: stores the friend's contact, schedules two check-ins
// (+10 / +30 min from the date start), and texts the friend an intro SMS.
//
// NOTE: reuses the EXISTING date_plans columns — the user is `created_by`, and
// the safety contact is stored in `emergency_contact_name` / `_phone` (the same
// columns the web chat "Plan a date" flow already writes). safety_enabled,
// status and friend_notified_at are the only new columns this feature added.
//
// Body: { matchId, plannedFor(ISO), place, notes?, safetyEnabled, friendName?, friendPhone? }

const CHECKIN_1_MIN = 10; // first check-in, minutes after date start
const CHECKIN_2_MIN = 30; // second check-in

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const matchId = Number(body?.matchId);
  const plannedFor = typeof body?.plannedFor === "string" ? body.plannedFor : null;
  const place = typeof body?.place === "string" ? body.place.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const safetyEnabled = !!body?.safetyEnabled;
  const friendName = typeof body?.friendName === "string" ? body.friendName.trim() : "";
  const friendPhone = typeof body?.friendPhone === "string" ? body.friendPhone.trim() : "";

  if (!matchId || Number.isNaN(matchId) || !plannedFor || !place) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  if (Number.isNaN(new Date(plannedFor).getTime())) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }
  if (safetyEnabled && (!friendName || !friendPhone)) {
    return NextResponse.json({ ok: false, error: "friend_required" }, { status: 400 });
  }

  const { data: match } = await supabaseAdmin
    .from("matches").select("user_a, user_b, match_label").eq("id", matchId).maybeSingle();
  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { data: plan, error: planErr } = await supabaseAdmin
    .from("date_plans")
    .insert({
      match_id: matchId,
      created_by: user.id,
      planned_for: plannedFor,
      place,
      notes: notes || null,
      safety_enabled: safetyEnabled,
      emergency_contact_name: safetyEnabled ? friendName : null,
      emergency_contact_phone: safetyEnabled ? friendPhone : null,
      check_in_after_minutes: CHECKIN_1_MIN,
      status: "scheduled",
    })
    .select("id")
    .single();
  if (planErr || !plan) {
    return NextResponse.json({ ok: false, error: planErr?.message ?? "insert_failed" }, { status: 500 });
  }

  if (safetyEnabled) {
    const start = new Date(plannedFor).getTime();
    await supabaseAdmin.from("date_checkins").insert([
      { date_plan_id: plan.id, user_id: user.id, match_id: matchId, kind: "first",  due_at: new Date(start + CHECKIN_1_MIN * 60000).toISOString() },
      { date_plan_id: plan.id, user_id: user.id, match_id: matchId, kind: "second", due_at: new Date(start + CHECKIN_2_MIN * 60000).toISOString() },
    ]);

    // Intro SMS to the friend.
    const { data: prof } = await supabaseAdmin.from("profiles").select("first_name").eq("user_id", user.id).maybeSingle();
    const first = prof?.first_name || "Your friend";
    const when = new Date(plannedFor).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    const link = (process.env.NEXT_PUBLIC_APP_URL ?? "https://unseenapp.cz") + "/safety";
    const smsBody = `${first} is going on a date with her Unseen match "${match.match_label}" on ${when}. If something seems off you may be contacted. More info: ${link}`;
    const sms = await sendSMS(friendPhone, smsBody);
    if (sms.ok) {
      await supabaseAdmin.from("date_plans").update({ friend_notified_at: new Date().toISOString() }).eq("id", plan.id);
    }
  }

  return NextResponse.json({ ok: true, id: plan.id });
}
