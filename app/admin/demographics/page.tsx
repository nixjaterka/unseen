"use client";

import { useEffect, useState } from "react";

type DemoData = {
  total: number;
  gender: Record<string, number>;
  preferredGender: Record<string, number>;
  ageBuckets: Record<string, number>;
  avgAge: number | null;
  topCities: { city: string; count: number }[];
  avgPhotos: number | null;
  pctWithPhotos: number;
};

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="capitalize text-[#1C1410]">{label}</span>
        <span className="text-neutral-500">{count} <span className="text-neutral-400 text-xs">({Math.round(pct)}%)</span></span>
      </div>
      <div className="h-2.5 rounded-full bg-[#EDE3DA] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#1C1410]">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

const GENDER_COLORS: Record<string, string> = {
  woman: "#E0175C",
  man: "#3B82F6",
  nonbinary: "#8B5CF6",
  unknown: "#D1C4B8",
};

const AGE_COLOR = "#E0175C";

export default function AdminDemographicsPage() {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/demographics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load demographics."); setLoading(false); });
  }, []);

  if (loading) return <p className="text-neutral-400">Loading…</p>;
  if (error || !data) return <p className="text-red-500">{error || "No data."}</p>;

  const genderTotal = Object.values(data.gender).reduce((a, b) => a + b, 0);
  const prefTotal = Object.values(data.preferredGender).reduce((a, b) => a + b, 0);
  const ageTotal = Object.values(data.ageBuckets).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black">Demographics</h1>
        <p className="text-sm text-neutral-500 mt-1">Onboarded users only.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Onboarded users" value={data.total} />
        <StatCard label="Average age" value={data.avgAge ?? "—"} sub="years old" />
        <StatCard label="Avg photos / user" value={data.avgPhotos ?? "—"} sub="approved photos" />
        <StatCard label="Have ≥1 photo" value={`${data.pctWithPhotos}%`} sub="of onboarded users" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Gender */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-black">Gender</h2>
          {Object.entries(data.gender)
            .sort((a, b) => b[1] - a[1])
            .map(([g, n]) => (
              <Bar key={g} label={g} count={n} total={genderTotal} color={GENDER_COLORS[g] ?? "#D1C4B8"} />
            ))}
        </div>

        {/* Looking for */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-black">Looking for</h2>
          {Object.entries(data.preferredGender)
            .sort((a, b) => b[1] - a[1])
            .map(([g, n]) => (
              <Bar key={g} label={g} count={n} total={prefTotal} color={GENDER_COLORS[g] ?? "#D1C4B8"} />
            ))}
        </div>

        {/* Age distribution */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-black">Age distribution</h2>
          {Object.entries(data.ageBuckets)
            .filter(([, n]) => n > 0)
            .map(([bucket, n]) => (
              <Bar key={bucket} label={bucket} count={n} total={ageTotal} color={AGE_COLOR} />
            ))}
        </div>

        {/* Top cities */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-black mb-4">Top cities</h2>
          <div className="space-y-2">
            {data.topCities.map(({ city, count }, i) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 w-5 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-sm text-[#1C1410] capitalize truncate">{city}</span>
                  <span className="text-sm font-semibold text-[#1C1410] shrink-0">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
