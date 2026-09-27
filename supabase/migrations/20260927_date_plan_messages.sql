-- Date cards in the chat.
--
-- When someone plans (or cancels) a date, the server posts a message of
-- kind 'date_plan' into the conversation, so BOTH people see a card:
-- time, place, "Open in Maps". The card's data lives in `meta`, copied from
-- the plan at that moment — so the card never needs to read date_plans,
-- which also holds private fields (safety contact, notes) that only the
-- planner may see.
--
-- meta shape: { planId, action: 'planned' | 'cancelled', plannedFor, place, lat?, lon? }

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS meta jsonb;

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_kind_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_kind_check CHECK (kind IN ('text', 'voice', 'date_plan'));

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_date_plan_meta_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_date_plan_meta_check CHECK (kind <> 'date_plan' OR meta IS NOT NULL);
