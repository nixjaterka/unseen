"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  match_id: number | null;
  reason: string;
  details: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  message_id: number | null;
  escalated_at: string | null;
  escalated_by: string | null;
  // The reported message itself, attached by the API. Voice messages come
  // with a signed URL so it can be listened to right here.
  message: { content: string; kind: string; audioUrl: string | null } | null;
};

const REASON_EMOJI: Record<string, string> = {
  contact_sharing:          "📇",
  inappropriate:            "💬",
  threat:                   "🚨",
  other:                    "❓",
  "Inappropriate messages": "💬",
  "Harassment":             "⚠️",
  "Fake profile":           "🎭",
  "Other":                  "❓",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load(f: typeof filter) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/reports?filter=${f}`);
    const json = await res.json().catch(() => null);
    if (!json?.reports) { setError("Failed to load reports."); setLoading(false); return; }
    setReports(json.reports);
    setLoading(false);
  }

  useEffect(() => { load(filter); }, [filter]);

  async function escalate(reportId: string) {
    setActing(reportId);
    await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action: "escalate" }),
    });
    setActing(null);
    void load(filter);
  }

  async function resolve(reportId: string) {
    setActing(reportId);
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    const json = await res.json().catch(() => null);
    if (!json?.ok) { alert(json?.error ?? "Failed"); setActing(null); return; }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setActing(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Reports</h1>
        <p className="text-sm text-neutral-500 mt-1">User-submitted reports about other users.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-[#E0175C] text-white"
                : "bg-white border border-[#EDE3DA] text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EDE3DA] p-10 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-medium text-black">No {filter === "all" ? "" : filter} reports</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#EDE3DA] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#EDE3DA] text-xs text-neutral-500">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
          </div>
          <div className="divide-y divide-[#F5EFE9]">
            {reports.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-start gap-4">
                <span className="text-xl mt-0.5 shrink-0">
                  {REASON_EMOJI[r.reason] ?? "❓"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-black">{r.reason}</span>
                    {r.resolved_at && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        Resolved
                      </span>
                    )}
                    {r.escalated_at && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Sent to safety
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Reporter: <code className="font-mono">{r.reporter_id.slice(0, 8)}…</code>
                    {" · "}
                    Reported: <code className="font-mono">{r.reported_id.slice(0, 8)}…</code>
                    {r.match_id ? ` · match #${r.match_id}` : ""}
                  </p>
                  {r.message && (
                    <div className="mt-2 rounded-lg border border-[#EDE3DA] bg-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-400 mb-1">
                        Reported {r.message.kind === "voice" ? "voice message" : "message"}
                      </p>
                      {r.message.kind === "voice" ? (
                        r.message.audioUrl ? (
                          <audio controls src={r.message.audioUrl} className="w-full max-w-sm" />
                        ) : (
                          <p className="text-xs text-neutral-400 italic">recording unavailable</p>
                        )
                      ) : (
                        <p className="text-xs text-neutral-700">{r.message.content}</p>
                      )}
                    </div>
                  )}
                  {r.details && (
                    <p className="text-xs text-neutral-600 mt-1.5 rounded-lg bg-[#FAF3EE] px-3 py-2 italic">
                      "{r.details}"
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    {new Date(r.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  {!r.escalated_at && (
                    <button
                      type="button"
                      disabled={acting === r.id}
                      onClick={() => escalate(r.id)}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {acting === r.id ? "…" : "Send to safety"}
                    </button>
                  )}
                  {!r.resolved_at && (
                    <button
                      type="button"
                      disabled={acting === r.id}
                      onClick={() => resolve(r.id)}
                      className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                    >
                      {acting === r.id ? "…" : "Resolve"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
