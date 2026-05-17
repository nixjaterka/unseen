import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { rateLimit } from "../../../../lib/rateLimit";
import { isPremium } from "../../../../lib/subscription";
import { sendMatchEmail } from "../../../../lib/email";

// Free tier limits
const FREE_LIKE_LIMIT    = 20;  // likes per 12-hour rolling window
const FREE_MATCH_LIMIT   = 10;  // max active (non-unmatched) matches
const PREMIUM_MATCH_LIMIT = 30;

function generateLabel() {
  const atmospheres = [
    "Midnight", "Velvet", "Silent", "Golden", "Hidden",
    "Calm", "Soft", "Wild", "Warm", "Deep",
    "Quiet", "Pale", "Amber", "Hollow", "Tender",
    "Strange", "Distant", "Still", "Salt", "Bare",
  ];
  const nouns = [
    "Harbour", "Tide", "Bloom", "Flame", "Drift",
    "Echo", "Shore", "Rain", "Stone", "Moon",
    "River", "Smoke", "Cloud", "Wave", "Glass",
    "Lake", "Path", "Field", "Light", "Sand",
  ];
  const atmosphere = atmospheres[Math.floor(Math.random() * atmospheres.length)];
  const noun       = nouns[Math.floor(Math.random() * nouns.length)];
  const number     = Math.floor(Math.random() * 90) + 10; // always 2 digits (10–99)
  return `${atmosphere}${noun}${number}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const targetId  = body?.targetId  as string | undefined;
  const direction = body?.direction as "like" | "pass" | undefined;

  if (!targetId || (direction !== "like" && direction !== "pass")) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const viewerId = user.id;

  // Anti-abuse global swipe rate limit (applies to both likes and passes).
  if (await rateLimit("swipe:action", viewerId, { requests: 300, window: "1 h" })) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // ── Like-specific checks ────────────────────────────────────────────────────
  if (direction === "like") {
    const premium = await isPremium(viewerId);

    // Free tier: 20 likes per 12-hour rolling window.
    if (!premium) {
      if (await rateLimit("swipe:like", viewerId, { requests: FREE_LIKE_LIMIT, window: "12 h" })) {
        return NextResponse.json(
          { ok: false, error: "like_limit_reached" },
          { status: 429 }
        );
      }
    }

    // Match cap check — count the user's active (non-unmatched) matches.
    const matchLimit = premium ? PREMIUM_MATCH_LIMIT : FREE_MATCH_LIMIT;
    const { count } = await supabaseAdmin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .or(`user_a.eq.${viewerId},user_b.eq.${viewerId}`)
      .is("unmatched_at", null);

    if (typeof count === "number" && count >= matchLimit) {
      return NextResponse.json(
        { ok: false, error: "match_limit_reached" },
        { status: 422 }
      );
    }
  }

  // ── Save swipe ──────────────────────────────────────────────────────────────
  const { error } = await supabaseAdmin.from("swipes").insert({
    swiper_id: viewerId,
    target_id: targetId,
    direction,
  });

  if (error) {
    const status  = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "already_swiped" : "swipe_failed";
    return NextResponse.json({ ok: false, error: message }, { status });
  }

  // ── Check for mutual match (likes only) ─────────────────────────────────────
  if (direction === "like") {
    const { data: reverse } = await supabaseAdmin
      .from("swipes")
      .select("id")
      .eq("swiper_id", targetId)
      .eq("target_id", viewerId)
      .eq("direction", "like")
      .maybeSingle();

    if (reverse) {
      const now          = new Date();
      const extraMinutes = Math.floor(Math.random() * 61); // 0–60 min jitter
      const chatUnlockAt = new Date(now.getTime() + (24 * 60 + extraMinutes) * 60 * 1000);
      const label        = generateLabel();

      const { data: newMatch } = await supabaseAdmin.from("matches").insert({
        user_a:         viewerId,
        user_b:         targetId,
        match_label:    label,
        chat_unlock_at: chatUnlockAt.toISOString(),
      }).select("id").single();

      // Send match emails to both users — fire and forget, don't block response.
      void (async () => {
        try {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const emailMap = new Map(
            (users?.users ?? []).map((u) => [u.id, u.email ?? null])
          );
          const emailA = emailMap.get(viewerId);
          const emailB = emailMap.get(targetId);
          if (emailA) sendMatchEmail(emailA, label, chatUnlockAt);
          if (emailB) sendMatchEmail(emailB, label, chatUnlockAt);
        } catch (err) {
          console.error("[match email] Failed to send:", err);
        }
      })();

      // Schedule chat-unlock notification via a lightweight check endpoint.
      // The actual sending is handled by /api/cron/chat-unlock.
      supabaseAdmin.from("match_unlock_notifications").insert({
        match_id:    newMatch?.id,
        user_a:      viewerId,
        user_b:      targetId,
        match_label: label,
        unlock_at:   chatUnlockAt.toISOString(),
        notified:    false,
      }); // Non-fatal if table doesn't exist yet
    }
  }

  return NextResponse.json({ ok: true });
}
