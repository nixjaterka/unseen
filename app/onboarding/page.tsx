"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

function clearSupabaseStorage() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-")) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("sb-")) sessionStorage.removeItem(k);
    }
    localStorage.removeItem("unseen.intro_seen");
  } catch { /* private mode */ }
}

function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

import PhotoUploader from "./PhotoUploader";
import CityPicker from "../components/CityPicker";
import { useT, useLocale } from "../../lib/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "../../lib/i18n";

const LANGUAGE_OPTIONS = [
  "Czech", "Slovak", "Ukrainian", "Russian", "Vietnamese",
  "Polish", "German", "Hungarian", "English", "Bulgarian",
  "Romanian", "Croatian", "Serbian", "Mongolian", "French", "Italian",
];

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gender, setGender] = useState<string>("woman");
  const [city, setCity] = useState<string>("");
  const [cityLat, setCityLat] = useState<number | null>(null);
  const [cityLng, setCityLng] = useState<number | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [dob, setDob] = useState<string>("");          // only needed for Google-signup users
  const [needsDob, setNeedsDob] = useState(false);      // true = Google user missing DOB

  const [errorMsg, setErrorMsg] = useState<string>("");

  // Max DOB: must be 18+
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  })();

  useEffect(() => {
    let mounted = true;

    async function init() {
      setErrorMsg("");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { router.replace("/login"); return; }

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("onboarded_at, gender, city, languages")
        .eq("user_id", sessionData.session.user.id)
        .maybeSingle();

      if (profileErr && profileErr.code !== "PGRST116") {
        setErrorMsg(profileErr.message);
        setLoading(false);
        return;
      }

      if (profileData?.onboarded_at) { router.replace("/app"); return; }

      try {
        const seen = localStorage.getItem("unseen.intro_seen");
        if (seen !== "1") { router.replace("/onboarding/intro"); return; }
      } catch { /* private mode — show form */ }

      if (!mounted) return;

      if (profileData) {
        setGender(profileData.gender ?? "woman");
        setCity(profileData.city ?? "Prague");
        setLanguages(profileData.languages ?? []);
      }

      // If the user signed up via Google they have no date_of_birth in metadata
      const meta = sessionData.session.user.user_metadata ?? {};
      if (!meta.date_of_birth) setNeedsDob(true);

      setLoading(false);
    }

    init();
    return () => { mounted = false; };
  }, [router]);

  function validate(): string | null {
    if (!gender) return t("onboarding.error.gender");
    if (!city.trim()) return t("onboarding.error.city");
    if (languages.length === 0) return t("onboarding.error.languages_min");
    if (languages.length > 5) return t("onboarding.error.languages_max");
    if (needsDob) {
      if (!dob) return t("signup.error_fields");
      if (getAge(dob) < 18) return t("signup.error_underage");
    }
    return null;
  }

  async function save() {
    setErrorMsg("");
    const validation = validate();
    if (validation) { setErrorMsg(validation); return; }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    const uid = session?.user?.id;
    if (!uid) { router.replace("/login"); return; }

    const meta = session?.user?.user_metadata ?? {};
    const accountFields: Record<string, unknown> = {};
    if (meta.first_name) accountFields.first_name = meta.first_name;
    if (meta.last_name) accountFields.last_name = meta.last_name;

    // Use DOB from metadata (email signup) or from the form field (Google signup)
    const dobValue = meta.date_of_birth || dob;
    if (dobValue) {
      accountFields.date_of_birth = dobValue;
      accountFields.birth_year = new Date(dobValue).getFullYear();
    }

    const { error: upsertErr } = await supabase.from("profiles").upsert(
      {
        user_id: uid,
        ...accountFields,
        gender,
        city: city.trim(),
        ...(cityLat !== null && { city_lat: cityLat }),
        ...(cityLng !== null && { city_lng: cityLng }),
        languages,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      setSaving(false);
      setErrorMsg(upsertErr.message);
      return;
    }

    setSaving(false);
    router.replace("/app");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">{t("common.loading")}</p>
      </main>
    );
  }

  const dobAge = dob ? getAge(dob) : null;
  const dobValid = dobAge !== null && dobAge >= 18;

  return (
    <main className="min-h-screen px-6 py-8 pb-12">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <img src="/brand/icononly_transparent_nobuffer.png" alt="Unseen" className="h-8 w-auto object-contain" />
          <h1 className="text-xl font-bold">{t("onboarding.heading")}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-1">
              {LOCALES.map((code) => (
                <button key={code} type="button" onClick={() => setLocale(code as Locale)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${locale === code ? "bg-[#E0175C] text-white" : "text-[#A89488] hover:text-[#E0175C]"}`}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button"
              onClick={async () => { await supabase.auth.signOut(); clearSupabaseStorage(); router.replace("/login"); }}
              className="text-xs text-[#A89488] hover:text-[#E0175C] transition-colors">
              {t("settings.logout")}
            </button>
          </div>
        </div>
        <p className="text-sm text-neutral-500 mb-6">{t("onboarding.intro")}</p>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {/* Photos */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-4">{t("profile.photos")}</p>
            <PhotoUploader />
          </div>

          {/* Date of birth — only shown for Google-signup users */}
          {needsDob && (
            <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-neutral-600 mb-2">{t("signup.dob_label")}</p>
              <div className="flex flex-col gap-1">
                <input
                  type="date"
                  className={`border bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] focus:outline-none transition-colors ${
                    dobValid ? "border-green-400" : "border-[#EDE3DA] focus:border-[#E0175C]"
                  }`}
                  value={dob}
                  max={maxDob}
                  onChange={(e) => setDob(e.target.value)}
                  autoComplete="bday"
                />
                {!dob && (
                  <p className="text-xs text-[#A89488] px-1">{t("signup.dob_confirm_hint")}</p>
                )}
                {dobValid && (
                  <p className="text-xs font-semibold text-green-600 px-1 flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-black">✓</span>
                    {t("signup.dob_age_confirmed").replace("{age}", String(dobAge))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Gender */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-2">{t("onboarding.gender")}</p>
            <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
              <select value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full bg-transparent outline-none text-base text-[#1C1410]">
                <option value="woman">{t("gender.woman")}</option>
                <option value="man">{t("gender.man")}</option>
                <option value="nonbinary">{t("gender.nonbinary")}</option>
              </select>
            </div>
          </div>

          {/* City */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-2">{t("onboarding.city")}</p>
            <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
              <CityPicker
                value={city}
                placeholder={t("onboarding.city_placeholder")}
                onChange={(name, lat, lng) => {
                  setCity(name);
                  setCityLat(lat);
                  setCityLng(lng);
                }}
              />
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-3">{t("onboarding.languages")}</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const selected = languages.includes(lang);
                return (
                  <button key={lang} type="button"
                    onClick={() => {
                      if (selected) setLanguages(languages.filter((l) => l !== lang));
                      else if (languages.length < 5) setLanguages([...languages, lang]);
                    }}
                    className={`rounded-xl px-3 py-3 text-left text-sm ${selected ? "bg-[#E0175C] text-white" : "bg-white text-black"}`}>
                    {t(`language_name.${lang}`)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-neutral-600 mt-3">
              {t("onboarding.selected_count", { n: languages.length })}
            </p>
          </div>

          {/* Save */}
          <button onClick={save} disabled={saving}
            className="w-full py-4 rounded-full bg-[#E0175C] text-white font-medium disabled:opacity-50">
            {saving ? t("common.saving") : t("onboarding.save_continue")}
          </button>
        </div>
      </div>
    </main>
  );
}
