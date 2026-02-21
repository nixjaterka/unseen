import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const body = await req.json().catch(() => null);

  const targetId = body?.targetId as string | undefined;
  const direction = body?.direction as "like" | "pass" | undefined;

  if (!targetId || (direction !== "like" && direction !== "pass")) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(cookie);

  if (authErr || !authData?.user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const viewerId = authData.user.id;

  const { error } = await supabaseAdmin.from("swipes").insert({
    swiper_id: viewerId,
    target_id: targetId,
    direction,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}