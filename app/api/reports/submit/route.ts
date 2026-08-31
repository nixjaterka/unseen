import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { isValidReportReason } from "../../../../lib/reportReasons";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendEmail } from "../../../../lib/email";
import { rateLimit } from "../../../../lib/rateLimit";

// Where new reports are announced. safety@ is NOT notified from here — that
// happens only when an admin escalates (see app/api/admin/reports).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const MAX_DETAILS_LENGTH = 2000;

// Server-side report submission. Replaces the direct client insert so we
// can (a) validate the payload server-side and (b) send a notification
// email to safety@ on every new report.
//
// Body: { reportedId, matchId, reason, details, messageId? }
//
// messageId points the report at ONE message. It matters most for voice
// messages, where a moderator has to know which recording to listen to.
// Mobile authenticates with a Bearer token, web with cookies — getApiUser
// handles both. Before this, mobile inserted into `reports` directly and so
// never triggered the safety email; every report now goes through here.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const reportedId = typeof body?.reportedId === "string" ? body.reportedId : null;
  const matchId =
    typeof body?.matchId === "number" || body?.matchId === null ? body.matchId : null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : null;
  const messageId = typeof body?.messageId === "number" ? body.messageId : null;
  const rawDetails = typeof body?.details === "string" ? body.details : null;
  const details = rawDetails ? rawDetails.slice(0, MAX_DETAILS_LENGTH) : null;

  if (!reportedId || !reason || !isValidReportReason(reason)) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 }
    );
  }

  const user = await getApiUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 }
    );
  }

  // 10 reports per user per hour — prevents report spam flooding the safety inbox.
  if (await rateLimit("reports:submit", user.id, { requests: 10, window: "1 h" })) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // Don't allow self-reports.
  if (reportedId === user.id) {
    return NextResponse.json(
      { ok: false, error: "cannot_report_self" },
      { status: 400 }
    );
  }

  // Only trust messageId if that message is really in the match being
  // reported — otherwise anyone could point a report at any message.
  let verifiedMessageId: number | null = null;
  if (messageId !== null && matchId !== null) {
    const { data: msg } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("id", messageId)
      .eq("match_id", matchId)
      .maybeSingle();
    verifiedMessageId = msg ? messageId : null;
  }

  const { error: insertErr } = await supabaseAdmin.from("reports").insert({
    reporter_id: user.id,
    reported_id: reportedId,
    match_id: matchId,
    message_id: verifiedMessageId,
    reason,
    details: details && details.trim().length > 0 ? details.trim() : null,
  });

  if (insertErr) {
    return NextResponse.json(
      { ok: false, error: insertErr.message },
      { status: 500 }
    );
  }

  // Reports land in the admin interface; escalation to safety@ is a
  // deliberate call made there, so this does NOT email safety@.
  //
  // Admins still get a heads-up, because otherwise a report is invisible
  // until somebody happens to open the admin page — and a report nobody
  // knows about is the same as no report.
  const text = [
    "A new report was filed on Unseen. Review it in the admin interface.",
    "",
    `Reporter: ${user.id}`,
    `Reported: ${reportedId}`,
    `Match: ${matchId ?? "(no match)"}`,
    `Reason: ${reason}`,
    `Message: ${verifiedMessageId ?? "(whole conversation)"}`,
    `Details: ${details && details.trim().length > 0 ? details.trim() : "(none)"}`,
    "",
    `Time: ${new Date().toISOString()}`,
  ].join("\n");

  for (const admin of ADMIN_EMAILS) {
    sendEmail({
      to: admin,
      subject: `New Unseen report — ${reason}`,
      text,
    }).catch((err: unknown) => console.warn("[reports] notify failed:", err));
  }

  return NextResponse.json({ ok: true });
}
