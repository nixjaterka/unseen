-- Each person's PRIVATE part of a date: their notes + their own safety friend.
--
-- A date belongs to both people (time + place are shared), but safety is
-- personal: either person can add a friend who gets a heads-up SMS and is
-- contacted if they stop answering the check-ins. The other person never
-- sees any of this.
--
-- (Older plans keep the planner's details in date_plans.notes /
-- emergency_contact_* — the API and the check-in cron still read those as a
-- fallback.)

CREATE TABLE IF NOT EXISTS date_plan_personal (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date_plan_id       bigint NOT NULL,
  user_id            uuid   NOT NULL,
  notes              text,
  safety_enabled     boolean NOT NULL DEFAULT false,
  friend_name        text,
  friend_phone       text,
  friend_notified_at timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date_plan_id, user_id)
);

-- Server-only: RLS on with NO policies, so no app can read anyone's row
-- directly — everything goes through /api/date/plan with the service role.
ALTER TABLE date_plan_personal ENABLE ROW LEVEL SECURITY;
