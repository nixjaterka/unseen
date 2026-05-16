-- Account fields: first name, last name, date of birth
-- These are private account fields — never exposed to other users.
-- date_of_birth replaces birth_year for matching (more accurate age calculations).
-- Run in Supabase SQL Editor.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name  text,
  ADD COLUMN IF NOT EXISTS last_name   text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;
