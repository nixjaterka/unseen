-- Allow admin to mark reports as resolved.
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS resolved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by  uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_reports_resolved_at
  ON reports (resolved_at)
  WHERE resolved_at IS NOT NULL;
