import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendSMS } from "../../../../lib/sms";
import { sendPush } from "../../../../lib/push";

// Posts the shared date card into the chat — seen by BOTH people. Only public
// details go in (time, place, map point); safety contact + notes never do.
async function postDateCard(opts: {
  matchId: number; senderId: string; otherUserId: string; planId: number;
  action: "planned" | "changed" | "cancelled"; plannedFor: string; place: string;
  lat?: number | null; lon?: number | null;
}) {
  const when = new Date(opts.plannedFor).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Prague",
  });
  const text = opts.action === "planned"
    ? `📅 Date planned: ${when} · ${opts.place}`
    : opts.action === "changed"
    ? `📅 Date changed: ${when} · ${opts.place}`
    : `📅 Date cancelled: ${when} · ${opts.place}`;
  await supabaseAdmin.from("messages").insert({
    match_id: opts.matchId,
    sender_id: opts.senderId,
    content: text, // fallback text for previews / older app versions
    kind: "date_plan",
    meta: {
      planId: opts.planId, action: opts.action, plannedFor: opts.plannedFor, place: opts.place,
      ...(typeof opts.lat === "number" && typeof opts.lon === "number" ? { lat: opts.lat, lon: opts.lon } : {}),
    },
  });
  void sendPush(opts.otherUserId, {
    title: opts.action === "planned" ? "A date was planned 📅"
      : opts.action === "changed" ? "Your date was changed 📅"
      : "A date was cancelled",
    body: `${when} · ${opts.place}`,
    url: `/chat/${opts.matchId}`,
  }, "notif_messages");
}

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

type Personal = { notes: string; safetyEnabled: boolean; friendName: string; friendPhone: string };

// Each person's PRIVATE part of a date (notes + their own safety friend).
// Stored in date_plan_personal; older plans kept the planner's details on
// date_plans itself, which is still read as a fallback.
async function getPersonal(
  plan: { id: number; created_by: string; notes?: string | null; safety_enabled?: boolean | null; emergency_contact_name?: string | null; emergency_contact_phone?: string | null },
  userId: string
): Promise<Personal> {
  const { data: row } = await supabaseAdmin
    .from("date_plan_personal").select("notes, safety_enabled, friend_name, friend_phone")
    .eq("date_plan_id", plan.id).eq("user_id", userId).maybeSingle();
  if (row) {
    return { notes: row.notes ?? "", safetyEnabled: !!row.safety_enabled, friendName: row.friend_name ?? "", friendPhone: row.friend_phone ?? "" };
  }
  if (plan.created_by === userId) {
    return {
      notes: plan.notes ?? "", safetyEnabled: !!plan.safety_enabled,
      friendName: plan.emergency_contact_name ?? "", friendPhone: plan.emergency_contact_phone ?? "",
    };
  }
  return { notes: "", safetyEnabled: false, friendName: "", friendPhone: "" };
}

