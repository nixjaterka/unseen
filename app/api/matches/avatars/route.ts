import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

/**
 * GET /api/matches/avatars?userIds=uid1,uid2,...
 *
 * Returns signed URLs (1h) for the primary approved photo of each requested
 * user, validated against active matches — you can only fetch photos of people
 * you're matched with.
 *
 * Response: { [userId]: signedUrl | null }
 */
export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userIds = (url.searchParams.get("userIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50); // hard cap

  if (userIds.length === 0) {
    return NextResponse.json({});
  }

  // Load all active matches for this user to validate the request.
  // We only return photos for users the requester is actually matched with.
  const { data: matchRows } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b")
    .is("unmatched_at", null)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  const matchedSet = new Set<string>();
  for (const m of matchRows ?? []) {
    if (m.user_a === user.id) matchedSet.add(m.user_b);
    else if (m.user_b === user.id) matchedSet.add(m.user_a);
  }

  const validIds = userIds.filter((id) => matchedSet.has(id));
  if (validIds.length === 0) {
    return NextResponse.json({});
  }

  // Fetch primary approved photo paths for the validated user IDs.
  const { data: photoRows } = await supabaseAdmin
    .from("photos")
    .select("user_id, path")
    .in("user_id", validIds)
    .eq("is_primary", true)
    .eq("moderation_status", "approved");

  if (!photoRows?.length) {
    return NextResponse.json({});
  }

  // Sign all URLs in parallel — supabaseAdmin bypasses storage RLS.
  const signed = await Promise.all(
    photoRows.map(async (p) => {
      const { data } = await supabaseAdmin.storage
        .from("user_photos")
        .createSignedUrl(p.path, 60 * 60); // 1 hour
      return [p.user_id, data?.signedUrl ?? null] as const;
    })
  );

  return NextResponse.json(Object.fromEntries(signed));
}
