"use client";

import { useEffect, useState } from "react";

type UserRow = {
  user_id: string;
  display_name: string | null;
  city: string | null;
  gender: string | null;
  created_at: string;
  flagged_at: string | null;
  photo_rejection_count: number;
  purge_scheduled_at: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "flagged">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load(f: typeof filter) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users?filter=${f}`);
    const json = await res.json().catch(() => null);
    if (!json?.users) { setError("Failed to load users."); setLoading(false); return; }
    setUsers(json.users);
    setLoading(false);
  }

  useEffect(() => { load(filter); }, [filter]);

  const visible = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.display_name?.toLowerCase().includes(q) ||
      u.user_id.includes(q) ||
      u.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Users</h1>
        <p className="text-sm text-neutral-500 mt-1">All registered profiles.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "flagged"] as const).map((f) => (
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
              {f === "flagged" ? "🚩 Flagged" : "All"}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search name, city, ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-full border border-[#EDE3DA] bg-white px-4 py-1.5 text-sm outline-none focus:border-[#E0175C]"
        />
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="rounded-2xl border border-[#EDE3DA] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#EDE3DA] text-xs text-neutral-500">
            {visible.length} user{visible.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </div>

          {visible.length === 0 ? (
            <p className="px-5 py-8 text-center text-neutral-400 text-sm">No users found.</p>
          ) : (
            <div className="divide-y divide-[#F5EFE9]">
              {visible.map((u) => (
                <div key={u.user_id} className="flex items-center gap-4 px-5 py-3">
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    u.flagged_at ? "bg-red-100 text-red-600" : "bg-[#F5EFE9] text-[#E0175C]"
                  }`}>
                    {(u.display_name ?? "?")[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-black truncate">
                        {u.display_name ?? "—"}
                      </span>
                      {u.flagged_at && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                          🚩 Flagged
                        </span>
                      )}
                      {u.purge_scheduled_at && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                          Deletion scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      <code className="font-mono">{u.user_id.slice(0, 12)}…</code>
                      {u.city ? ` · ${u.city}` : ""}
                      {u.gender ? ` · ${u.gender}` : ""}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-neutral-400">
                      {new Date(u.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    {u.photo_rejection_count > 0 && (
                      <p className="text-[11px] text-red-500 mt-0.5">
                        {u.photo_rejection_count} rejection{u.photo_rejection_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
