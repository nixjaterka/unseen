"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

type PhotoRow = {
  id: string;
  path: string;
  is_primary: boolean;
  position?: number | null;
  created_at?: string;
  moderation_status?: string;
};

const MAX_PHOTOS = 6;

// ── Image compression ─────────────────────────────────────────────────────────
// Resize to max 1200px and convert to JPEG before upload. Benefits:
//   • Converts HEIC (iPhone) → JPEG, which Sightengine handles reliably
//   • Reduces file size → faster moderation API round-trip
//   • Consistent format in storage
async function compressImage(file: File, maxPx = 1200, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback: upload original
    };

    img.src = objectUrl;
  });
}

type PhotoUploaderProps = {
  /** Called whenever the approved photo count changes. */
  onApprovedCountChange?: (count: number) => void;
};

export default function PhotoUploader({ onApprovedCountChange }: PhotoUploaderProps) {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [hasRejectionNotification, setHasRejectionNotification] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const touchDragRef = useRef<{ slotIndex: number } | null>(null);

  async function refreshPhotos() {
    setError("");

    const [photosResult, profileResult] = await Promise.all([
      supabase
        .from("photos")
        .select("id, path, is_primary, position, created_at, moderation_status")
        .is("deleted_at", null)
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("has_rejection_notification")
        .maybeSingle(),
    ]);

    if (photosResult.error) {
      setError(photosResult.error.message);
      setLoading(false);
      return;
    }

    const rows = ((photosResult.data ?? []) as PhotoRow[]).slice(0, MAX_PHOTOS);

    // Sort by position so any gaps become visible
    const sorted = [...rows].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

    // Compact: if positions aren't 1,2,3,…N, renumber them so there are no gaps
    const needsCompact = sorted.some((p, i) => (p.position ?? 0) !== i + 1);
    let finalRows: PhotoRow[];
    if (needsCompact) {
      await Promise.all(
        sorted.map((p, i) =>
          supabase.from("photos").update({ position: i + 1 }).eq("id", p.id)
        )
      );
      finalRows = sorted.map((p, i) => ({ ...p, position: i + 1, is_primary: i === 0 }));
    } else {
      finalRows = sorted.map((p) => ({ ...p, is_primary: p.position === 1 }));
    }

    setPhotos(finalRows);
    setPendingCount(finalRows.filter((p) => p.moderation_status === "pending").length);

    const approvedCount = finalRows.filter((p) => p.moderation_status === "approved").length;
    onApprovedCountChange?.(approvedCount);

    setHasRejectionNotification(
      profileResult.data?.has_rejection_notification === true
    );

    const urls: Record<string, string> = {};
    for (const p of rows) {
      const { data: signed } = await supabase.storage
        .from("user_photos")
        .createSignedUrl(p.path, 60 * 5);

      if (signed?.signedUrl) {
        urls[p.id] = signed.signedUrl;
      }
    }

    setPreviewUrls(urls);
    setLoading(false);
  }

  useEffect(() => {
    refreshPhotos();
  }, []);

  async function dismissRejectionNotification() {
    setHasRejectionNotification(false);
    await supabase
      .from("profiles")
      .update({ has_rejection_notification: false });
  }

  async function deletePhoto(photoId: string) {
    setDeletingId(photoId);
    const { error } = await supabase
      .from("photos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", photoId);

    if (error) {
      setError(error.message);
    } else {
      await refreshPhotos();
    }
    setDeletingId(null);
  }

  async function uploadToSlot(file: File, slotIndex: number) {
    setError("");
    setUploadingSlot(slotIndex);

    // Compress + convert to JPEG before upload. This keeps files small
    // (faster moderation), converts HEIC from iPhones, and avoids sending
    // huge RAW-ish files to Sightengine.
    const compressed = await compressImage(file);

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      setUploadingSlot(null);
      setError(t("photos.error_not_logged_in"));
      return;
    }

    const existingPhoto = photos[slotIndex];

    // If a photo already exists in this slot, remove it first
    if (existingPhoto) {
      const { error: removeStorageErr } = await supabase.storage
        .from("user_photos")
        .remove([existingPhoto.path]);

      if (removeStorageErr) {
        setUploadingSlot(null);
        setError(removeStorageErr.message);
        return;
      }

      const { error: removeDbErr } = await supabase
        .from("photos")
        .delete()
        .eq("id", existingPhoto.id);

      if (removeDbErr) {
        setUploadingSlot(null);
        setError(removeDbErr.message);
        return;
      }
    }

    const path = `${uid}/${crypto.randomUUID()}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from("user_photos")
      .upload(path, compressed, {
        upsert: false,
        contentType: "image/jpeg",
      });

    if (uploadErr) {
      setUploadingSlot(null);
      setError(uploadErr.message);
      return;
    }

    // Moderate before inserting the row. If flagged, delete the storage
    // object so it doesn't linger.
    let moderationStatus = "approved";
    try {
      const moderationRes = await fetch("/api/photos/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const moderation = await moderationRes.json();

      if (!moderation?.clean) {
        await supabase.storage.from("user_photos").remove([path]);
        setUploadingSlot(null);
        setError(t("photos.rejected"));
        return;
      }

      if (moderation?.pending) {
        moderationStatus = "pending";
      }
    } catch {
      // Network error reaching moderation. Fail closed — delete the upload.
      await supabase.storage.from("user_photos").remove([path]);
      setUploadingSlot(null);
      setError(t("photos.rejected"));
      return;
    }

    const { error: insertErr } = await supabase.from("photos").insert({
      user_id: uid,
      path,
      is_primary: slotIndex === 0,
      position: slotIndex + 1,
      moderation_status: moderationStatus,
    });

    if (insertErr) {
      setUploadingSlot(null);
      setError(insertErr.message);
      return;
    }

    // If first tile is uploaded, make all other photos non-primary
    await supabase
    .from("photos")
    .update({ is_primary: false })
    .eq("user_id", uid);

  await supabase
    .from("photos")
    .update({ is_primary: true })
    .eq("user_id", uid)
    .eq("position", 1);

    setUploadingSlot(null);
    setActiveSlot(null);
    await refreshPhotos();
  }

  async function setPrimaryPhoto(photoId: string) {
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      setError(t("photos.error_not_logged_in"));
      return;
    }

    const { error: resetErr } = await supabase
      .from("photos")
      .update({ is_primary: false })
      .eq("user_id", uid);

    if (resetErr) {
      setError(resetErr.message);
      return;
    }

    const { error: primaryErr } = await supabase
      .from("photos")
      .update({ is_primary: true })
      .eq("id", photoId);

    if (primaryErr) {
      setError(primaryErr.message);
      return;
    }

    await refreshPhotos();
  }

  async function reorderPhotos(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      setError(t("photos.error_not_logged_in"));
      return;
    }

    const fromPosition = fromIndex + 1;
    const toPosition = toIndex + 1;

    const fromPhoto = photos.find((p) => p.position === fromPosition) ?? null;
    const toPhoto = photos.find((p) => p.position === toPosition) ?? null;

    if (!fromPhoto) return;

    // Move dragged photo to new slot
    const { error: moveErr } = await supabase
      .from("photos")
      .update({ position: toPosition })
      .eq("id", fromPhoto.id);

    if (moveErr) {
      setError(moveErr.message);
      return;
    }

    // If target slot had a photo, move it back to the old slot
    if (toPhoto) {
      const { error: swapErr } = await supabase
        .from("photos")
        .update({ position: fromPosition })
        .eq("id", toPhoto.id);

      if (swapErr) {
        setError(swapErr.message);
        return;
      }
    }

    // Keep primary in sync with slot 1
    await supabase
      .from("photos")
      .update({ is_primary: false })
      .eq("user_id", uid);

    await supabase
      .from("photos")
      .update({ is_primary: true })
      .eq("user_id", uid)
      .eq("position", 1);

    await refreshPhotos();
  }

  function handleTileClick(index: number) {
    const existingPhoto = photos.find((p) => p.position === index + 1);

    // Allow replacing a rejected photo (user taps it to upload a new one).
    if (existingPhoto && existingPhoto.moderation_status !== "rejected") {
      return;
    }

    setActiveSlot(index);
    inputRef.current?.click();
  }

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => {
    return photos.find((p) => p.position === i + 1) ?? null;
  });

  if (loading) {
    return <p className="text-neutral-500">{t("photos.loading")}</p>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-xl bg-white px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      ) : null}

      {hasRejectionNotification ? (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="flex-1 text-sm text-red-700">{t("photos.rejected_notification")}</p>
          <button
            type="button"
            onClick={dismissRejectionNotification}
            className="text-red-400 hover:text-red-600 text-lg leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ) : null}

      {pendingCount > 0 ? (
        <div className="rounded-xl bg-[#FFF3CD] border border-[#FFDFA0] px-4 py-3 text-sm text-[#5A4500]">
          {t("photos.pending_review")}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeSlot !== null) {
            uploadToSlot(file, activeSlot);
          }
          e.currentTarget.value = "";
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        {slots.map((photo, index) => (
          <button
            key={index}
            type="button"
            data-slot={index}
            onClick={() => handleTileClick(index)}
            /* Desktop drag-and-drop */
            onDragStart={() => { if (photo) setDraggedSlot(index); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={async () => {
              if (draggedSlot !== null) {
                await reorderPhotos(draggedSlot, index);
                setDraggedSlot(null);
              }
            }}
            onDragEnd={() => { setDraggedSlot(null); }}
            /* Mobile touch drag-and-drop */
            onTouchStart={() => {
              if (!photo || uploadingSlot !== null) return;
              touchDragRef.current = { slotIndex: index };
              setDraggedSlot(index);
            }}
            onTouchEnd={(e) => {
              if (!touchDragRef.current) return;
              const touch = e.changedTouches[0];
              const el = document.elementFromPoint(touch.clientX, touch.clientY);
              const slotEl = el?.closest("[data-slot]");
              const targetStr = slotEl?.getAttribute("data-slot");
              const targetIndex = targetStr != null ? parseInt(targetStr, 10) : null;
              if (targetIndex !== null && !isNaN(targetIndex) && targetIndex !== touchDragRef.current.slotIndex) {
                reorderPhotos(touchDragRef.current.slotIndex, targetIndex);
              }
              touchDragRef.current = null;
              setDraggedSlot(null);
            }}
            disabled={uploadingSlot !== null}
            draggable={!!photo && uploadingSlot === null}
            className={`relative aspect-square overflow-hidden rounded-2xl bg-[#E5E5E5] text-neutral-500 ${
              draggedSlot === index ? "opacity-50 scale-95" : ""
            } transition-transform`}
          >
            {photo && previewUrls[photo.id] ? (
              <img
                src={previewUrls[photo.id]}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-400">
                +
              </div>
            )}

            {index === 0 ? (
              <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-black">
                {t("photos.badge_profile")}
              </div>
            ) : null}

            {/* ✕ delete button — only for non-rejected photos (rejected has its own Remove button) */}
            {photo && uploadingSlot !== index && photo.moderation_status !== "rejected" ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                disabled={deletingId === photo.id}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70 transition-colors z-10"
                aria-label="Delete photo"
              >
                {deletingId === photo.id ? (
                  <div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : "✕"}
              </button>
            ) : null}

            {uploadingSlot === index ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                <div className="h-8 w-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
              </div>
            ) : photo?.moderation_status === "pending" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                <span className="text-[10px] font-semibold text-white text-center px-2 leading-tight">
                  {t("photos.badge_pending")}
                </span>
              </div>
            ) : photo?.moderation_status === "rejected" ? (
              /* Rejected overlay — includes its own Remove button so it's never blocked */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/75 rounded-2xl gap-2 z-10">
                <span className="text-[11px] font-bold text-white text-center px-2 leading-tight">
                  {t("photos.badge_rejected")}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                  disabled={deletingId === photo.id}
                  className="bg-white text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow active:scale-95 transition-transform"
                >
                  {deletingId === photo.id ? "…" : t("photos.remove")}
                </button>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      <p className="text-xs text-neutral-600">{t("photos.help")}</p>
    </div>
  );
}