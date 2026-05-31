"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
import PhotoUploader from "../onboarding/PhotoUploader";
import CityPicker from "../components/CityPicker";
import { useT } from "../../lib/i18n/I18nProvider";
import {
  ACTIVE_SLIDER_COUNT,
  emptyScores,
  GROUP_ORDER,
  indicesForGroup,
  normalizeScores,
  SLIDER_COUNT,
  type SliderGroup,
} from "../../lib/personality";

const FREE_PRIORITY_LIMIT    = 1;
const PREMIUM_PRIORITY_LIMIT = 3;

const LANGUAGE_OPTIONS = [
  "Czech", "Slovak", "Ukrainian", "Russian", "Vietnamese",
  "Polish", "German", "Hungarian", "English", "Bulgarian",
  "Romanian", "Croatian", "Serbian", "Mongolian", "French", "Italian",
];

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const noApprovedPhoto = searchParams.get("no_approved_photo") === "1";

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isPremium, setIsPremium] = useState(false);

  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [cityLat, setCityLat] = useState<number | null>(null);
  const [cityLng, setCityLng] = useState<number | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [personality, setPersonality] = useState<number[]>(emptyScores());
  const [priorities, setPriorities] = useState<number[]>([]);
  const [birthYear, setBirthYear] = useState<number | null>(null);

  // Notification preferences
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifChatUnlock, setNotifChatUnlock] = useState(true);
  const [notifNewMatch, setNotifNewMatch] = useState(true);

  // Profile preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");

  // Prevents auto-save from firing during initial data load
  const ready = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      // Show the form shell immediately while the profile loads
      setLoading(false);

      // Non-blocking premium check
      void fetch("/api/stripe/status", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setIsPremium(d.isPremium ?? false))
        .catch(() => {});

      // Display name from auth metadata
      const meta = session.user.user_metadata ?? {};
      const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ");
      setDisplayName(name);

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarded_at, gender, city, languages, personality_scores, priority_sliders, date_of_birth, birth_year, notif_messages, notif_chat_unlock, notif_new_match")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        setSaveStatus("error");
        return;
      }

      if (!data?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }

      setGender(data.gender ?? "");
      setCity(data.city ?? "");
      setLanguages(data.languages ?? []);
      setPersonality(normalizeScores(data.personality_scores));

      // Derive birth_year from date_of_birth if available, else use existing birth_year
      if (data.date_of_birth) {
        setBirthYear(new Date(data.date_of_birth).getFullYear());
      } else if (data.birth_year) {
        setBirthYear(data.birth_year);
      } else {
        // Fall back to user metadata (set during signup)
        const dob = session.user.user_metadata?.date_of_birth;
        if (dob) setBirthYear(new Date(dob).getFullYear());
      }

      // Defensive read: priority_sliders is an int[] of indices 0..24.
      // Only accept indices within the active slider range.
      const rawPriorities = Array.isArray(data.priority_sliders)
        ? data.priority_sliders
            .map((v: unknown) => Number(v))
            .filter((v: number) => Number.isInteger(v) && v >= 0 && v < ACTIVE_SLIDER_COUNT)
            .slice(0, PREMIUM_PRIORITY_LIMIT) // load up to max; UI enforces tier limit
        : [];
      setPriorities(rawPriorities);

      // Notification prefs — default true if column not present yet
      setNotifMessages(data.notif_messages ?? true);
      setNotifChatUnlock(data.notif_chat_unlock ?? true);
      setNotifNewMatch(data.notif_new_match ?? true);

      // Mark ready after a tick so the state setters above don't trigger auto-save
      setTimeout(() => { ready.current = true; }, 0);
    }

    loadProfile();
  }, [router]);

  const doSave = useCallback(async (
    currentGender: string,
    currentCity: string,
    currentLanguages: string[],
    currentPersonality: number[],
    currentPriorities: number[],
    currentBirthYear: number | null,
  ) => {
    if (!currentGender || !currentCity.trim()) return; // incomplete — skip silently

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) { router.replace("/login"); return; }

    setSaveStatus("saving");

    const upsertPayload: Record<string, unknown> = {
      user_id: session.user.id,
      gender: currentGender,
      city: currentCity.trim(),
      ...(cityLat !== null && { city_lat: cityLat }),
      ...(cityLng !== null && { city_lng: cityLng }),
      languages: currentLanguages,
      personality_scores: currentPersonality,
      priority_sliders: currentPriorities.length > 0 ? currentPriorities : null,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (currentBirthYear) upsertPayload.birth_year = currentBirthYear;

    const { error } = await supabase.from("profiles").upsert(upsertPayload, { onConflict: "user_id" });

    setSaveStatus(error ? "error" : "saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
  }, [router]);

  // Auto-save: debounce 1.5s after any field change
  useEffect(() => {
    if (!ready.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () => doSave(gender, city, languages, personality, priorities, birthYear),
      1500
    );
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [gender, city, languages, personality, priorities, birthYear, doSave]);

  async function saveNotifPrefs(messages: boolean, chatUnlock: boolean, newMatch: boolean) {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;
    await supabase.from("profiles").update({
      notif_messages: messages,
      notif_chat_unlock: chatUnlock,
      notif_new_match: newMatch,
    }).eq("user_id", uid);
  }

  async function openPreview() {
    const { data: photos } = await supabase
      .from("photos")
      .select("path")
      .eq("moderation_status", "approved")
      .is("deleted_at", null)
      .order("position", { ascending: true });

    const urls: string[] = [];
    for (const p of photos ?? []) {
      const { data: signed } = await supabase.storage
        .from("user_photos")
        .createSignedUrl(p.path, 300);
      if (signed?.signedUrl) urls.push(signed.signedUrl);
    }
    setPreviewUrls(urls);
    setPreviewPhotoIndex(0);
    setShowPreview(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img
            src="/brand/icononly_transparent_nobuffer.png"
            alt="Unseen"
            className="h-8 w-auto object-contain"
          />
          <h1 className="text-xl font-bold">{t("profile.heading")}</h1>
        </div>
        <div className="text-xs font-medium transition-all duration-300">
          {saveStatus === "saving" && <span className="text-[#A89488]">{t("common.saving")}</span>}
          {saveStatus === "saved"  && <span className="text-[#E0175C]">✓ {t("profile.saved")}</span>}
          {saveStatus === "error"  && <span className="text-red-400">{t("settings.error_export")}</span>}
        </div>
      </div>

      <div className="space-y-4">

        {noApprovedPhoto && (
          <div className="rounded-2xl bg-[#FFF3CD] border border-[#FFDFA0] px-5 py-4">
            <p className="text-sm font-medium text-[#5A4500]">{t("profile.no_approved_photo_heading")}</p>
            <p className="text-xs text-[#7A6000] mt-1">{t("profile.no_approved_photo_body")}</p>
          </div>
        )}

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-4">{t("profile.photos")}</p>
          <PhotoUploader />
        </div>

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-2">{t("profile.gender_label")}</p>
          <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-transparent outline-none text-base text-[#1C1410]"
            >
              <option value="">{t("profile.select_gender")}</option>
              <option value="woman">{t("gender.woman")}</option>
              <option value="man">{t("gender.man")}</option>
              <option value="nonbinary">{t("gender.nonbinary")}</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-2">{t("profile.city_label")}</p>
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

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-3">{t("profile.languages_label")}</p>

          <div className="grid grid-cols-2 gap-2">
            {LANGUAGE_OPTIONS.map((lang) => {
              const selected = languages.includes(lang);

              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      setLanguages(languages.filter((l) => l !== lang));
                    } else if (languages.length < 5) {
                      setLanguages([...languages, lang]);
                    }
                  }}
                  className={`rounded-xl px-3 py-3 text-left text-sm ${
                    selected
                      ? "bg-[#E0175C] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {t(`language_name.${lang}`)}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-neutral-600 mt-3">{t("profile.languages_help")}</p>
        </div>

        {/* Personality (optional) */}
        <div className="space-y-3">
          <div className="px-1">
            <p className="text-base font-bold text-[#1C1410]">{t("personality.heading")}</p>
            <p className="text-xs text-[#A89488] mt-0.5">{t("personality.intro")}</p>
          </div>

          {GROUP_ORDER.map((group: SliderGroup) => (
            <div key={group} className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm space-y-5">
              <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider">
                {t(`personality.group.${group}.title`)}
              </p>

              {indicesForGroup(group).map((i) => {
                const isPriority = priorities.includes(i);
                const priorityLimit = isPremium ? PREMIUM_PRIORITY_LIMIT : FREE_PRIORITY_LIMIT;
                const atLimit = priorities.length >= priorityLimit;
                const disabled = !isPriority && atLimit;
                const pct = personality[i];

                return (
                  <div key={i} className="space-y-2">
                    {/* Label row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#6B5A52] flex-1">
                        {t(`personality.slider.${i}.left`)}
                      </span>
                      {/* Priority star */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isPriority) {
                            setPriorities(priorities.filter((p) => p !== i));
                          } else if (!atLimit) {
                            setPriorities([...priorities, i]);
                          }
                        }}
                        disabled={disabled}
                        aria-label={
                          isPriority
                            ? "Remove from priorities"
                            : disabled
                            ? "Priority limit reached"
                            : "Mark as priority"
                        }
                        className={`text-xl leading-none shrink-0 transition-all ${
                          isPriority
                            ? "text-[#FACC15] scale-110 cursor-pointer drop-shadow-sm"
                            : disabled
                            ? "text-[#DDD0C6] cursor-not-allowed"
                            : "text-[#A89488] hover:text-[#FACC15] cursor-pointer"
                        }`}
                      >
                        {isPriority ? "★" : "☆"}
                      </button>
                      <span className="text-xs font-medium text-[#6B5A52] flex-1 text-right">
                        {t(`personality.slider.${i}.right`)}
                      </span>
                    </div>

                    {/* Track */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) => {
                        const next = [...personality];
                        next[i] = Number(e.target.value);
                        setPersonality(next);
                      }}
                      className="personality-slider"
                      style={{ "--pct": `${pct}%` } as React.CSSProperties}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          <p className="text-xs text-[#A89488] px-1 pb-1">{t("priority.help")}</p>
        </div>

        {/* Notification settings */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#1C1410] mb-4">{t("profile.notif_heading")}</p>
          <div className="space-y-3">
            {([
              { key: "messages",    label: t("profile.notif_messages"),    val: notifMessages,    set: setNotifMessages },
              { key: "chat_unlock", label: t("profile.notif_chat_unlock"), val: notifChatUnlock,  set: setNotifChatUnlock },
              { key: "new_match",   label: t("profile.notif_new_match"),   val: notifNewMatch,    set: setNotifNewMatch },
            ] as const).map(({ key, label, val, set }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#1C1410]">{label}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !val;
                    set(next);
                    const msgs = key === "messages"    ? next : notifMessages;
                    const chat = key === "chat_unlock" ? next : notifChatUnlock;
                    const mtch = key === "new_match"   ? next : notifNewMatch;
                    saveNotifPrefs(msgs, chat, mtch);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${val ? "bg-[#E0175C]" : "bg-[#EDE3DA]"}`}
                  aria-pressed={val}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${val ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Profile preview */}
        <button
          type="button"
          onClick={openPreview}
          className="w-full py-4 rounded-2xl border border-[#EDE3DA] bg-white text-sm font-medium text-[#1C1410] shadow-sm active:bg-[#FAF3EE] transition-colors"
        >
          👁 {t("profile.preview_button")}
        </button>

      </div>

      {/* Profile preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-white">{t("profile.preview_heading")}</p>
            <button type="button" onClick={() => setShowPreview(false)} className="text-white text-lg">✕</button>
          </div>

          {previewUrls.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#A89488] text-sm">{t("profile.preview_no_photos")}</p>
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden" style={{ maxHeight: "calc(100vh - 56px)" }}>
              <div className="w-full h-full relative" style={{ aspectRatio: "3/4", maxHeight: "100%", margin: "0 auto" }}>
                <img
                  src={previewUrls[previewPhotoIndex]}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
                {/* Tap zones */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1" onClick={() => setPreviewPhotoIndex(i => Math.max(0, i - 1))} />
                  <div className="flex-1" onClick={() => setPreviewPhotoIndex(i => Math.min(previewUrls.length - 1, i + 1))} />
                </div>
                {/* Dot indicators */}
                {previewUrls.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4">
                    {previewUrls.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === previewPhotoIndex ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                )}
                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-6">
                  {displayName && <p className="text-2xl font-bold text-white">{displayName}</p>}
                  <p className="text-sm text-white/80 mt-0.5">
                    {[city, birthYear ? `${new Date().getFullYear() - birthYear}` : null].filter(Boolean).join(" · ")}
                  </p>
                  {languages.length > 0 && (
                    <p className="text-xs text-white/60 mt-1">{languages.slice(0, 3).join(", ")}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading…</p>
        </main>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}