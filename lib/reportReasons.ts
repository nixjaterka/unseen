/**
 * Report reasons, as slugs.
 *
 * These are the four Nikol specified. They are stored as slugs so the label
 * can be translated and reworded without rewriting history — the DB keeps
 * `contact_sharing`, the UI renders `chat.report.reason_contact_sharing`.
 *
 * Legacy values below are the English labels the web app used to send and the
 * slugs the mobile app used to insert directly. They are still accepted so
 * existing rows stay valid, but nothing should write them any more.
 */
export const REPORT_REASONS = [
  "contact_sharing",   // sharing or asking for contact details
  "inappropriate",     // unwanted advances, inappropriate suggestions
  "threat",            // threats, intimidation, feeling unsafe
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

const LEGACY_REASONS = new Set([
  "Inappropriate messages",
  "Harassment",
  "Fake profile",
  "Other",
  "harassment",
  "fake",
]);

export function isValidReportReason(reason: string): boolean {
  return (REPORT_REASONS as readonly string[]).includes(reason) || LEGACY_REASONS.has(reason);
}
