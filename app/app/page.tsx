"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type SessionUser = { email: string | null };

function resetSupabaseClientState() {
  // Clears Supabase auth remnants that can cause “ghost sessions” in Chrome.
  try {
    // localStorage keys often start with: sb-<project-ref>-auth-token
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-")) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("sb-")) sessionStorage.removeItem(k);
    }
  } catch {
    // ignore (private mode etc.)
  }
}

export default function AppHome() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("Checking session…");
  const [user, setUser] = useState<SessionUser | null>(null);

  const didFinish = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let initialized = false;
  
    async function decide(session: any | null) {
      if (cancelled) return;
  
      if (!session) {
        router.replace("/login");
        return;
      }
  
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .maybeSingle();
  
      if (cancelled) return;
  
      if (error || !profile?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }
  
      setUser({ email: session.user.email ?? null });
      setLoading(false);
    }
  
    // 🔑 Wait for Supabase to finish restoring auth
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
  
        if (event === "INITIAL_SESSION") {
          initialized = true;
          await decide(session);
        }
  
        if (event === "SIGNED_OUT") {
          router.replace("/login");
        }
      }
    );
  
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    resetSupabaseClientState();
    router.replace("/login");
  }

  function recover() {
    resetSupabaseClientState();
    router.replace("/login");
  }

  // Loading screen (but not forever)
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-neutral-300">Loading…</p>
        <p className="text-sm text-neutral-400">{status}</p>
      </main>
    );
  }

  // Recovery screen (when something goes weird)
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-2xl font-semibold">Unseen</h1>
        <p className="text-neutral-300">{status}</p>

        <button
          onClick={recover}
          className="px-6 py-3 rounded-full bg-white text-black font-medium"
        >
          Reset session & go to login
        </button>
      </main>
    );
  }

  // Normal app view
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Unseen / App</h1>

      <p className="text-neutral-300">
        Logged in as: <span className="text-white">{user.email}</span>
      </p>

      <button
        onClick={logout}
        className="px-6 py-3 rounded-full bg-white text-black font-medium"
      >
        Log out
      </button>
    </main>
  );
}