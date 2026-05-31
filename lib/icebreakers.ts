// Icebreaker prompts — shown in chat when there are zero messages.
//
// Each question has optional slider affinities. An affinity means:
//   "this question is more relevant if the other person's score on
//    slider[index] leans toward 'high' (>60) or 'low' (<40)".
//
// Slider index reference (see lib/personality.ts):
//   0  Introverted ↔ Extroverted
//   1  Spontaneous ↔ Planful
//   2  Head ↔ Heart
//   3  Calm ↔ Passionate
//   4  Live for today ↔ Build for tomorrow
//   5  Experiences ↔ Stability
//   6  Relaxed ↔ Driven
//   7  Independent ↔ Shared life
//   8  Blunt ↔ Tactful
//   9  Forgiving ↔ Principled
//  10  Self-reliant ↔ Community-minded
//  11  Idealistic ↔ Pragmatic
//  12  Homebody ↔ Outdoorsy
//  13  Laid-back ↔ Sporty
//  14  Indifferent to animals ↔ Animal lover
//  15  Night owl ↔ Early bird

export type IcebreakerAffinity = {
  index: number;
  direction: "high" | "low"; // high = score > 60, low = score < 40
};

export type Icebreaker = {
  key: string; // i18n key: "icebreaker.q.<key>"
  affinities: IcebreakerAffinity[];
};

export const ICEBREAKERS: Icebreaker[] = [
  // ── Introverted (0 low) ──────────────────────────────────────────────
  { key: "recharge",         affinities: [{ index: 0, direction: "low" }] },
  { key: "last_book",        affinities: [{ index: 0, direction: "low" }] },
  { key: "ideal_evening",    affinities: [{ index: 0, direction: "low" }, { index: 12, direction: "low" }] },

  // ── Extroverted (0 high) ─────────────────────────────────────────────
  { key: "interesting_person", affinities: [{ index: 0, direction: "high" }] },
  { key: "best_night_out",     affinities: [{ index: 0, direction: "high" }] },

  // ── Spontaneous (1 low) ──────────────────────────────────────────────
  { key: "spontaneous_thing",  affinities: [{ index: 1, direction: "low" }] },
  { key: "packed_and_left",    affinities: [{ index: 1, direction: "low" }, { index: 4, direction: "low" }] },

  // ── Planful (1 high) ─────────────────────────────────────────────────
  { key: "looking_forward",    affinities: [{ index: 1, direction: "high" }] },
  { key: "five_years",         affinities: [{ index: 1, direction: "high" }, { index: 4, direction: "high" }] },

  // ── Head (2 low) ─────────────────────────────────────────────────────
  { key: "overthought",        affinities: [{ index: 2, direction: "low" }] },

  // ── Heart (2 high) ───────────────────────────────────────────────────
  { key: "moved_you",          affinities: [{ index: 2, direction: "high" }] },
  { key: "crier_films",        affinities: [{ index: 2, direction: "high" }, { index: 3, direction: "high" }] },

  // ── Calm (3 low) ─────────────────────────────────────────────────────
  { key: "peaceful_day",       affinities: [{ index: 3, direction: "low" }, { index: 6, direction: "low" }] },
  { key: "wind_down",          affinities: [{ index: 3, direction: "low" }] },

  // ── Passionate (3 high) ──────────────────────────────────────────────
  { key: "talk_for_hours",     affinities: [{ index: 3, direction: "high" }] },
  { key: "cause_you_care",     affinities: [{ index: 3, direction: "high" }, { index: 9, direction: "high" }] },

  // ── Live for today (4 low) ───────────────────────────────────────────
  { key: "free_weekend",       affinities: [{ index: 4, direction: "low" }, { index: 1, direction: "low" }] },

  // ── Build for tomorrow (4 high) ──────────────────────────────────────
  { key: "working_toward",     affinities: [{ index: 4, direction: "high" }, { index: 6, direction: "high" }] },

  // ── Experiences (5 low) ──────────────────────────────────────────────
  { key: "best_trip",          affinities: [{ index: 5, direction: "low" }, { index: 12, direction: "high" }] },
  { key: "chasing_next",       affinities: [{ index: 5, direction: "low" }] },

  // ── Stability (5 high) ───────────────────────────────────────────────
  { key: "place_like_home",    affinities: [{ index: 5, direction: "high" }, { index: 12, direction: "low" }] },

  // ── Relaxed (6 low) ──────────────────────────────────────────────────
  { key: "doing_nothing",      affinities: [{ index: 6, direction: "low" }, { index: 13, direction: "low" }] },

  // ── Driven (6 high) ──────────────────────────────────────────────────
  { key: "productive_day",     affinities: [{ index: 6, direction: "high" }] },

  // ── Independent (7 low) ──────────────────────────────────────────────
  { key: "prefer_alone",       affinities: [{ index: 7, direction: "low" }, { index: 0, direction: "low" }] },

  // ── Shared life (7 high) ─────────────────────────────────────────────
  { key: "love_with_people",   affinities: [{ index: 7, direction: "high" }] },

  // ── Homebody (12 low) ────────────────────────────────────────────────
  { key: "stay_home_evening",  affinities: [{ index: 12, direction: "low" }] },
  { key: "comfort_food",       affinities: [{ index: 12, direction: "low" }, { index: 13, direction: "low" }] },

  // ── Outdoorsy (12 high) ──────────────────────────────────────────────
  { key: "favourite_outside",  affinities: [{ index: 12, direction: "high" }] },
  { key: "mountains_sea",      affinities: [{ index: 12, direction: "high" }] },

  // ── Sporty (13 high) ─────────────────────────────────────────────────
  { key: "move_your_body",     affinities: [{ index: 13, direction: "high" }] },
  { key: "sport_defend",       affinities: [{ index: 13, direction: "high" }] },

  // ── Animal lover (14 high) ───────────────────────────────────────────
  { key: "have_animals",       affinities: [{ index: 14, direction: "high" }] },
  { key: "dog_cat_chaos",      affinities: [{ index: 14, direction: "high" }] },

  // ── Night owl (15 low) ───────────────────────────────────────────────
  { key: "one_am",             affinities: [{ index: 15, direction: "low" }] },
  { key: "best_late",          affinities: [{ index: 15, direction: "low" }] },

  // ── Early bird (15 high) ─────────────────────────────────────────────
  { key: "morning_looks_like", affinities: [{ index: 15, direction: "high" }] },

  // ── Universal (no affinity — always in the pool) ─────────────────────
  { key: "perfect_first_date", affinities: [] },
  { key: "surprises_people",   affinities: [] },
  { key: "into_right_now",     affinities: [] },
  { key: "best_this_week",     affinities: [] },
  { key: "take_me_somewhere",  affinities: [] },
  { key: "unpopular_opinion",  affinities: [] },
];

