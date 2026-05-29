import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { compatibility, hasScores, SLIDER_COUNT } from "../../../../lib/personality";

// How often the queue "biases toward priority slider compat" vs serves up a
// random eligible candidate. Free tier; premium will override with its own
// 40/25/35 mix in Phase E.
const FREE_BIAS_PROBABILITY = 0.30;

// Within the bias bucket, what fraction of candidates count as "high compat".
// Top 30% by priority-slider score, picked from at random.
const BIAS_TOP_FRACTION = 0.30;

// Within the random bucket, probability of picking a Beeline candidate
// (someone who already liked me) when at least one exists.
const BEELINE_RANDOM_BUCKET_PROBABILITY = 0.5;

type ProfileRow = {
  user_id: string;
  date_of_birth: string | null; // available after 2026-05-13 migration
  birth_year: number | null;
  gender: string | null;
  languages: string[] | null;
  preferred_gender: string | null;
  preferred_age_relations: string[] | null;
  personality_scores: number[] | null;
  priority_sliders: number[] | null;
};

/** Extract birth year from date_of_birth (post-migration) or fall back to birth_year. */
function getBirthYear(row: ProfileRow): number | null {
  if (row.date_of_birth) {
    return new Date(row.date_of_birth).getFullYear();
  }
  return row.birth_year ?? null;
}

function getRelativeAgeLabel(viewerBirthYear: number, otherBirthYear: number) {
  const viewerAge = new Date().getFullYear() - viewerBirthYear;
  const diff = otherBirthYear - viewerBirthYear; // positive = other is younger, negative = older
  const absDiff = Math.abs(diff);

  let same = 2;
  let bit = 5;
  let older = 9;

  if (viewerAge < 25) {
    same = 1;
    bit = 3;
    older = 6;
  } else if (viewerAge <= 34) {
    same = 2;
    bit = 5;
    older = 9;
  } else if (viewerAge <= 49) {
    same = 4;
    bit = 7;
    older = 12;
  } else {
    same = 5;
    bit = 9;
    older = 15;
  }

  if (absDiff <= same) return "about your age";

  if (diff > 0) {
    if (absDiff <= bit) return "a bit younger than you";
    if (absDiff <= older) return "younger than you";
    return "much younger than you";
  } else {
    if (absDiff <= bit) return "a bit older than you";
    if (absDiff <= older) return "older than you";
    return "much older than you";
  }
}

// Czech and Slovak are mutually intelligible — treat as equivalent.
const EQUIVALENT_LANGUAGE_GROUPS = [["czech", "slovak"]];

function hasSharedLanguage(a: string[] | null, b: string[] | null) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const aLower = a.map((x) => x.toLowerCase());
  const bLower = b.map((x) => x.toLowerCase());
  const setA = new Set(aLower);
  // Exact match
  if (bLower.some((l) => setA.has(l))) return true;
  // Equivalence groups
  return aLower.some((al) =>
    bLower.some((bl) =>
      EQUIVALENT_LANGUAGE_GROUPS.some((g) => g.includes(al) && g.includes(bl))
    )
  );
}

// Supabase encodes .in(...) filters into the URL. With ~500 UUIDs that URL
// blows past Node fetch's request line limit and PostgREST's, so we chunk.
const IN_CHUNK_SIZE = 100;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchCandidateProfilesInChunks(
  ids: string[]
): Promise<{ data: ProfileRow[] | null; error: { message: string } | null }> {
  if (ids.length === 0) return { data: [], error: null };

  const batches = chunk(ids, IN_CHUNK_SIZE);
  const responses = await Promise.all(
    batches.map((batch) =>
      supabaseAdmin
        .from("profiles")
        .select(
          "user_id, birth_year, gender, languages, preferred_gender, preferred_age_relations, personality_scores, priority_sliders"
        )
        .in("user_id", batch)
        .is("deleted_at", null)
    )
  );

  const errors = responses.map((r) => r.error).filter(Boolean);
  if (errors.length > 0) {
    return { data: null, error: errors[0] as { message: string } };
  }

  const merged: ProfileRow[] = [];
  for (const r of responses) {
    if (r.data) merged.push(...(r.data as ProfileRow[]));
  }
  return { data: merged, error: null };
}

