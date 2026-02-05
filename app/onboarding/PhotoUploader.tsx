"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type PhotoRow = {
  id: string;
  path: string;
  is_primary: boolean;
};

export default function PhotoUploader() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");

  async function refreshPhotos() {
    setError("");

    const { data, error: err } = await supabase
      .from("photos")
      .select("id, path, is_primary")
      .order("created_at", { ascending: true });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setPhotos((data ?? []) as PhotoRow[]);

    // Generate signed URLs for preview (private bucket)
    const urls: Record<string, string> = {};
    for (const p of data ?? []) {
      const { data: signed } = await supabase.storage
        .from("user_photos")
        .createSignedUrl(p.path, 60 * 5); // 5 minutes

      if (signed?.signedUrl) urls[p.id] = signed.signedUrl;
    }
    setPreviewUrls(urls);

    setLoading(false);
  }

  useEffect(() => {
    refreshPhotos();
  }, []);

  async function upload(file: File) {
    setError("");
    setUploading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      setUploading(false);
      setError("Not logged in.");
      return;
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

    const { error: insertErr } = await supabase.from("photos").insert({
      user_id: uid,
      path,
      is_primary: photos.length === 0, // first photo becomes primary
    });

    if (insertErr) {
      setUploading(false);
      setError(insertErr.message);
      return;
    }

    setUploading(false);
    await refreshPhotos();
  }

  async function removePhoto(photoId: string, path: string) {
    setError("");

    // 1) delete storage object
    const { error: storageErr } = await supabase.storage
      .from("user_photos")
      .remove([path]);

    if (storageErr) {
      setError(storageErr.message);
      return;
    }

    // 2) delete DB row
    const { error: dbErr } = await supabase.from("photos").delete().eq("id", photoId);

    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    await refreshPhotos();
  }

  if (loading) return <p className="text-neutral-300">Loading photos…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Photos</h2>
        <p className="text-neutral-300">
          Photos are used only for swiping. They will never appear inside chats.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-red-200">
          {error}
        </div>
      ) : null}

      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      {uploading ? <p className="text-neutral-300">Uploading…</p> : null}

      <div className="grid grid-cols-2 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="rounded-lg border border-white/10 p-2">
            {previewUrls[p.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrls[p.id]}
                alt="uploaded"
                className="w-full h-40 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-40 bg-white/5 rounded-md" />
            )}

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-neutral-300">
                {p.is_primary ? "Primary" : "Photo"}
              </span>

              <button
                className="text-xs text-red-200"
                onClick={() => removePhoto(p.id, p.path)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-neutral-400">
        Tip: add at least 1 photo to be swipe-visible.
      </p>
    </div>
  );
}