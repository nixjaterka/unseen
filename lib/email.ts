// Server-side email helpers via Resend.
// RESEND_API_KEY must be set in env. If missing, all sends are silently skipped.

import { Resend } from "resend";

const FROM = "Unseen <noreply@unseenapp.cz>";
const ADMIN_URL = "https://unseenapp.cz/admin/photos";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — email notifications disabled.");
    return null;
  }
  return new Resend(key);
}

// ── General-purpose send (used by reports) ───────────────────────────────────

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    text,
  });
}

// ── Admin notifications ───────────────────────────────────────────────────────

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Notify admin that a photo is waiting for manual review. */
export async function notifyAdminPhotoPending(userId: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const to = adminEmails();
  if (to.length === 0) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "📸 New photo pending review — Unseen",
    html: `
      <p>A photo from user <code>${userId}</code> needs manual review.</p>
      <p>It was flagged as a possible group photo or AI-generated image.</p>
      <p><a href="${ADMIN_URL}" style="background:#E0175C;color:white;padding:10px 20px;border-radius:20px;text-decoration:none;display:inline-block;margin-top:12px">Review queue →</a></p>
      <p style="color:#999;font-size:12px;margin-top:20px">Unseen admin notification</p>
    `,
  }).catch((err: unknown) => {
    console.error("[email] Failed to send pending-photo notification:", err);
  });
}

/** Notify admin that an account has been flagged after repeated rejections. */
export async function notifyAdminAccountFlagged(
  userId: string,
  rejectionCount: number
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const to = adminEmails();
  if (to.length === 0) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `🚩 Account flagged (${rejectionCount} rejections) — Unseen`,
    html: `
      <p>User <code>${userId}</code> has been flagged after <strong>${rejectionCount} photo rejections</strong>.</p>
      <p>Their pending photos are highlighted in the review queue.</p>
      <p><a href="${ADMIN_URL}" style="background:#E0175C;color:white;padding:10px 20px;border-radius:20px;text-decoration:none;display:inline-block;margin-top:12px">Review queue →</a></p>
      <p style="color:#999;font-size:12px;margin-top:20px">Unseen admin notification</p>
    `,
  }).catch((err: unknown) => {
    console.error("[email] Failed to send flagged-account notification:", err);
  });
}
