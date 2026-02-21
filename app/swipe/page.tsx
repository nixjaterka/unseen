"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Candidate = {
  candidateId: string;
  photoUrl: string;
};

export default function SwipePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function loadNext() {
    setMsg("");
    const res = await fetch("/api/swipe/next", {
      credentials: "include",
    });
    const json = await res.json();

    if (json?.reason === "not_authenticated") {
      router.replace("/login");
      return;
    }

    setCandidate(json?.candidate ?? null);
    setLoading(false);
  }

  async function act(direction: "like" | "pass") {
    if (!candidate) return;

    setMsg(direction === "like" ? "Liked ✅" : "Passed ❌");

    await fetch("/api/swipe/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: candidate.candidateId,
        direction,
      }),
    });

    await loadNext();
  }

  useEffect(() => {
    // Require login for swiping
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else loadNext();
    });
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Swipe</h1>

      {loading ? (
        <p className="text-neutral-300">Loading…</p>
      ) : candidate ? (
        <>
          <img
            src={candidate.photoUrl}
            alt="candidate"
            className="w-80 h-96 object-cover rounded-xl border border-white/10"
          />

          <div className="flex gap-4">
            <button
              className="px-6 py-3 rounded-full bg-white text-black font-medium"
              onClick={() => act("pass")}
            >
              Pass
            </button>
            <button
              className="px-6 py-3 rounded-full bg-white text-black font-medium"
              onClick={() => act("like")}
            >
              Like
            </button>
          </div>

          {msg ? <p className="text-sm text-neutral-400">{msg}</p> : null}
        </>
      ) : (
        <p className="text-neutral-300">No more candidates right now.</p>
      )}
    </main>
  );
}