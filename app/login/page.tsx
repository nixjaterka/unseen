"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/app",
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Log in to Unseen</h1>

      {sent ? (
        <p className="text-neutral-300 text-center">
          Magic link sent. Check your email and click the link to log in.
        </p>
      ) : (
        <>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-3 rounded-md text-black w-80 max-w-full"
          />

          <button
            onClick={signIn}
            disabled={!email || loading}
            className="px-6 py-3 rounded-full bg-white text-black font-medium disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </>
      )}
    </main>
  );
}