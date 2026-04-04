"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    window.location.href = "/app";
  }

  async function signUp() {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    window.location.href = "/onboarding";
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <h1 className="text-3xl font-semibold text-center">Log in to Unseen</h1>

        <input
          className="border px-4 py-3 rounded w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border px-4 py-3 rounded w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg ? (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        ) : null}

        <button
          onClick={signIn}
          disabled={loading || !email || !password}
          className="px-6 py-3 rounded-full bg-black text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <button
          onClick={signUp}
          disabled={loading || !email || !password}
          className="px-6 py-3 rounded-full border disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </main>
  );
}