-- Blocking. One row per (blocker, blocked) pair, one direction.
--
-- Semantics:
--   • Blocking is one-way in the table but enforced BOTH ways everywhere:
--     if A blocked B, neither sees the other in the deck, neither can send.
--   • Blocking also unmatches every match between the two (done server-side
--     in /api/block with the service role, so both rows stay consistent).
--   • Only the BLOCKER can read their own rows. The blocked person must never
--     be able to discover that they were blocked, so there is no policy that
--     lets blocked_id select. All cross-user checks run through the service
--     role in the API layer.

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blocker_id uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  blocked_id uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  match_id   bigint,                      -- match it was triggered from, if any
  reason     text,                        -- optional free text / report slug
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocked_users_no_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT blocked_users_unique_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx ON public.blocked_users (blocker_id);
CREATE INDEX IF NOT EXISTS blocked_users_blocked_idx ON public.blocked_users (blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Read / create / remove only your OWN blocks. No policy for blocked_id:
-- being blocked is invisible to the person blocked.
DROP POLICY IF EXISTS "own blocks select" ON public.blocked_users;
CREATE POLICY "own blocks select" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "own blocks insert" ON public.blocked_users;
CREATE POLICY "own blocks insert" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "own blocks delete" ON public.blocked_users;
CREATE POLICY "own blocks delete" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- Who unmatched, for the ended-conversation copy. Column may already exist.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS unmatched_by uuid;