// Save one person's private part and keep THEIR check-ins + friend SMS in sync.
async function applyPersonal(opts: {
  planId: number; matchId: number; matchLabel: string; userId: string; isPlanner: boolean;
  plannedFor: string; next: Personal; prev: Personal;
}): Promise<boolean> {
  const { planId, matchId, userId, next, prev } = opts;
  const safetyOn = next.safetyEnabled && !!next.friendName && !!next.friendPhone;

  const { error: saveErr } = await supabaseAdmin.from("date_plan_personal").upsert({
    date_plan_id: planId, user_id: userId,
    notes: next.notes || null,
    safety_enabled: safetyOn,
    friend_name: safetyOn ? next.friendName : null,
    friend_phone: safetyOn ? next.friendPhone : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "date_plan_id,user_id" });
  // Non-planners have nowhere else to store their safety friend — never
  // pretend it saved. (Planners are also mirrored onto date_plans below.)
  if (saveErr) {
    console.error("[date/plan] personal save failed:", saveErr.message);
    if (!opts.isPlanner) return false;
  }

  // Keep the legacy columns in step for the planner (older screens read them).
  if (opts.isPlanner) {
    await supabaseAdmin.from("date_plans").update({
      notes: next.notes || null,
      safety_enabled: safetyOn,
      emergency_contact_name: safetyOn ? next.friendName : null,
      emergency_contact_phone: safetyOn ? next.friendPhone : null,
    }).eq("id", planId);
  }

  // This person's check-ins.
  const { data: existing } = await supabaseAdmin
    .from("date_checkins").select("id")
    .eq("date_plan_id", planId).eq("user_id", userId).in("status", ["pending", "notified", "reminded"]);
  if (!safetyOn) {
    if ((existing ?? []).length) {
      await supabaseAdmin.from("date_checkins").delete()
        .eq("date_plan_id", planId).eq("user_id", userId).in("status", ["pending", "notified", "reminded"]);
    }
    return true;
  }
  if (!(existing ?? []).length) {
    const start = new Date(opts.plannedFor).getTime();
    await supabaseAdmin.from("date_checkins").insert([
      { date_plan_id: planId, user_id: userId, match_id: matchId, kind: "first",  due_at: new Date(start + CHECKIN_1_MIN * 60000).toISOString() },
      { date_plan_id: planId, user_id: userId, match_id: matchId, kind: "second", due_at: new Date(start + CHECKIN_2_MIN * 60000).toISOString() },
    ]);
  }

  // Heads-up SMS to the friend — when safety is newly on or the friend changed.
  const friendChanged = !prev.safetyEnabled || prev.friendPhone !== next.friendPhone;
  if (friendChanged) {
    const { data: prof } = await supabaseAdmin.from("profiles").select("first_name").eq("user_id", userId).maybeSingle();
    const first = prof?.first_name || "Your friend";
    const when = new Date(opts.plannedFor).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Prague" });
    const link = (process.env.NEXT_PUBLIC_APP_URL ?? "https://unseenapp.cz") + "/safety";
    const sms = await sendSMS(
      next.friendPhone,
      `${first} is going on a date with their Unseen match "${opts.matchLabel}" on ${when}. If something seems off you may be contacted. More info: ${link}`
    );
    if (sms.ok) {
      await supabaseAdmin.from("date_plan_personal").update({ friend_notified_at: new Date().toISOString() })
        .eq("date_plan_id", planId).eq("user_id", userId);
    }
  }
  return true;
}

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
  const placeLat = typeof body?.placeLat === "number" ? body.placeLat : null;
  const placeLon = typeof body?.placeLon === "number" ? body.placeLon : null;

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
    .from("matches").select("user_a, user_b, match_label, unmatched_at").eq("id", matchId).maybeSingle();
  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (match.unmatched_at) {
    return NextResponse.json({ ok: false, error: "conversation_ended" }, { status: 409 });
  }
  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;

  const { data: plan, error: planErr } = await supabaseAdmin
    .from("date_plans")
    .insert({
      match_id: matchId,
      created_by: user.id,
      planned_for: plannedFor,
      place,
      check_in_after_minutes: CHECKIN_1_MIN,
      status: "scheduled",
    })
    .select("id")
    .single();
  if (planErr || !plan) {
    return NextResponse.json({ ok: false, error: planErr?.message ?? "insert_failed" }, { status: 500 });
  }

  await applyPersonal({
    planId: plan.id, matchId, matchLabel: match.match_label ?? "", userId: user.id, isPlanner: true,
    plannedFor,
    next: { notes, safetyEnabled, friendName, friendPhone },
    prev: { notes: "", safetyEnabled: false, friendName: "", friendPhone: "" },
  });

  await postDateCard({
    matchId, senderId: user.id, otherUserId, planId: plan.id, action: "planned",
    plannedFor, place, lat: placeLat, lon: placeLon,
  });

  return NextResponse.json({ ok: true, id: plan.id });
}

// Cancel a date — either person in the match. Marks it cancelled, drops
// the pending safety check-ins, and posts a "cancelled" card for both.
// Body: { planId }
export async function DELETE(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const planId = Number(body?.planId);
  if (!planId) return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });

  const { data: plan } = await supabaseAdmin
    .from("date_plans").select("id, match_id, created_by, planned_for, place, status")
    .eq("id", planId).maybeSingle();
  if (!plan) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (plan.status === "cancelled") return NextResponse.json({ ok: true });

  // Either person in the match may cancel — the date belongs to both.
  const { data: match } = await supabaseAdmin
    .from("matches").select("user_a, user_b").eq("id", plan.match_id).maybeSingle();
  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;

  await supabaseAdmin.from("date_plans").update({ status: "cancelled" }).eq("id", planId);
  await supabaseAdmin.from("date_checkins").delete().eq("date_plan_id", planId).in("status", ["pending", "notified", "reminded"]);

  await postDateCard({
    matchId: plan.match_id, senderId: user.id, otherUserId, planId, action: "cancelled",
    plannedFor: plan.planned_for, place: plan.place,
  });

  return NextResponse.json({ ok: true });
}

// Latest card meta for a plan — where the map point (lat/lon) lives.
async function latestCardMeta(matchId: number, planId: number) {
  const { data } = await supabaseAdmin
    .from("messages").select("meta")
    .eq("match_id", matchId).eq("kind", "date_plan")
    .order("created_at", { ascending: false }).limit(20);
  return ((data ?? []) as { meta: any }[]).map((r) => r.meta).find((m) => m?.planId === planId) ?? null;
}

