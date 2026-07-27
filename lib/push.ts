import webpush from "web-push";
import { supabaseAdmin } from "./supabaseAdmin";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Send a push to ALL of a user's registered devices — both web-push (browser)
 * subscriptions AND Expo push tokens (the React Native apps). The two transports
 * are fully isolated: a failure or outage in one can never affect the other, and
 * neither can throw out of here (all callers use `void sendPush(...)`).
 *
 * @param pref  Optional `profiles` boolean column (e.g. "notif_messages"). When
 *              provided, the notification is skipped if that column is explicitly
 *              false. A missing column or lookup failure never blocks the send.
 */
export async function sendPush(userId: string, payload: PushPayload, pref?: string) {
  if (pref) {
    try {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select(pref)
        .eq("user_id", userId)
        .maybeSingle();
      if (prof && (prof as Record<string, unknown>)[pref] === false) return;
    } catch {
      /* pref column missing / lookup failed → don't block the notification */
    }
  }

  await Promise.allSettled([sendWebPush(userId, payload), sendExpoPush(userId, payload)]);
}

// ── Browser web-push ────────────────────────────────────────────────────────
async function sendWebPush(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:hello@unseenapp.cz",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error || !subs || subs.length === 0) return;

  const staleIds: number[] = [];
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) staleIds.push(sub.id);
      }
    })
  );
  if (staleIds.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", staleIds);
  }
}

// ── Expo push (the React Native apps) ───────────────────────────────────────
// Delivers via Expo's push service. Reads the token from profiles.expo_push_token.
// Wholly try/catch-wrapped so a missing column or Expo outage can never affect
// the web-push path above.
async function sendExpoPush(userId: string, payload: PushPayload) {
  try {
    const { data: prof, error } = await supabaseAdmin
      .from("profiles")
      .select("expo_push_token")
      .eq("user_id", userId)
      .maybeSingle();
    const token = (prof as { expo_push_token?: string | null } | null)?.expo_push_token;
    if (error || !token) return;

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: token,
        title: payload.title,
        body: payload.body,
        sound: "default",
        badge: 1,
        data: { url: payload.url ?? null },
      }),
    });

    // Drop a token Expo reports as permanently unregistered.
    const json = (await res.json().catch(() => null)) as
      | { data?: { status?: string; details?: { error?: string } } | Array<{ status?: string; details?: { error?: string } }> }
      | null;
    const entry = Array.isArray(json?.data) ? json?.data[0] : json?.data;
    if (entry?.status === "error" && entry?.details?.error === "DeviceNotRegistered") {
      await supabaseAdmin.from("profiles").update({ expo_push_token: null }).eq("user_id", userId);
    }
  } catch {
    /* never let Expo delivery break the request */
  }
}
