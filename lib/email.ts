// Server-side email helpers via Resend.
// RESEND_API_KEY must be set in env. If missing, all sends are silently skipped.

import { Resend } from "resend";

const FROM = "Unseen <noreply@unseenapp.cz>";
const APP_URL = "https://unseenapp.cz";
const ADMIN_URL = `${APP_URL}/admin/photos`;

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

// ── User notifications ────────────────────────────────────────────────────────

const btn = (href: string, label: string) =>
  `<a href="${href}" style="background:#E0175C;color:white;padding:12px 28px;border-radius:24px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px;margin-top:16px">${label}</a>`;

const footer = `<p style="color:#A89488;font-size:12px;margin-top:32px">Unseen · <a href="${APP_URL}/settings" style="color:#A89488">Unsubscribe</a></p>`;

/**
 * Sent to both users the moment a mutual match is created.
 * Deliberately reveals NO identity — not even the label — because the
 * timing of the notification would let the recipient guess who liked them back.
 * The label is only revealed in sendChatUnlockedEmail when the chat opens.
 */
export async function sendMatchEmail(
  toEmail: string,
  chatUnlockAt: Date
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const unlockTime = chatUnlockAt.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Prague",
  });

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "🔒 Někdo tě tajně ohodnotil — zjistíš to za 24 h",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1C1410">
        <h2 style="color:#E0175C;margin-bottom:8px">Tajná shoda! 🔒</h2>
        <p style="font-size:16px">Máš novou shodu — ale kdo to je, se dozvíš až za 24 hodin.</p>
        <p style="color:#6B5A52">Chat se odemkne <strong>${unlockTime}</strong>. Do té doby zůstane identita skrytá.</p>
        ${btn(`${APP_URL}/matches`, "Přejít na shody →")}
        ${footer}
      </div>
    `,
  }).catch((err: unknown) => {
    console.error("[email] Failed to send match email:", err);
  });
}

/** Sent to both users when the chat_unlock_at time passes. */
export async function sendChatUnlockedEmail(
  toEmail: string,
  matchLabel: string,
  matchId: number
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "💬 Chat se odemkl — napiš první!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1C1410">
        <h2 style="color:#E0175C;margin-bottom:8px">Chat odemčen! 💬</h2>
        <p style="font-size:16px">Tvůj chat se shodou <strong>${matchLabel}</strong> je teď otevřený.</p>
        <p style="color:#6B5A52">Napiš první — nebo počkej, co napíše druhá strana.</p>
        ${btn(`${APP_URL}/chat/${matchId}`, "Otevřít chat →")}
        ${footer}
      </div>
    `,
  }).catch((err: unknown) => {
    console.error("[email] Failed to send chat-unlocked email:", err);
  });
}
