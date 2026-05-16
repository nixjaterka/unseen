-- Account deletion retention schedule.
--
-- When a user deletes their account, profile.deleted_at is set immediately.
-- purge_scheduled_at indicates when the rest of the data should be wiped:
--   - now() + 1 year if no reports exist against the user at deletion time
--   - null if reports exist → retained indefinitely (safety records)
--
-- A background sweep job (not implemented yet) reads this column and finishes
-- the deletion when the time arrives.

alter table profiles
  add column if not exists purge_scheduled_at timestamptz;

create index if not exists profiles_purge_scheduled_at_idx
  on profiles (purge_scheduled_at)
  where purge_scheduled_at is not null;
