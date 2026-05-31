-- Typing indicator: one timestamp per user slot on the match row.
-- typing_at_a = last keypress by user_a, typing_at_b = last keypress by user_b.
-- Using two columns (not one) so simultaneous typing doesn't overwrite each other.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS typing_at_a timestamptz,
  ADD COLUMN IF NOT EXISTS typing_at_b timestamptz;
