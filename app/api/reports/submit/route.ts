import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendEmail } from "../../../../lib/email";

const SAFETY_EMAIL =
  process.env.SAFETY_EMAIL ?? "unseen-safety@randenibezfiltru.cz";

// Server-side report submission. Replaces the direct client insert so we
// can (a) validate the payload server-side and (b) send a notification
// email to safety@ on every new report.
//
// Body: { reportedId: string, matchId: number | null, reason: string, details: string | null }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const reportedId = typeof body?.reportedId === "string" ? body.reportedId : null;
  const matchId =
    typeof body?.matchId === "number" || body?.matchId === null ? body.matchId : null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : null;
  const details = typeof body?.details === "string" ? body.details : null;

  if (!reportedId || !reason) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 }
    );
  }

  // Don't allow self-reports.
  if (reportedId === user.id) {
    return NextResponse.json(
      { ok: false, error: "cannot_report_self" },
      { status: 400 }
    );
  }

  const { error: insertErr } = await supabaseAdmin.from("reports").insert({
    reporter_id: user.id,
    reported_id: reportedId,
    match_id: matchId,
    reason,
    details: details && details.trim().length > 0 ? details.trim() : null,
  });

  if (insertErr) {
    return NextResponse.json(
      { ok: false, error: insertErr.message },
      { status: 500 }
    );
  }

  // Fire-and-forget email notification. Don't block the response on it —
  // if Resend is down or the API key isn't set, the report is still saved.
  const text = [
    "A new report was filed on Unseen.",
    "",
    `Reporter: ${user.id}`,
    `Reported: ${reportedId}`,
    `Match: ${matchId ?? "(no match)"}`,
    `Reason: ${reason}`,
    `Details: ${details && details.trim().length > 0 ? details.trim() : "(none)"}`,
    "",
    `Time: ${new Date().toISOString()}`,
  ].join("\n");

  sendEmail({
    to: SAFETY_EMAIL,
    subject: `New Unseen report — ${reason}`,
    text,
  }).catch((err) => console.warn("[reports] notify failed:", err));

  return NextResponse.json({ ok: true });
}
