"use client";

import { useEffect, useState } from "react";

export default function SwipePage() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/swipe/next");
    const json = await res.json();
    setPhotoUrl(json?.candidate?.photoUrl ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Swipe (MVP)</h1>

      {photoUrl ? (
        <img
          src={photoUrl}
          alt="candidate"
          className="w-80 h-96 object-cover rounded-xl"
        />
      ) : (
        <p className="text-neutral-300">No candidate found yet.</p>
      )}

      <button
        className="px-6 py-3 rounded-full bg-white text-black"
        onClick={load}
      >
        Next
      </button>
    </main>
  );
}