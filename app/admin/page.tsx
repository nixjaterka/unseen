"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  users:           { total: number; week: number; today: number };
  matches:         { total: number; active: number; week: number };
  photos:          { pending: number };
  reports:         { total: number; week: number };
  messages:        { total: number; today: number };
  flaggedAccounts: number;
  recentUsers:     Array<{ user_id: string; display_name: string | null; created_at: string }>;
  signupSparkline: number[];
};

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const h = 36;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline
        fill="none"
        stroke="#E0175C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function StatCard({
  icon, label, value, sub, href, accent, sparkline,
}: {
  icon: string;
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
  accent?: boolean;
  sparkline?: number[];
}) {
  const inner = (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 h-full transition-shadow ${
      accent
        ? "border-[#E0175C]/30 bg-[#E0175C]/5"
        : "border-[#EDE3DA] bg-white hover:shadow-sm"
    } ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-black mt-1">{value}</p>
          {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      {sparkline && <Sparkline data={sparkline} />}
      {href && (
        <p className="text-xs text-[#E0175C] font-medium mt-auto">View →</p>
      )}
    </div>
  );

  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => { setError("Failed to load stats."); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-neutral-400">
        Loading…
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-red-500">{error || "Unknown error"}</p>;
  }

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">{dateLabel}</p>
      </div>

      {/* Alerts row */}
      {(stats.photos.pending > 0 || stats.flaggedAccounts > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.photos.pending > 0 && (
            <Link
              href="/admin/photos"
              className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span>📸</span>
              <span><strong>{stats.photos.pending}</strong> photo{stats.photos.pending !== 1 ? "s" : ""} waiting for review</span>
              <span className="text-amber-500">→</span>
            </Link>
          )}
          {stats.flaggedAccounts > 0 && (
            <Link
              href="/admin/users"
              className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-800 hover:bg-red-100 transition-colors"
            >
              <span>🚩</span>
              <span><strong>{stats.flaggedAccounts}</strong> flagged account{stats.flaggedAccounts !== 1 ? "s" : ""}</span>
              <span className="text-red-400">→</span>
            </Link>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          icon="👤"
          label="Total users"
          value={stats.users.total}
          sub={`+${stats.users.week} this week · +${stats.users.today} today`}
          sparkline={stats.signupSparkline}
        />
        <StatCard
          icon="💞"
          label="Active matches"
          value={stats.matches.active}
          sub={`${stats.matches.total} total · +${stats.matches.week} this week`}
        />
        <StatCard
          icon="💬"
          label="Messages today"
          value={stats.messages.today}
          sub={`${stats.messages.total.toLocaleString()} total`}
        />
        <StatCard
          icon="📸"
          label="Photos pending"
          value={stats.photos.pending}
          href="/admin/photos"
          accent={stats.photos.pending > 0}
        />
        <StatCard
          icon="🚩"
          label="Reports this week"
          value={stats.reports.week}
          sub={`${stats.reports.total} total`}
          href="/admin/reports"
          accent={stats.reports.week > 0}
        />
        <StatCard
          icon="⚠️"
          label="Flagged accounts"
          value={stats.flaggedAccounts}
          href="/admin/users"
          accent={stats.flaggedAccounts > 0}
        />
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl border border-[#EDE3DA] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EDE3DA] flex items-center justify-between">
          <h2 className="font-semibold text-sm text-black">Recent signups</h2>
          <Link href="/admin/users" className="text-xs text-[#E0175C] font-medium">All users →</Link>
        </div>
        <div className="divide-y divide-[#F5EFE9]">
          {stats.recentUsers.length === 0 ? (
            <p className="px-5 py-4 text-sm text-neutral-400">No users yet.</p>
          ) : (
            stats.recentUsers.map((u) => (
              <div key={u.user_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#F5EFE9] flex items-center justify-center text-xs font-bold text-[#E0175C]">
                    {(u.display_name ?? "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{u.display_name ?? "—"}</p>
                    <p className="text-[11px] text-neutral-400">{u.user_id.slice(0, 8)}…</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-400">
                  {new Date(u.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
