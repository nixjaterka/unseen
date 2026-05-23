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
  flagged_at: string | null;
  photo_rejection_count: number;
};

export default function AdminPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<PendingPhoto | null>(null);

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
    if (lightbox?.id === photoId) setLightbox(null);
    setActing(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Photo review queue</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Auto-blocked photos (nudity, no face) are rejected instantly. These are borderline cases: group photos and possibly AI-generated images.
        </p>
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EDE3DA] p-10 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-medium text-black">All clear</p>
          <p className="text-sm text-neutral-500 mt-1">No photos pending review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{photos.length} photo{photos.length !== 1 ? "s" : ""} waiting</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((photo) => {
              const isFlagged = !!photo.flagged_at;
              const strikes = photo.photo_rejection_count;

              return (
                <div
                  key={photo.id}
                  className={`rounded-2xl border overflow-hidden shadow-sm ${
                    isFlagged
                      ? "border-red-300 bg-red-50"
                      : "border-[#EDE3DA] bg-white"
                  }`}
                >
                  <div
                    className="relative aspect-square bg-[#F5F5F5] cursor-pointer active:opacity-80"
                    onClick={() => photo.signedUrl && setLightbox(photo)}
                  >
                    {photo.signedUrl ? (
                      <>
                        <img
                          src={photo.signedUrl}
                          alt="Pending photo"
                          className="h-full w-full object-cover"
                        />
                        {/* Enlarge hint */}
                        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-0.5 text-[10px] text-white">
                          ⤢ enlarge
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-400 text-sm">
                        No preview
                      </div>
                    )}

                    {isFlagged && (
                      <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        🚩 FLAGGED
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

                    {strikes > 0 && (
                      <p className="text-[11px] font-medium text-red-500">
                        {strikes} rejection{strikes !== 1 ? "s" : ""} on this account
                      </p>
                    )}

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
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white text-2xl font-bold leading-none"
            >
              ✕
            </button>

            <img
              src={lightbox.signedUrl!}
              alt="Photo enlarged"
              className="w-full rounded-2xl object-contain max-h-[70vh]"
            />

            {/* Meta + actions */}
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/70 text-xs">{lightbox.user_id.slice(0, 8)}… · slot {lightbox.position}</span>
                {lightbox.flagged_at && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">🚩 FLAGGED</span>
                )}
                {lightbox.photo_rejection_count > 0 && (
                  <span className="text-red-400 text-xs">{lightbox.photo_rejection_count} prior rejection{lightbox.photo_rejection_count !== 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={acting === lightbox.id}
                  onClick={() => act(lightbox.id, "approve")}
                  className="flex-1 rounded-full bg-[#E0175C] py-3 text-sm text-white font-bold disabled:opacity-50"
                >
                  {acting === lightbox.id ? "…" : "✓ Approve"}
                </button>
                <button
                  type="button"
                  disabled={acting === lightbox.id}
                  onClick={() => act(lightbox.id, "reject")}
                  className="flex-1 rounded-full border border-white/30 py-3 text-sm text-white disabled:opacity-50"
                >
                  {acting === lightbox.id ? "…" : "✕ Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
