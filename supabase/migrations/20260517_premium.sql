-- Phase E: Premium subscriptions
-- Run in Supabase SQL editor or via `supabase db push`

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS premium_until   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT       DEFAULT NULL;

-- Index so the webhook upsert (lookup by stripe_customer_id) is fast.
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
