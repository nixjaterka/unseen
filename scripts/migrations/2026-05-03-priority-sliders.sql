-- Phase C: priority sliders for the matching engine.
--
-- Stores the slider indices the user has marked as "this matters most."
-- Free tier: 1 entry. Premium (Phase E): up to 3.
-- Each value is an integer 0..24 referring to a SLIDERS index in code.
--
-- Run in the Supabase SQL editor.

alter table profiles
  add column if not exists priority_sliders integer[];

alter table profiles
  drop constraint if exists profiles_priority_sliders_length;

alter table profiles
  add constraint profiles_priority_sliders_length
  check (
    priority_sliders is null
    or array_length(priority_sliders, 1) between 1 and 3
  );
