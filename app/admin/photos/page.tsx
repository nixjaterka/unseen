"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PendingPhoto = {
  id: string;
  user_id: string;
  path: string;
  position: number;
  moderation_status: string;
  created_at: string;
  signedUrl: string | null;
};

export default function AdminPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null); // photoId being acted on

  async function loadPhotos() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/photos");
    if (res.status === 403) {
      router.replace("/");
      return;
    }

    const json = await res.json().catch(() => null);
    if (!json?.photos) {
      setError("Failed to load photos.");
      setLoading(false);
      return;
    }

    setPhotos(json.photos);
    setLoading(false);
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  async function act(photoId: string, action: "approve" | "reject") {
    setActing(photoId);

    const res = await fetch("/api/admin/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, action }),
    });

    const json = await res.json().catch(() => null);

    if (!json?.ok) {
      alert(json?.error ?? "Action failed.");
      setActing(null);
      return;
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setActing(null);
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <img
          src="/brand/icononly_transparent_nobuffer.png"
          alt="Unseen"
          className="h-8 w-auto object-contain"
        />
        <h1 className="text-xl font-bold">Photo review queue</h1>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl bg-[#FAF3EE] border border-[#EDE3DA] p-8 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-medium text-black">All clear</p>
          <p className="text-sm text-neutral-600 mt-1">No photos pending review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{photos.length} photo{photos.length !== 1 ? "s" : ""} waiting</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-2xl border border-[#EDE3DA] bg-white overflow-hidden shadow-sm"
              >
                <div className="relative aspect-square bg-[#F5F5F5]">
                  {photo.signedUrl ? (
                    <img
                      src={photo.signedUrl}
                      alt="Pending photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400 text-sm">
                      No preview
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <p className="text-[11px] text-neutral-500 truncate">
                    {photo.user_id.slice(0, 8)}… · slot {photo.position}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {new Date(photo.created_at).toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={acting === photo.id}
                      onClick={() => act(photo.id, "approve")}
                      className="flex-1 rounded-full bg-[#E0175C] py-2 text-xs text-white font-medium disabled:opacity-50"
                    >
                      {acting === photo.id ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={acting === photo.id}
                      onClick={() => act(photo.id, "reject")}
                      className="flex-1 rounded-full border border-neutral-200 py-2 text-xs text-neutral-700 disabled:opacity-50"
                    >
                      {acting === photo.id ? "…" : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
