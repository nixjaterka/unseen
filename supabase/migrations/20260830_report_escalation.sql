-- Escalation to the safety inbox is now a deliberate act, not automatic.
--
-- Every report lands in the admin interface. Only what a human judges to be
-- a safety hazard is forwarded to safety@ — so that inbox stays a place where
-- everything in it matters.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_by uuid;

CREATE INDEX IF NOT EXISTS reports_escalated_at_idx ON public.reports (escalated_at);
