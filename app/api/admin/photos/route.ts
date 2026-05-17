import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { notifyAdminAccountFlagged } from "../../../../lib/email";

// Admin-only endpoint for reviewing flagged photos.
//
// GET  — returns all photos with moderation_status = 'pending', with signed URLs.
//         Flagged users (≥3 rejections) are highlighted via the flagged_at field.
// POST — approve or reject a photo.
//        Body: { photoId: string, action: "approve" | "reject" }
//
// On rejection:
//   • Storage object deleted
//   • DB row deleted
//   • profile.photo_rejection_count incremented
//   • profile.has_rejection_notification set to true
//   • If rejection count reaches 3: profile.flagged_at set to now()

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const STRIKE_THRESHOLD = 3;

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
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch flagged_at for each user so the UI can highlight repeat offenders.
  const userIds = [...new Set((data ?? []).map((p) => p.user_id))];
  const profileMap = new Map<string, { flagged_at: string | null; photo_rejection_count: number }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, flagged_at, photo_rejection_count")
      .in("user_id", userIds);

    for (const p of (profiles ?? []) as Array<{ user_id: string; flagged_at: string | null; photo_rejection_count: number }>) {
      profileMap.set(p.user_id, p);
    }
  }

  // Generate signed URLs for each photo.
  const rows = await Promise.all(
    (data ?? []).map(async (photo) => {
      const { data: signed } = await supabaseAdmin.storage
        .from("user_photos")
        .createSignedUrl(photo.path, 60 * 30); // 30 min

      const profile = profileMap.get(photo.user_id);

      return {
        ...photo,
        signedUrl: signed?.signedUrl ?? null,
        flagged_at: profile?.flagged_at ?? null,
        photo_rejection_count: profile?.photo_rejection_count ?? 0,
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

  // Fetch the photo row first — we need user_id and path.
  const { data: photoRow, error: fetchErr } = await supabaseAdmin
    .from("photos")
    .select("user_id, path")
    .eq("id", photoId)
    .maybeSingle();

  if (fetchErr || !photoRow) {
    return NextResponse.json({ error: "photo_not_found" }, { status: 404 });
  }

  if (action === "approve") {
    const { error } = await supabaseAdmin
      .from("photos")
      .update({ moderation_status: "approved" })
      .eq("id", photoId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // ── Rejection ────────────────────────────────────────────────────────────

    // 1. Mark as rejected — storage object is KEPT for dispute evidence.
    //    The photo is invisible to other users (swipe query filters approved only)
    //    but we can retrieve it if needed.
    const { error: rejectErr } = await supabaseAdmin
      .from("photos")
      .update({ moderation_status: "rejected" })
      .eq("id", photoId);

    if (rejectErr) {
      return NextResponse.json({ error: rejectErr.message }, { status: 500 });
    }

    // 3. Fetch current rejection count.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("photo_rejection_count, flagged_at")
      .eq("user_id", photoRow.user_id)
      .maybeSingle();

    const newCount = (profile?.photo_rejection_count ?? 0) + 1;
    const alreadyFlagged = !!profile?.flagged_at;

    // 4. Update profile — increment count, set notification, flag if threshold hit.
    const profileUpdate: Record<string, unknown> = {
      photo_rejection_count: newCount,
      has_rejection_notification: true,
    };

    if (!alreadyFlagged && newCount >= STRIKE_THRESHOLD) {
      profileUpdate.flagged_at = new Date().toISOString();
      console.log(
        `[admin] Account flagged after ${newCount} photo rejections: user_id=${photoRow.user_id}`
      );
      // Non-blocking — send flagged-account email.
      void notifyAdminAccountFlagged(photoRow.user_id, newCount);
    }

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", photoRow.user_id);

    if (profileErr) {
      console.error("[admin] Failed to update profile after rejection:", profileErr.message);
      // Non-fatal — the photo was already removed.
    }
  }

  return NextResponse.json({ ok: true });
}
