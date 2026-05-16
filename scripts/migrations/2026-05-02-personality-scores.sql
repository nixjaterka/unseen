-- Personality sliders foundation (Phase A).
--
-- Stores 25 integer slider values (0–100) per user as a fixed-length array.
-- Index → meaning mapping lives in lib/personality.ts (do not change index
-- order without a backfill).
--
-- Run this in the Supabase SQL editor.

alter table profiles
  add column if not exists personality_scores integer[];

-- Sanity constraint: array length must be 0 (unset) or exactly 25.
alter table profiles
  drop constraint if exists profiles_personality_scores_length;

alter table profiles
  add constraint profiles_personality_scores_length
  check (
    personality_scores is null
    or array_length(personality_scores, 1) = 25
  );
