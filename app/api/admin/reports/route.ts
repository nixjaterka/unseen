import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendEmail } from "../../../../lib/email";

const SAFETY_EMAIL =
  process.env.SAFETY_EMAIL ?? "unseen-safety@randenibezfiltru.cz";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (!ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) return null;
  return user;
}

// GET — list all reports, newest first.
export async function GET(req: Request) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "open"; // open | resolved | all

  let query = supabaseAdmin
    .from("reports")
    .select("id, reporter_id, reported_id, match_id, message_id, reason, details, created_at, resolved_at, resolved_by, escalated_at, escalated_by")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "open")     query = query.is("resolved_at", null);
  if (filter === "resolved") query = query.not("resolved_at", "is", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach the reported message so a moderator can judge without going to
  // the database. A reported VOICE message gets a short-lived signed URL —
  // "somewhere in this conversation" is not something you can listen to.
  const reports = data ?? [];
  const messageIds = reports
    .map((r) => r.message_id)
    .filter((id): id is number => typeof id === "number");

  const messageMap = new Map<number, { content: string; kind: string; audioUrl: string | null }>();

  if (messageIds.length > 0) {
    const { data: msgs } = await supabaseAdmin
      .from("messages")
      .select("id, content, kind, audio_path, created_at")
      .in("id", messageIds);

    for (const m of msgs ?? []) {
      let audioUrl: string | null = null;
      if (m.kind === "voice" && m.audio_path) {
        const { data: signed } = await supabaseAdmin.storage
          .from("voice_messages")
          .createSignedUrl(m.audio_path as string, 60 * 30);
        audioUrl = signed?.signedUrl ?? null;
      }
      messageMap.set(m.id as number, {
        content: (m.content as string) ?? "",
        kind: (m.kind as string) ?? "text",
        audioUrl,
      });
    }
  }

  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      message: r.message_id ? messageMap.get(r.message_id) ?? null : null,
    })),
  });
}

// POST — resolve a report.
// Body: { reportId: string }
export async function POST(req: Request) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const reportId = typeof body?.reportId === "string" ? body.reportId : null;
  const action = body?.action === "escalate" ? "escalate" : "resolve";
  if (!reportId) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  // Escalation — forward to the safety inbox. Deliberate, never automatic, so
  // that everything sitting in safety@ is something a human judged to belong
  // there.
  if (action === "escalate") {
    const { data: report, error: loadErr } = await supabaseAdmin
      .from("reports")
      .select("id, reporter_id, reported_id, match_id, message_id, reason, details, created_at")
      .eq("id", reportId)
      .maybeSingle();

    if (loadErr || !report) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    let messageLine = "(whole conversation)";
    if (report.message_id) {
      const { data: msg } = await supabaseAdmin
        .from("messages")
        .select("kind, content, audio_path")
        .eq("id", report.message_id)
        .maybeSingle();

      if (msg?.kind === "voice" && msg.audio_path) {
        const { data: signed } = await supabaseAdmin.storage
          .from("voice_messages")
          .createSignedUrl(msg.audio_path as string, 60 * 60 * 24 * 7);
        messageLine = `voice message #${report.message_id} — ${signed?.signedUrl ?? "(could not sign URL)"}`;
      } else {
        messageLine = `message #${report.message_id}: ${msg?.content ?? "(not found)"}`;
      }
    }

    const text = [
      "A report has been escalated as a safety hazard.",
      "",
      `Report: ${report.id}`,
      `Escalated by: ${user.email ?? user.id}`,
      `Reporter: ${report.reporter_id}`,
      `Reported: ${report.reported_id}`,
      `Match: ${report.match_id ?? "(no match)"}`,
      `Reason: ${report.reason}`,
      `Reported content: ${messageLine}`,
      `Details: ${report.details ?? "(none)"}`,
      `Filed: ${report.created_at}`,
    ].join("\n");

    await sendEmail({
      to: SAFETY_EMAIL,
      subject: `SAFETY — escalated Unseen report (${report.reason})`,
      text,
    }).catch((err: unknown) => console.warn("[admin/reports] escalate email failed:", err));

    const { error: escErr } = await supabaseAdmin
      .from("reports")
      .update({ escalated_at: new Date().toISOString(), escalated_by: user.id })
      .eq("id", reportId);

    if (escErr) return NextResponse.json({ error: escErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, escalated: true });
  }

  const { error } = await supabaseAdmin
    .from("reports")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", reportId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
