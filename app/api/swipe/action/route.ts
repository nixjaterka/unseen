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