async function countAliveProfilesInChunks(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const batches = chunk(ids, IN_CHUNK_SIZE);
  const responses = await Promise.all(
    batches.map((batch) =>
      supabaseAdmin
        .from("profiles")
        .select("user_id")
        .in("user_id", batch)
        .is("deleted_at", null)
    )
  );

  let total = 0;
  for (const r of responses) {
    if (r.data) total += r.data.length;
  }
  return total;
}

export async function GET(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ candidate: null, reason: "not_authenticated" }, { status: 200 });
  }

  const viewerId = user.id;
  const url = new URL(request.url);
  const mode      = url.searchParams.get("mode");
  const excludeId = url.searchParams.get("exclude"); // just-swiped ID, not yet in DB

  // Viewer profile (also bail if the viewer soft-deleted themselves)
  const { data: viewerProfile, error: viewerErr } = await supabaseAdmin
    .from("profiles")
    .select(
      "user_id, birth_year, gender, languages, preferred_gender, preferred_age_relations, deleted_at, personality_scores, priority_sliders"
    )
    .eq("user_id", viewerId)
    .maybeSingle<ProfileRow & { deleted_at: string | null }>();

  if (viewerErr || !viewerProfile) {
    return NextResponse.json({ candidate: null, reason: "viewer_profile_failed" }, { status: 200 });
  }

  if (viewerProfile.deleted_at) {
    return NextResponse.json({ candidate: null, reason: "viewer_deleted" }, { status: 200 });
  }

  // Already swiped + primary photos — fire both in parallel
  const [swipedResult, photoResult] = await Promise.all([
    supabaseAdmin.from("swipes").select("target_id").eq("swiper_id", viewerId),
    supabaseAdmin
      .from("photos")
      .select("user_id, path")
      .eq("is_primary", true)
      .eq("moderation_status", "approved")
      .limit(500),
  ]);

  const { data: swipedRows } = swipedResult;
  const { data: photoRows, error: photoErr } = photoResult;

  const swipedIds = new Set((swipedRows ?? []).map((r) => r.target_id));
  swipedIds.add(viewerId);
  if (excludeId) swipedIds.add(excludeId); // exclude the just-swiped card before DB write lands

  if (photoErr || !photoRows || photoRows.length === 0) {
    return NextResponse.json({ candidate: null, reason: "no_photos" }, { status: 200 });
  }

  const candidateIds = photoRows
    .map((p) => p.user_id)
    .filter((id) => !swipedIds.has(id));

  if (candidateIds.length === 0) {
    return NextResponse.json({ candidate: null, reason: "no_more_candidates" }, { status: 200 });
  }

  // Candidate profiles + beeline (who already liked me) — fire both in parallel
  const [
    { data: candidateProfiles, error: candidateProfilesErr },
    { data: likesToMeEarly },
  ] = await Promise.all([
    fetchCandidateProfilesInChunks(candidateIds),
    supabaseAdmin
      .from("swipes")
      .select("swiper_id")
      .eq("target_id", viewerId)
      .eq("direction", "like"),
  ]);

  if (candidateProfilesErr || !candidateProfiles) {
    return NextResponse.json({ candidate: null, reason: "candidate_profiles_failed" }, { status: 200 });
  }

  const profileMap = new Map(candidateProfiles.map((p) => [p.user_id, p]));

  const filteredPhotos = photoRows.filter((photo) => {
    if (swipedIds.has(photo.user_id)) return false;

    const candidate = profileMap.get(photo.user_id);
    if (!candidate) return false;

    // 1) Candidate gender must match what viewer wants.
    //    Exception: a non-binary candidate is shown to the viewer if the
    //    non-binary person is actively seeking the viewer's gender — even when
    //    the viewer's preference is set to "man" or "woman".
    //    (e.g. NB person looking for women → appears to all women)
    const genderMatch =
      candidate.gender === viewerProfile.preferred_gender ||
      (candidate.gender === "nonbinary" &&
        candidate.preferred_gender === viewerProfile.gender);

    if (!viewerProfile.preferred_gender || !genderMatch) return false;

    // 2) Candidate must also be interested in the viewer's gender.
    //    Exception: if the viewer is non-binary, we drop the strict check and
    //    instead require that the viewer is looking for the candidate's gender —
    //    so a NB person who wants women will see women regardless of whether
    //    those women set their preference to "man" or "woman".
    const mutualInterest =
      candidate.preferred_gender === viewerProfile.gender ||
      (viewerProfile.gender === "nonbinary" &&
        viewerProfile.preferred_gender === candidate.gender);

    if (!viewerProfile.gender || !mutualInterest) return false;

    // 3) must share at least one language
    if (!hasSharedLanguage(viewerProfile.languages, candidate.languages)) {
      return false;
    }

    // 4) candidate must fit one of viewer's selected age relations
    const viewerBY = getBirthYear(viewerProfile);
    const candidateBY = getBirthYear(candidate);
    if (
      viewerBY &&
      candidateBY &&
      Array.isArray(viewerProfile.preferred_age_relations) &&
      viewerProfile.preferred_age_relations.length > 0
    ) {
      const relation = getRelativeAgeLabel(viewerBY, candidateBY);
      if (!viewerProfile.preferred_age_relations.includes(relation)) {
        return false;
      }
    }

    return true;
  });

  if (mode === "dashboard") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const likedUserIds = new Set<string>();

    const { data: likesToMeData } = await supabaseAdmin
      .from("swipes")
      .select("swiper_id, direction, created_at")
      .eq("target_id", viewerId)
      .eq("direction", "like")
      .gte("created_at", thirtyDaysAgoIso);

    ((likesToMeData ?? []) as Array<{ swiper_id: string }>).forEach((like) => {
      likedUserIds.add(like.swiper_id);
    });

    const { data: matchesData } = await supabaseAdmin
      .from("matches")
      .select("id, user_a, user_b, chat_unlock_at, created_at, unmatched_at")
      .is("unmatched_at", null);

    ((matchesData ?? []) as Array<{
      id: number;
      user_a: string;
      user_b: string;
      chat_unlock_at: string | null;
      created_at?: string | null;
      unmatched_at: string | null;
    }>).forEach((match) => {
      if (match.user_a !== viewerId && match.user_b !== viewerId) return;

      const matchTimestamp = match.created_at || match.chat_unlock_at;
      if (!matchTimestamp) return;
      if (new Date(matchTimestamp) < new Date(thirtyDaysAgoIso)) return;

      if (match.user_a === viewerId) likedUserIds.add(match.user_b);
      if (match.user_b === viewerId) likedUserIds.add(match.user_a);
    });

    // Drop anyone who soft-deleted themselves so the count matches what
    // the user can actually act on. Chunked for the same URL-length reason.
    const likedYouCount = await countAliveProfilesInChunks(
      Array.from(likedUserIds)
    );

    // If the viewer hasn't filled in their preferences yet (no gender,
    // preferred_gender, or languages), the filter returns 0 — which is
    // misleading on a first visit. Fall back to the total pool size instead.
    const profileIncomplete =
      !viewerProfile.gender ||
      !viewerProfile.preferred_gender ||
      !viewerProfile.languages?.length;

    const activeForYou =
      profileIncomplete && filteredPhotos.length === 0
        ? candidateIds.length
        : filteredPhotos.length;

    return NextResponse.json({
      stats: {
        activeForYou,
        likedYou: likedYouCount,
      },
    });
  }

  if (filteredPhotos.length === 0) {
    return NextResponse.json({ candidate: null, reason: "no_more_candidates" }, { status: 200 });
  }

  // Phase C — pick candidate using priority slider, Beeline, and queue mix.

  // Beeline: already fetched in parallel above.
  const likedMeSet = new Set(
    ((likesToMeEarly ?? []) as Array<{ swiper_id: string }>).map((r) => r.swiper_id)
  );

  // Sanitize viewer priority sliders (defensive).
  const rawPriorities = Array.isArray(viewerProfile.priority_sliders)
    ? viewerProfile.priority_sliders
    : [];
  const viewerPriorities = rawPriorities.filter(
    (i) => Number.isInteger(i) && i >= 0 && i < SLIDER_COUNT
  );

  type Eligible = {
    photo: (typeof filteredPhotos)[number];
    likedMe: boolean;
    compatScore: number | null;
  };

  const eligibles: Eligible[] = filteredPhotos.map((photo) => {
    const candidate = profileMap.get(photo.user_id);
    let compatScore: number | null = null;

    if (
      candidate &&
      hasScores(viewerProfile.personality_scores) &&
      hasScores(candidate.personality_scores) &&
      viewerPriorities.length > 0
    ) {
      const r = compatibility(
        viewerProfile.personality_scores,
        candidate.personality_scores,
        { prioritySliders: viewerPriorities }
      );
      compatScore = r?.score ?? null;
    }

    return {
      photo,
      likedMe: likedMeSet.has(photo.user_id),
      compatScore,
    };
  });

  // Free tier mix: 30% biased toward priority-slider compat, 70% random.
  // Beeline preference layered inside both buckets.
  function pickEligible(): Eligible {
    const useBias =
      viewerPriorities.length > 0 && Math.random() < FREE_BIAS_PROBABILITY;

    if (useBias) {
      const scoredOnly = eligibles.filter((e) => e.compatScore !== null);
      if (scoredOnly.length > 0) {
        scoredOnly.sort(
          (a, b) => (b.compatScore ?? 0) - (a.compatScore ?? 0)
        );
        const topCount = Math.max(
          1,
          Math.ceil(scoredOnly.length * BIAS_TOP_FRACTION)
        );
        const top = scoredOnly.slice(0, topCount);

        const topBeeline = top.filter((e) => e.likedMe);
        if (topBeeline.length > 0) return randomItem(topBeeline);
        return randomItem(top);
      }
      // No scoring possible — fall through to random bucket.
    }

    // Random bucket — prefer Beeline some of the time.
    const beeline = eligibles.filter((e) => e.likedMe);
    if (beeline.length > 0 && Math.random() < BEELINE_RANDOM_BUCKET_PROBABILITY) {
      return randomItem(beeline);
    }

    return randomItem(eligibles);
  }

  const picked = pickEligible();
  const filteredPhoto = picked.photo;

  const profileData = profileMap.get(filteredPhoto.user_id) ?? null;

  const { data: candidatePhotos, error: candidatePhotosErr } = await supabaseAdmin
    .from("photos")
    .select("path, position")
    .eq("user_id", filteredPhoto.user_id)
    .eq("moderation_status", "approved")
    .order("position", { ascending: true });

  if (candidatePhotosErr || !candidatePhotos || candidatePhotos.length === 0) {
    return NextResponse.json({ candidate: null, reason: "candidate_photos_failed" }, { status: 200 });
  }

  // Sign all photo URLs in parallel — avoids N sequential round trips.
  const signResults = await Promise.all(
    candidatePhotos.map((photo) =>
      supabaseAdmin.storage.from("user_photos").createSignedUrl(photo.path, 60 * 5)
    )
  );
  const photoUrls = signResults
    .filter((r) => !r.error && r.data?.signedUrl)
    .map((r) => r.data!.signedUrl);

  if (photoUrls.length === 0) {
    return NextResponse.json({ candidate: null, reason: "sign_failed" }, { status: 200 });
  }

  return NextResponse.json({
    candidate: {
      candidateId: filteredPhoto.user_id,
      photoUrls,
      birthYear: profileData ? getBirthYear(profileData) : null,
      gender: profileData?.gender ?? null,
      languages: profileData?.languages ?? [],
      // Phase C: compat score against the viewer.
      // Null when either side hasn't filled personality scores.
      // Computed on viewer's priority sliders if any, otherwise on all 25.
      compatScore: picked.compatScore,
    },
  });
}