/**
 * Pick `count` icebreakers suited to the other person's personality scores.
 *
 * Algorithm:
 *   1. Score each question: +2 per matching affinity, 0 otherwise.
 *   2. Add a small deterministic jitter (derived from the scores) so the
 *      same profile doesn't always return the exact same 3 in the same order.
 *   3. Sort descending, return top `count`.
 *   4. If scores are null/unavailable, shuffle the universals + return `count`.
 */
export function pickIcebreakers(
  otherScores: number[] | null | undefined,
  count = 3
): Icebreaker[] {
  if (!otherScores || otherScores.length < 16) {
    // No scores — shuffle universals + fallback
    const universals = ICEBREAKERS.filter((q) => q.affinities.length === 0);
    return shuffled(universals).slice(0, count);
  }

  // Deterministic seed from the scores so the selection is stable across
  // re-renders but varies between users.
  const seed = otherScores.slice(0, 16).reduce((s, v, i) => s + v * (i + 1), 0);

  const scored = ICEBREAKERS.map((q, qi) => {
    let score = 0;
    for (const { index, direction } of q.affinities) {
      const v = otherScores[index] ?? 50;
      if (direction === "high" && v > 60) score += 2;
      if (direction === "low"  && v < 40) score += 2;
    }
    // Small jitter: pseudo-random per question, seeded by profile
    const jitter = ((seed * (qi + 7)) % 100) / 100;
    return { q, score: score + jitter };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.q);
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
