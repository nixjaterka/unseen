"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

export default function LoginPage() {
  const router = useRouter();
  const t = useT();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    // Refuse access to deleted accounts. The auth user still exists (so the
    // email is locked from re-registration) but the profile is marked
    // deleted and the user shouldn't be able to enter the app.
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

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/brand/fulllogo_transparent_nobuffer.png"
            alt="Unseen"
            className="h-16 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-[#1C1410]">{t("login.heading")}</h1>

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
