"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSignup() {
    setErrorMsg(null);
    setInfo(null);

    if (!email || !password || !firstName || !lastName || !dob) {
      setErrorMsg(t("signup.error_fields"));
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t("signup.error_password_short"));
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
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    // If email confirmation is required, session will be null
    if (!data.session) {
      setLoading(false);
      setInfo(t("signup.email_confirm"));
      return;
    }

    // Write account fields to profile row
    // (Supabase trigger should create the row; we upsert to be safe)
    await supabase.from("profiles").upsert({
      user_id: data.user!.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dob,
    });

    setLoading(false);
    router.replace("/onboarding/intro");
  }

  // Max date: must be at least 18 years old
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  })();

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

        <h1 className="text-2xl font-bold text-center text-[#1C1410]">
          {t("signup.heading")}
        </h1>

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
              className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] focus:outline-none focus:border-[#E0175C] transition-colors"
              value={dob}
              max={maxDob}
              onChange={(e) => setDob(e.target.value)}
              autoComplete="bday"
            />
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
        </div>

        {errorMsg && (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        )}

        {info && (
          <p className="text-sm text-[#6B5A52] text-center">{info}</p>
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

      </div>
    </main>
  );
}
