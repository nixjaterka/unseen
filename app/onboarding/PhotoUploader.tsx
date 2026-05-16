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

export default function PhotoUploader() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  async function refreshPhotos() {
    setError("");

    const { data, error: err } = await supabase
    .from("photos")
    .select("id, path, is_primary, position, created_at, moderation_status")
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const rows = ((data ?? []) as PhotoRow[]).slice(0, MAX_PHOTOS);

    const fixedRows = rows.map((photo) => ({
      ...photo,
      is_primary: photo.position === 1,
    }));

    setPhotos(fixedRows);
    setPendingCount(fixedRows.filter((p) => p.moderation_status === "pending").length);

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

  async function uploadToSlot(file: File, slotIndex: number) {
    setError("");
    setUploading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      setUploading(false);
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
        setUploading(false);
        setError(removeStorageErr.message);
        return;
      }

      const { error: removeDbErr } = await supabase
        .from("photos")
        .delete()
        .eq("id", existingPhoto.id);

      if (removeDbErr) {
        setUploading(false);
        setError(removeDbErr.message);
        return;
      }
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${uid}/${filename}`;

    const { error: uploadErr } = await supabase.storage
      .from("user_photos")
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadErr) {
      setUploading(false);
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
        setUploading(false);
        setError(t("photos.rejected"));
        return;
      }

      if (moderation?.pending) {
        moderationStatus = "pending";
      }
    } catch {
      // Network error reaching moderation. Fail closed — delete the upload.
      await supabase.storage.from("user_photos").remove([path]);
      setUploading(false);
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
      setUploading(false);
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

    setUploading(false);
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

    if (existingPhoto) {
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
                  onClick={() => handleTileClick(index)}
                  onDragStart={() => {
                    if (photo) setDraggedSlot(index);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={async () => {
                    if (draggedSlot !== null) {
                      await reorderPhotos(draggedSlot, index);
                      setDraggedSlot(null);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedSlot(null);
                  }}
                  disabled={uploading}
                  draggable={!!photo}
                  className={`relative aspect-square overflow-hidden rounded-2xl bg-[#E5E5E5] text-neutral-500 ${
                    draggedSlot === index ? "opacity-50" : ""
                  }`}
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

            {photo?.moderation_status === "pending" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                <span className="text-[10px] font-semibold text-white text-center px-2 leading-tight">
                  {t("photos.badge_pending")}
                </span>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      <p className="text-xs text-neutral-600">{t("photos.help")}</p>
    </div>
  );
}