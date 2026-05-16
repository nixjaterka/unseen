// Transactional email helper using Resend's HTTP API.
//
// Server-side only — never import into client code. Requires RESEND_API_KEY
// in env. If the key isn't set, we log a loud warning and don't send;
// callers should treat the email as best-effort (the calling action — e.g.
// inserting a report — succeeds either way).

export type EmailOptions = {
  to: string;
  subject: string;
  /** Plain text body. HTML can be added later if needed. */
  text: string;
};

export async function sendEmail(opts: EmailOptions): Promise<{
  ok: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "unseen-noreply@randenibezfiltru.cz";

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — email not sent.",
      { to: opts.to, subject: opts.subject }
    );
    return { ok: false, error: "no_api_key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn("[email] Resend error:", res.status, errBody);
      return { ok: false, error: errBody };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email] fetch failed:", err);
    return { ok: false, error: String(err) };
  }
}
