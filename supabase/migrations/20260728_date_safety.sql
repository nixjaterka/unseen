-- "Plan a date" safety check-in engine.
-- date_plans ALREADY exists (columns: created_by, planned_for, place, notes,
-- emergency_contact_name/_phone/_email, check_in_after_minutes). This migration
-- only adds the genuinely-new engine columns and the check-in state table — it
-- reuses the existing emergency_contact_* columns for the friend's details.

ALTER TABLE date_plans
  ADD COLUMN IF NOT EXISTS safety_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status             text NOT NULL DEFAULT 'scheduled', -- scheduled|cancelled|done
  ADD COLUMN IF NOT EXISTS friend_notified_at timestamptz;

-- One row per scheduled check-in (two per safety-enabled date: +10min, +30min).
-- State machine: pending → notified → reminded → escalated, or → responded.
CREATE TABLE IF NOT EXISTS date_checkins (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date_plan_id bigint NOT NULL,
  user_id      uuid   NOT NULL,
  match_id     bigint,
  kind         text   NOT NULL,                    -- 'first' | 'second'
  due_at       timestamptz NOT NULL,
  status       text   NOT NULL DEFAULT 'pending',  -- pending|notified|reminded|responded|escalated
  notified_at  timestamptz,
  reminded_at  timestamptz,
  responded_at timestamptz,
  escalated_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS date_checkins_status_due_idx ON date_checkins (status, due_at);
CREATE INDEX IF NOT EXISTS date_checkins_plan_idx       ON date_checkins (date_plan_id);

ALTER TABLE date_checkins ENABLE ROW LEVEL SECURITY;

-- The owner can read + respond to their own check-ins. The cron uses the
-- service role, which bypasses RLS.
DROP POLICY IF EXISTS "own checkins" ON date_checkins;
CREATE POLICY "own checkins" ON date_checkins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