// GET /api/date/plan?matchId=… — the current (not cancelled, not long past)
// date for this match, so either person can open it pre-filled.
// Private fields (notes, safety friend) are returned per person — each caller
// gets only their own.
export async function GET(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const matchId = Number(new URL(req.url).searchParams.get("matchId"));
  if (!matchId) return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });

  const { data: match } = await supabaseAdmin
    .from("matches").select("user_a, user_b").eq("id", matchId).maybeSingle();
  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // dates stay "current" until 3 h after start
  const { data: plan } = await supabaseAdmin
    .from("date_plans")
    .select("id, created_by, planned_for, place, notes, safety_enabled, emergency_contact_name, emergency_contact_phone")
    .eq("match_id", matchId).neq("status", "cancelled").gte("planned_for", since)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!plan) return NextResponse.json({ ok: true, plan: null });

  const meta = await latestCardMeta(matchId, plan.id);
  const mine = plan.created_by === user.id;
  // The caller's OWN private part only — never the other person's.
  const personal = await getPersonal(plan, user.id);
  return NextResponse.json({
    ok: true,
    plan: {
      id: plan.id,
      plannedFor: plan.planned_for,
      place: plan.place,
      lat: typeof meta?.lat === "number" ? meta.lat : null,
      lon: typeof meta?.lon === "number" ? meta.lon : null,
      mine,
      ...personal,
    },
  });
}

// PATCH /api/date/plan — change time/place. Either person may do it.
// Body: { planId, plannedFor, place, placeLat?, placeLon?,
//         notes?, safetyEnabled?, friendName?, friendPhone? }
// The personal fields apply to the CALLER only (each person has their own).
// Everyone's pending check-ins move with the new time.
export async function PATCH(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const planId = Number(body?.planId);
  const plannedFor = typeof body?.plannedFor === "string" ? body.plannedFor : null;
  const place = typeof body?.place === "string" ? body.place.trim() : "";
  const placeLat = typeof body?.placeLat === "number" ? body.placeLat : null;
  const placeLon = typeof body?.placeLon === "number" ? body.placeLon : null;
  if (!planId || !plannedFor || !place || Number.isNaN(new Date(plannedFor).getTime())) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { data: plan } = await supabaseAdmin
    .from("date_plans").select("id, match_id, created_by, planned_for, place, status, notes, safety_enabled, emergency_contact_name, emergency_contact_phone")
    .eq("id", planId).maybeSingle();
  if (!plan || plan.status === "cancelled") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  const { data: match } = await supabaseAdmin
    .from("matches").select("user_a, user_b, unmatched_at, match_label").eq("id", plan.match_id).maybeSingle();
  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (match.unmatched_at) {
    return NextResponse.json({ ok: false, error: "conversation_ended" }, { status: 409 });
  }
  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;
  const isPlanner = plan.created_by === user.id;

  const prevPersonal = await getPersonal(plan, user.id);
  await supabaseAdmin.from("date_plans").update({ planned_for: plannedFor, place }).eq("id", planId);

  // Move everyone's pending check-ins to the new time.
  const shiftMs = new Date(plannedFor).getTime() - new Date(plan.planned_for).getTime();
  if (shiftMs !== 0) {
    const { data: checks } = await supabaseAdmin
      .from("date_checkins").select("id, due_at")
      .eq("date_plan_id", planId).eq("status", "pending");
    for (const c of (checks ?? []) as { id: number; due_at: string }[]) {
      await supabaseAdmin.from("date_checkins")
        .update({ due_at: new Date(new Date(c.due_at).getTime() + shiftMs).toISOString() })
        .eq("id", c.id);
    }
  }

  // The caller's own private part (only if they sent it).
  if ("safetyEnabled" in (body ?? {}) || "notes" in (body ?? {})) {
    const next: Personal = {
      notes: typeof body?.notes === "string" ? body.notes.trim() : prevPersonal.notes,
      safetyEnabled: "safetyEnabled" in body ? !!body.safetyEnabled : prevPersonal.safetyEnabled,
      friendName: typeof body?.friendName === "string" ? body.friendName.trim() : prevPersonal.friendName,
      friendPhone: typeof body?.friendPhone === "string" ? body.friendPhone.trim() : prevPersonal.friendPhone,
    };
    if (next.safetyEnabled && (!next.friendName || !next.friendPhone)) {
      return NextResponse.json({ ok: false, error: "friend_required" }, { status: 400 });
    }
    const saved = await applyPersonal({
      planId, matchId: plan.match_id, matchLabel: match.match_label ?? "", userId: user.id, isPlanner,
      plannedFor, next, prev: prevPersonal,
    });
    if (!saved) {
      return NextResponse.json({ ok: false, error: "personal_save_failed" }, { status: 500 });
    }
  }

  const timeOrPlaceChanged = shiftMs !== 0 || place !== plan.place;
  if (timeOrPlaceChanged) {
    // Keep the old map point if the place text didn't change.
    let lat = placeLat, lon = placeLon;
    if (place === plan.place && (lat === null || lon === null)) {
      const meta = await latestCardMeta(plan.match_id, planId);
      lat = typeof meta?.lat === "number" ? meta.lat : null;
      lon = typeof meta?.lon === "number" ? meta.lon : null;
    }
    await postDateCard({
      matchId: plan.match_id, senderId: user.id, otherUserId, planId, action: "changed",
      plannedFor, place, lat, lon,
    });
  }

  return NextResponse.json({ ok: true, id: planId });
}
