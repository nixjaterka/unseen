"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    searchParams.get("error") === "link_expired"
      ? t("login.error_link_expired")
      : null
  );

  // If already signed in, leave the login screen.
  useEffect(() => {
    let cancelled = false;

    async function decide(session: Session | null) {
      if (cancelled) return;

      if (!session) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      router.replace(profile?.onboarded_at ? "/app" : "/onboarding");
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "INITIAL_SESSION") decide(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function signIn() {
    setLoading(true);
    setErrorMsg(null);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    if (signInData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("deleted_at")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (profile?.deleted_at) {
        await supabase.auth.signOut();
        setLoading(false);
        setErrorMsg(t("login.error_account_deleted"));
        return;
      }
    }

    setLoading(false);
    router.replace("/app");
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setErrorMsg(null);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });
    // Browser navigates away.
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full flex flex-col gap-5">

        {/* Back + Logo */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="self-start text-sm text-[#A89488] hover:text-[#E0175C] transition-colors -mb-2"
        >
          ← Back
        </button>

        <div className="flex justify-center mb-2">
          <button type="button" onClick={() => router.push("/")}>
            <img
              src="/brand/fulllogo_transparent_nobuffer.png"
              alt="Unseen"
              className="h-16 w-auto object-contain"
            />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#1C1410]">{t("login.heading")}</h1>

        {/* Google login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-3.5 rounded-full border-2 border-[#EDE3DA] text-[#1C1410] font-semibold flex items-center justify-center gap-3 disabled:opacity-40 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {googleLoading ? t("login.cta_login_loading") : t("login.cta_google")}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#EDE3DA]" />
          <span className="text-xs text-[#A89488]">{t("common.or")}</span>
          <div className="flex-1 h-px bg-[#EDE3DA]" />
        </div>

        <div className="flex flex-col gap-3">
          <input
            className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
            placeholder={t("login.email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
            placeholder={t("login.password_placeholder")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && email && password) signIn(); }}
          />
        </div>

        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="text-xs text-[#A89488] self-end -mt-2 hover:text-[#E0175C] transition-colors"
        >
          {t("login.forgot_password_link")}
        </button>

        {errorMsg ? (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            onClick={signIn}
            disabled={loading || !email || !password}
            className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold disabled:opacity-40 transition-opacity"
          >
            {loading ? t("login.cta_login_loading") : t("login.cta_login")}
          </button>

          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="w-full py-4 rounded-full border-2 border-[#EDE3DA] text-[#6B5A52] font-bold transition-opacity"
          >
            {t("login.cta_signup")}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading…</p>
      </main>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
