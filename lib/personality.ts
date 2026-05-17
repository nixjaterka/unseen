// Personality sliders — DB stores 25 values (profiles.personality_scores int[25]).
// The array length is a DB contract — don't change SLIDER_COUNT without a migration.
//
// Only indices 0–15 are active in the UI (4 groups × 4 sliders).
// Indices 16–24 are reserved / legacy and silently preserved on save.
//
// Display labels live in the i18n dictionary under keys:
//   personality.group.<group>.title
//   personality.slider.<index>.left
//   personality.slider.<index>.right

export const SLIDER_COUNT = 25;       // DB array length — do not change
export const ACTIVE_SLIDER_COUNT = 16; // shown in UI
export const DEFAULT_VALUE = 50;
export const SLIDERS_PER_GROUP = 4;

export type SliderGroup =
  | "personality"
  | "values"
  | "character"
  | "lifestyle";

export const GROUP_ORDER: SliderGroup[] = [
  "personality",
  "values",
  "character",
  "lifestyle",
];

/** Returns the group an index belongs to (e.g. index 5 → "values"). */
export function groupForIndex(i: number): SliderGroup {
  return GROUP_ORDER[Math.floor(i / SLIDERS_PER_GROUP)];
}

/** Indices for a given group (e.g. "character" → [8, 9, 10, 11]). */
export function indicesForGroup(group: SliderGroup): number[] {
  const start = GROUP_ORDER.indexOf(group) * SLIDERS_PER_GROUP;
  return Array.from({ length: SLIDERS_PER_GROUP }, (_, k) => start + k);
}

/** Default array for a user who hasn't filled them in yet. */
export function emptyScores(): number[] {
  return new Array(SLIDER_COUNT).fill(DEFAULT_VALUE);
}

/** Coerces whatever the DB gives us into a clean length-25 number[]. */
export function normalizeScores(input: unknown): number[] {
  if (!Array.isArray(input) || input.length !== SLIDER_COUNT) {
    return emptyScores();
  }
  return input.map((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return DEFAULT_VALUE;
    return Math.max(0, Math.min(100, Math.round(n)));
  });
}

/** Returns true if the input looks like a real (non-null) length-25 array. */
export function hasScores(input: unknown): input is number[] {
  return Array.isArray(input) && input.length === SLIDER_COUNT;
}

export type CompatibilityResult = {
  /** 0–100, higher = more compatible. Float for stable sorting. */
  score: number;
  /** Average per-slider difference across the indices that were scored, 0–100. */
  averageDiff: number;
  /** Which slider indices the score was computed on (so callers can debug). */
  scoredIndices: number[];
};

export type CompatibilityOptions = {
  /**
   * Slider indices to use for the score.
   * Free tier passes 1, premium passes 3. Empty/undefined falls back to all
   * 25 sliders — used as a default when the viewer hasn't picked priorities
   * yet, but in normal product use the caller will always pass priorities.
   */
  prioritySliders?: number[];
};

/**
 * Compatibility between two users' slider arrays.
 *
 * Design B: the score is computed ONLY on the slider indices the viewer has
 * marked as priorities. Everything else is ignored. The principle: it's fine
 * for two people to differ in many ways if they're similar in the ways that
 * matter to them.
 *
 * Score = 100 − (average per-slider absolute difference across priority indices).
 * Identical on those sliders → 100. Polar opposites → 0.
 *
 * If no priority sliders are passed, falls back to all 25 sliders — useful
 * for diagnostics and as a default before the user has set priorities.
 *
 * Returns null if either user hasn't filled the personality form (no scores).
 */
export function compatibility(
  a: number[] | null | undefined,
  b: number[] | null | undefined,
  opts: CompatibilityOptions = {}
): CompatibilityResult | null {
  if (!hasScores(a) || !hasScores(b)) return null;

  const indices =
    opts.prioritySliders && opts.prioritySliders.length > 0
      ? opts.prioritySliders.filter((i) => i >= 0 && i < SLIDER_COUNT)
      : Array.from({ length: SLIDER_COUNT }, (_, i) => i);

  if (indices.length === 0) return null;

  let totalDiff = 0;
  for (const i of indices) {
    totalDiff += Math.abs(a[i] - b[i]);
  }

  const averageDiff = totalDiff / indices.length;
  const score = 100 - averageDiff;

  return { score, averageDiff, scoredIndices: indices };
}

/**
 * Returns a per-group compatibility score (0–100) for each of the 4 groups.
 * Used on the matches page to light up a yellow star when ≥2 groups are aligned.
 */
export function groupCompatibility(
  a: number[],
  b: number[]
): Record<SliderGroup, number> {
  const result = {} as Record<SliderGroup, number>;
  for (const group of GROUP_ORDER) {
    const indices = indicesForGroup(group);
    let totalDiff = 0;
    for (const i of indices) {
      totalDiff += Math.abs((a[i] ?? 50) - (b[i] ?? 50));
    }
    result[group] = 100 - totalDiff / indices.length;
  }
  return result;
}
