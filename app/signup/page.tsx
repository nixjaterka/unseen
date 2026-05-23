"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useT, useLocale } from "../../lib/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "../../lib/i18n";
import { checkPassword } from "../../lib/password";
import PasswordStrength from "../components/PasswordStrength";

function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function SignupPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");

  async function handleSignup() {
    setErrorMsg(null);

    if (!email || !password || !confirmPassword || !firstName || !lastName || !dob) {
      setErrorMsg(t("signup.error_fields"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t("signup.error_password_mismatch"));
      return;
    }

    const strength = checkPassword(password);
    if (!strength.valid) {
      setErrorMsg(t("signup.error_password_weak"));
      return;
    }

    if (getAge(dob) < 18) {
      setErrorMsg(t("signup.error_underage"));
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/intro`,
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    // Supabase hides "email already registered" to prevent enumeration —
    // it returns a fake success but with an empty identities array.
    if (data.user && data.user.identities?.length === 0) {
      setLoading(false);
      setErrorMsg(t("signup.error_email_exists"));
      return;
    }

    // If email confirmation is required, session will be null
    if (!data.session) {
      setLoading(false);
      setSentToEmail(email);
      setEmailSent(true);
      return;
    }

    await supabase.from("profiles").upsert({
      user_id: data.user!.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dob,
    });

    setLoading(false);
    router.replace("/onboarding/intro");
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setErrorMsg(null);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/intro`,
      },
    });
    // Browser will navigate away; no need to reset state.
  }

  // Max date: must be at least 18 years old
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  })();

  const dobAge = dob ? getAge(dob) : null;
  const dobValid = dobAge !== null && dobAge >= 18;

  // ── Email sent confirmation screen ──────────────────────────────────────
  if (emailSent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#FFF0F5] flex items-center justify-center text-4xl">
            ✉️
          </div>
          <h1 className="text-2xl font-bold text-[#1C1410]">
            {t("signup.email_sent_heading")}
          </h1>
          <p className="text-[#6B5A52] leading-relaxed">
            {t("signup.email_sent_body").replace("{email}", sentToEmail)}
          </p>
          <div className="w-full rounded-2xl bg-[#FAF3EE] border border-[#EDE3DA] px-5 py-4">
            <p className="text-sm font-semibold text-[#1C1410] break-all">{sentToEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold"
          >
            {t("signup.email_sent_cta")}
          </button>
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="text-sm text-[#A89488] hover:text-[#E0175C] transition-colors"
          >
            ← {t("signup.back_to_login")}
          </button>
        </div>
      </main>
    );
  }

  // ── Signup form ──────────────────────────────────────────────────────────
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

        <h1 className="text-2xl font-bold text-center text-[#1C1410]">
          {t("signup.heading")}
        </h1>

        {/* Google signup */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
          className="w-full py-3.5 rounded-full border-2 border-[#EDE3DA] text-[#1C1410] font-semibold flex items-center justify-center gap-3 disabled:opacity-40 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {googleLoading ? t("signup.cta_loading") : t("signup.cta_google")}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#EDE3DA]" />
          <span className="text-xs text-[#A89488]">{t("common.or")}</span>
          <div className="flex-1 h-px bg-[#EDE3DA]" />
        </div>

        <div className="flex flex-col gap-3">
          {/* Name row */}
          <div className="flex gap-3">
            <input
              className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
              placeholder={t("signup.first_name_placeholder")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
            <input
              className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
              placeholder={t("signup.last_name_placeholder")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>

          {/* Date of birth */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#A89488] px-1">
              {t("signup.dob_label")}
            </label>
            <input
              type="date"
              className={`border bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] focus:outline-none transition-colors ${
                dobValid
                  ? "border-green-400 focus:border-green-500"
                  : "border-[#EDE3DA] focus:border-[#E0175C]"
              }`}
              value={dob}
              max={maxDob}
              onChange={(e) => setDob(e.target.value)}
              autoComplete="bday"
            />
            {dobValid && (
              <p className="text-xs font-semibold text-green-600 px-1 flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[10px]">✓</span>
                {t("signup.dob_age_confirmed").replace("{age}", String(dobAge))}
              </p>
            )}
          </div>

          {/* Email */}
          <input
            className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
            placeholder={t("login.email_placeholder")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          {/* Password */}
          <input
            className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
            placeholder={t("login.password_placeholder")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {/* Password strength checklist */}
          <PasswordStrength password={password} />

          {/* Confirm password */}
          <input
            className={`border bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none transition-colors ${
              confirmPassword && confirmPassword !== password
                ? "border-red-300 focus:border-red-400"
                : confirmPassword && confirmPassword === password
                ? "border-green-400 focus:border-green-500"
                : "border-[#EDE3DA] focus:border-[#E0175C]"
            }`}
            placeholder={t("signup.confirm_password_placeholder")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {confirmPassword && confirmPassword === password && (
            <p className="text-xs font-semibold text-green-600 px-1 flex items-center gap-1 -mt-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[10px]">✓</span>
              {t("signup.passwords_match")}
            </p>
          )}
          {confirmPassword && confirmPassword !== password && (
            <p className="text-xs font-semibold text-red-500 px-1 -mt-1">
              {t("signup.error_password_mismatch")}
            </p>
          )}
        </div>

        {errorMsg && (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        )}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold disabled:opacity-40 transition-opacity"
        >
          {loading ? t("signup.cta_loading") : t("signup.cta")}
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-sm text-[#A89488] text-center hover:text-[#E0175C] transition-colors"
        >
          {t("signup.back_to_login")}
        </button>

        {/* Language toggle */}
        <div className="flex justify-center gap-1 pt-2">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code as Locale)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                locale === code
                  ? "bg-[#E0175C] text-white"
                  : "text-[#A89488] hover:text-[#E0175C]"
              }`}
            >
              {LOCALE_LABELS[code as Locale]}
            </button>
          ))}
        </div>

      </div>
    </main>
  );
}
