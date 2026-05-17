import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const targetId = body?.targetId as string | undefined;
  const direction = body?.direction as "like" | "pass" | undefined;

  if (!targetId || (direction !== "like" && direction !== "pass")) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const viewerId = user.id;

  // 1. Save swipe
const { error } = await supabaseAdmin.from("swipes").insert({
  swiper_id: viewerId,
  target_id: targetId,
  direction,
});

if (error) {
  // Use 409 for duplicate swipes (unique constraint), 500 for other errors.
  // Never return raw DB error messages to the client.
  const status = error.code === "23505" ? 409 : 500;
  const message = error.code === "23505" ? "already_swiped" : "swipe_failed";
  return NextResponse.json({ ok: false, error: message }, { status });
}

// 2. Only check for match if it's a LIKE
if (direction === "like") {
  const { data: reverse } = await supabaseAdmin
    .from("swipes")
    .select("id")
    .eq("swiper_id", targetId)
    .eq("target_id", viewerId)
    .eq("direction", "like")
    .maybeSingle();

  if (reverse) {
    // generate match label
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
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 90) + 10; // always 2 digits (10–99)

  return `${atmosphere}${noun}${number}`;
}

const label = generateLabel();

const now = new Date();
const extraMinutes = Math.floor(Math.random() * 61); // 0 to 60
const chatUnlockAt = new Date(now.getTime() + (24 * 60 + extraMinutes) * 60 * 1000);

await supabaseAdmin.from("matches").insert({
  user_a: viewerId,
  user_b: targetId,
  match_label: label,
  chat_unlock_at: chatUnlockAt.toISOString(),
});
  }
}

return NextResponse.json({ ok: true });
}