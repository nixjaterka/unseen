import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

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
    .select("id, reporter_id, reported_id, match_id, reason, details, created_at, resolved_at, resolved_by")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "open")     query = query.is("resolved_at", null);
  if (filter === "resolved") query = query.not("resolved_at", "is", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reports: data ?? [] });
}

// POST — resolve a report.
// Body: { reportId: string }
export async function POST(req: Request) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const reportId = typeof body?.reportId === "string" ? body.reportId : null;
  if (!reportId) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

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
