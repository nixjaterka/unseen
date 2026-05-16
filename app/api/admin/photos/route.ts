import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Admin-only endpoint for reviewing flagged photos.
//
// GET  — returns all photos with moderation_status = 'pending', with signed URLs.
// POST — approve or reject a photo.
//        Body: { photoId: string, action: "approve" | "reject" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email?.toLowerCase() ?? "";
  if (!ADMIN_EMAILS.includes(email)) return null;

  return user;
}

export async function GET(req: Request) {
  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("photos")
    .select("id, user_id, path, position, moderation_status, created_at")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs for each photo.
  const rows = await Promise.all(
    (data ?? []).map(async (photo) => {
      const { data: signed } = await supabaseAdmin.storage
        .from("user_photos")
        .createSignedUrl(photo.path, 60 * 30); // 30 min

      return {
        ...photo,
        signedUrl: signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ photos: rows });
}

export async function POST(req: Request) {
  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const photoId = typeof body?.photoId === "string" ? body.photoId : null;
  const action  = body?.action === "approve" || body?.action === "reject" ? body.action : null;

  if (!photoId || !action) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (action === "reject") {
    // Fetch the path so we can also clean up storage.
    const { data: photoRow } = await supabaseAdmin
      .from("photos")
      .select("path")
      .eq("id", photoId)
      .maybeSingle();

    if (photoRow?.path) {
      await supabaseAdmin.storage.from("user_photos").remove([photoRow.path]);
    }

    const { error } = await supabaseAdmin
      .from("photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabaseAdmin
      .from("photos")
      .update({ moderation_status: "approved" })
      .eq("id", photoId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
