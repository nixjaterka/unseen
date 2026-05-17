import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { compatibility, hasScores } from "../../../../lib/personality";

// Diagnostic-only endpoint that mirrors the candidate-filter chain in
// /api/swipe/next and returns per-step counts. Hit this while logged in
// to see exactly where the funnel collapses to zero.

type ProfileRow = {
  user_id: string;
  birth_year: number | null;
  gender: string | null;
  languages: string[] | null;
  preferred_gender: string | null;
  preferred_age_relations: string[] | null;
  deleted_at: string | null;
  onboarded_at: string | null;
  personality_scores: number[] | null;
};

function getRelativeAgeLabel(viewerBirthYear: number, otherBirthYear: number) {
  const viewerAge = new Date().getFullYear() - viewerBirthYear;
  const diff = otherBirthYear - viewerBirthYear;
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
  }
  if (absDiff <= bit) return "a bit older than you";
  if (absDiff <= older) return "older than you";
  return "much older than you";
}

function hasSharedLanguage(a: string[] | null, b: string[] | null) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const setA = new Set(a.map((x) => x.toLowerCase()));
  return b.some((lang) => setA.has(lang.toLowerCase()));
}

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // Admin-only — this endpoint exposes real user UUIDs and compatibility scores.
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!adminEmails.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const viewerId = user.id;

  // 1. Viewer profile
  const { data: viewerProfile, error: viewerErr } = await supabaseAdmin
    .from("profiles")
    .select(
      "user_id, birth_year, gender, languages, preferred_gender, preferred_age_relations, deleted_at, onboarded_at, personality_scores"
    )
    .eq("user_id", viewerId)
    .maybeSingle<ProfileRow>();

  if (viewerErr) {
    return NextResponse.json({
      step: "viewer_profile",
      error: viewerErr.message,
    });
  }

  if (!viewerProfile) {
    return NextResponse.json({ step: "viewer_profile", error: "no_row_found" });
  }

  // 2. Already-swiped set
  const { data: swipedRows } = await supabaseAdmin
    .from("swipes")
    .select("target_id")
    .eq("swiper_id", viewerId);

  const swipedIds = new Set((swipedRows ?? []).map((r) => r.target_id));

  // 3. Total profiles (sanity check that the seed actually wrote rows)
  const { count: totalProfiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id", { count: "exact", head: true });

  // 4. Total primary photos
  const { count: totalPrimaryPhotos } = await supabaseAdmin
    .from("photos")
    .select("user_id", { count: "exact", head: true })
    .eq("is_primary", true);

  // 5. Pull all primary-photo user IDs (the candidate pool ceiling)
  const { data: photoRows, error: photoErr } = await supabaseAdmin
    .from("photos")
    .select("user_id")
    .eq("is_primary", true)
    .limit(1000);

  if (photoErr) {
    return NextResponse.json({
      step: "primary_photos",
      error: photoErr.message,
    });
  }

  const primaryPhotoUserIds = Array.from(
    new Set((photoRows ?? []).map((p) => p.user_id))
  ).filter((id) => id !== viewerId);

  // 6. Filter against already-swiped
  const notSwipedIds = primaryPhotoUserIds.filter((id) => !swipedIds.has(id));

  // 7. Pull candidate profiles — chunked to keep URLs under the limit
  // when the candidate pool is large.
  const CHUNK_SIZE = 100;
  function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  const all: ProfileRow[] = [];
  if (notSwipedIds.length > 0) {
    const batches = chunk(notSwipedIds, CHUNK_SIZE);
    const responses = await Promise.all(
      batches.map((batch) =>
        supabaseAdmin
          .from("profiles")
          .select(
            "user_id, birth_year, gender, languages, preferred_gender, preferred_age_relations, deleted_at, personality_scores"
          )
          .in("user_id", batch)
      )
    );

    const errs = responses.map((r) => r.error).filter(Boolean);
    if (errs.length > 0) {
      return NextResponse.json({
        step: "candidate_profiles",
        error: (errs[0] as { message: string }).message,
      });
    }

    for (const r of responses) {
      if (r.data) all.push(...(r.data as ProfileRow[]));
    }
  }

  const notDeleted = all.filter((c) => !c.deleted_at);

  const genderMatch = notDeleted.filter(
    (c) => viewerProfile.preferred_gender && c.gender === viewerProfile.preferred_gender
  );

  const mutualGenderMatch = genderMatch.filter(
    (c) => viewerProfile.gender && c.preferred_gender === viewerProfile.gender
  );

  const sharedLanguage = mutualGenderMatch.filter((c) =>
    hasSharedLanguage(viewerProfile.languages, c.languages)
  );

  const ageOk = sharedLanguage.filter((c) => {
    if (
      !viewerProfile.birth_year ||
      !c.birth_year ||
      !Array.isArray(viewerProfile.preferred_age_relations) ||
      viewerProfile.preferred_age_relations.length === 0
    ) {
      return true;
    }
    const relation = getRelativeAgeLabel(viewerProfile.birth_year, c.birth_year);
    return viewerProfile.preferred_age_relations.includes(relation);
  });

  // Show one example failing-at-step candidate where useful
  const sampleCandidate = notDeleted[0] ?? null;

  // Compatibility scoring (Phase B). Silent — not used to filter or sort yet,
  // just exposed here so we can see what real numbers look like.
  const viewerHasScores = hasScores(viewerProfile.personality_scores);
  const candidatesWithScores = ageOk.filter((c) => hasScores(c.personality_scores));

  type Scored = { user_id: string; score: number };
  const scored: Scored[] = viewerHasScores
    ? (candidatesWithScores
        .map((c) => {
          const result = compatibility(
            viewerProfile.personality_scores,
            c.personality_scores
          );
          return result ? { user_id: c.user_id, score: result.score } : null;
        })
        .filter(Boolean) as Scored[])
    : [];

  scored.sort((a, b) => b.score - a.score);

  function summarize(values: number[]) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = sorted.reduce((s, v) => s + v, 0) / sorted.length;
    const median =
      sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return {
      min: round(sorted[0]),
      max: round(sorted[sorted.length - 1]),
      mean: round(mean),
      median: round(median),
    };
  }

  return NextResponse.json(
    {
      viewer: {
        user_id: viewerProfile.user_id,
        birth_year: viewerProfile.birth_year,
        gender: viewerProfile.gender,
        preferred_gender: viewerProfile.preferred_gender,
        languages: viewerProfile.languages,
        preferred_age_relations: viewerProfile.preferred_age_relations,
        deleted_at: viewerProfile.deleted_at,
        onboarded_at: viewerProfile.onboarded_at,
        personality_filled: viewerHasScores,
      },
      totals: {
        total_profiles_in_db: totalProfiles ?? null,
        total_primary_photos_in_db: totalPrimaryPhotos ?? null,
        viewer_already_swiped_count: swipedIds.size,
      },
      funnel: {
        step1_users_with_primary_photo: primaryPhotoUserIds.length,
        step2_not_already_swiped: notSwipedIds.length,
        step3_candidate_profiles_returned: all.length,
        step4_not_deleted: notDeleted.length,
        step5_gender_matches_viewer_pref: genderMatch.length,
        step6_mutual_gender_match: mutualGenderMatch.length,
        step7_shared_language: sharedLanguage.length,
        step8_age_relation_ok: ageOk.length,
      },
      sample_candidate: sampleCandidate
        ? {
            user_id: sampleCandidate.user_id,
            gender: sampleCandidate.gender,
            preferred_gender: sampleCandidate.preferred_gender,
            languages: sampleCandidate.languages,
            birth_year: sampleCandidate.birth_year,
          }
        : null,
      compatibility: {
        viewer_has_scores: viewerHasScores,
        candidates_with_scores: candidatesWithScores.length,
        candidates_passed_filters: ageOk.length,
        distribution: summarize(scored.map((s) => s.score)),
        top_5: scored.slice(0, 5).map((s) => ({
          user_id: s.user_id,
          score: round(s.score),
        })),
        bottom_5: scored
          .slice(-5)
          .reverse()
          .map((s) => ({ user_id: s.user_id, score: round(s.score) })),
      },
    },
    { status: 200 }
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
