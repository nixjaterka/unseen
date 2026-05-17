"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
import { useT } from "../../lib/i18n/I18nProvider";

const AGE_OPTIONS = [
  "about your age",
  "a bit older than you",
  "older than you",
  "much older than you",
  "a bit younger than you",
  "younger than you",
  "much younger than you",
];


type Candidate = {
  candidateId: string;
  photoUrls: string[];
  birthYear: number | null;
  gender: string | null;
  languages: string[];
  compatScore: number | null;
};

export default function SwipePage() {
  const router = useRouter();
  const t = useT();

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [msg, setMsg] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);

  // Animation state
  const [animDir, setAnimDir] = useState<"like" | "pass" | null>(null);
  const [cardKey, setCardKey] = useState(0);
  // The next card that fades in behind the current one while it exits
  const [incomingCandidate, setIncomingCandidate] = useState<Candidate | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);

  const [preferredGender, setPreferredGender] = useState<string>("");
  const [preferredAges, setPreferredAges] = useState<string[]>([]);
  const currentYear = new Date().getFullYear();

  // Limit modal: "like_limit" | "match_limit" | null
  const [limitError, setLimitError] = useState<"like_limit" | "match_limit" | null>(null);

  // Fetch the next candidate data without touching any state
  async function fetchNextCandidate(): Promise<Candidate | null> {
    const res = await fetch("/api/swipe/next", { credentials: "include" });
    const json = await res.json();
    if (json?.reason === "not_authenticated") {
      router.replace("/login");
      return null;
    }
    return json?.candidate ?? null;
  }

  // Used on first load and after filters change (no animation)
  async function loadNext() {
    setMsg("");
    const next = await fetchNextCandidate();
    setCandidate(next);
    setPhotoIndex(0);
    setAnimDir(null);
    setIncomingCandidate(null);
    setIncomingVisible(false);
    setCardKey((k) => k + 1);
    setLoading(false);
  }

  async function saveFilters(nextGender: string, nextAges: string[]) {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return;
    await supabase
      .from("profiles")
      .update({
        preferred_gender: nextGender,
        preferred_age_relations: nextAges,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", uid);
  }

  function nextPhoto() {
    if (!candidate || !Array.isArray(candidate.photoUrls)) return;
    setPhotoIndex((prev) =>
      prev < candidate.photoUrls.length - 1 ? prev + 1 : prev
    );
  }

  function prevPhoto() {
    if (!candidate || !Array.isArray(candidate.photoUrls)) return;
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }

  async function act(direction: "like" | "pass") {
    if (!candidate || animDir) return;

    const animStart = Date.now();

    // 1. Kick off exit animation + fire API (don't await it)
    setAnimDir(direction);
    const actionPromise = fetch("/api/swipe/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: candidate.candidateId, direction }),
    });

    // 2. Fetch next card independently — show it the moment it arrives
    const next = await fetchNextCandidate();
    setIncomingCandidate(next);
    requestAnimationFrame(() => setIncomingVisible(true));

    // 3. Wait for exit animation to finish (300ms from click)
    const elapsed = Date.now() - animStart;
    await new Promise((r) => setTimeout(r, Math.max(0, 300 - elapsed)));

    // 4. Swap cards
    setCandidate(next);
    setPhotoIndex(0);
    setAnimDir(null);
    setIncomingCandidate(null);
    setIncomingVisible(false);
    setCardKey((k) => k + 1);

    // 5. Check API response — show limit modal if we hit a free-tier wall
    try {
      const res = await actionPromise;
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error === "like_limit_reached")  setLimitError("like_limit");
        if (body?.error === "match_limit_reached") setLimitError("match_limit");
      }
    } catch {
      // network error — swallow silently
    }
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      const uid = data.session.user.id;
      setViewerId(uid);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("onboarded_at, preferred_gender, preferred_age_relations")
        .eq("user_id", uid)
        .maybeSingle();

      if (!profileData?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }

      if (profileData?.preferred_gender) {
        setPreferredGender(profileData.preferred_gender);
      }

      if (Array.isArray(profileData?.preferred_age_relations)) {
        setPreferredAges(profileData.preferred_age_relations);
      }

      await loadNext();
    }

    init();
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col gap-4 px-5 pt-6 pb-28">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1C1410]">{t("swipe.heading")}</h1>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="px-4 py-2 rounded-full bg-white border border-[#EDE3DA] text-[#6B5A52] text-sm font-semibold"
        >
          {t("swipe.filters")}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-4 space-y-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-2">{t("swipe.looking_for")}</p>
            <div className="flex gap-2">
              {["man", "woman"].map((g) => (
                <button
                  key={g}
                  onClick={async () => {
                    setPreferredGender(g);
                    await saveFilters(g, preferredAges);
                    await loadNext();
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    preferredGender === g
                      ? "bg-[#E0175C] text-white"
                      : "bg-[#FAF3EE] text-[#6B5A52]"
                  }`}
                >
                  {g === "man" ? t("gender.men") : t("gender.women")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-3">{t("swipe.age_preference")}</p>

            {/* "About your age" — centred at top */}
            {(() => {
              const opt = "about your age";
              const active = preferredAges.includes(opt);
              const toggle = async () => {
                const nextAges = active
                  ? preferredAges.filter((a) => a !== opt)
                  : [...preferredAges, opt];
                setPreferredAges(nextAges);
                await saveFilters(preferredGender, nextAges);
                await loadNext();
              };
              return (
                <div className="flex justify-center mb-2">
                  <button
                    onClick={toggle}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold ${
                      active ? "bg-[#E0175C] text-white" : "bg-[#FAF3EE] text-[#6B5A52]"
                    }`}
                  >
                    {t(`age_relation.${opt}`)}
                  </button>
                </div>
              );
            })()}

            {/* Two columns: younger ← | → older */}
            <div className="grid grid-cols-2 gap-2">
              {/* Left: younger */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-[#A89488] uppercase tracking-wider text-center">
                  ← {t("swipe.age_younger")}
                </p>
                {(["a bit younger than you", "younger than you", "much younger than you"] as const).map((opt) => {
                  const active = preferredAges.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={async () => {
                        const nextAges = active
                          ? preferredAges.filter((a) => a !== opt)
                          : [...preferredAges, opt];
                        setPreferredAges(nextAges);
                        await saveFilters(preferredGender, nextAges);
                        await loadNext();
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-sm text-center font-medium ${
                        active ? "bg-[#E0175C] text-white" : "bg-[#FAF3EE] text-[#6B5A52]"
                      }`}
                    >
                      {t(`age_relation.${opt}`)}
                    </button>
                  );
                })}
              </div>

              {/* Right: older */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-[#A89488] uppercase tracking-wider text-center">
                  {t("swipe.age_older")} →
                </p>
                {(["a bit older than you", "older than you", "much older than you"] as const).map((opt) => {
                  const active = preferredAges.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={async () => {
                        const nextAges = active
                          ? preferredAges.filter((a) => a !== opt)
                          : [...preferredAges, opt];
                        setPreferredAges(nextAges);
                        await saveFilters(preferredGender, nextAges);
                        await loadNext();
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-sm text-center font-medium ${
                        active ? "bg-[#E0175C] text-white" : "bg-[#FAF3EE] text-[#6B5A52]"
                      }`}
                    >
                      {t(`age_relation.${opt}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#A89488]">{t("common.loading")}</p>
        </div>
      ) : candidate ? (
        <div className="flex flex-col gap-5">

          {/* Card stack — incoming card fades in behind, current card exits on top */}
          <div className="relative w-full" style={{ aspectRatio: "3/4" }}>

            {/* Incoming card (behind, fades in while current exits) */}
            {incomingCandidate && (
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-md"
                style={{
                  transition: "opacity 0.14s ease",
                  opacity: incomingVisible ? 1 : 0,
                }}
              >
                <img
                  src={incomingCandidate.photoUrls[0]}
                  alt="next candidate"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Current card (on top, exits with tilt + fade) */}
            <div
              key={cardKey}
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-md"
              style={{
                zIndex: 1,
                transition: animDir
                  ? "transform 0.30s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease"
                  : "none",
                transform:
                  animDir === "like"
                    ? "translateX(52%) rotate(12deg)"
                    : animDir === "pass"
                    ? "translateX(-52%) rotate(-12deg)"
                    : "translateX(0) rotate(0deg)",
                opacity: animDir ? 0 : 1,
              }}
            >
              {/* Photo dots */}
              <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5">
                {candidate.photoUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i === photoIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <img
                src={candidate.photoUrls[photoIndex]}
                alt="candidate"
                className="w-full h-full object-cover"
              />

              {/* Tap zones */}
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-0 top-0 h-full w-1/2"
                aria-label="Previous photo"
              />
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-0 top-0 h-full w-1/2"
                aria-label="Next photo"
              />

            </div>
          </div>

          {/* Like / Pass buttons */}
          <div className="flex gap-3">
            <button
              className="flex-1 py-4 rounded-2xl bg-white border border-[#EDE3DA] text-[#6B5A52] font-bold text-base shadow-sm transition-opacity disabled:opacity-40"
              onClick={() => act("pass")}
              disabled={!!animDir}
            >
              {t("swipe.pass")}
            </button>
            <button
              className="flex-1 py-4 rounded-2xl bg-[#E0175C] text-white font-bold text-base shadow-sm transition-opacity disabled:opacity-40"
              onClick={() => act("like")}
              disabled={!!animDir}
            >
              {t("swipe.like")}
            </button>
          </div>

          {msg ? <p className="text-sm text-[#A89488] text-center">{msg}</p> : null}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-20">
          <p className="text-[#6B5A52] font-medium">{t("swipe.empty_title")}</p>
          <p className="text-sm text-[#A89488]">{t("swipe.empty_body")}</p>
        </div>
      )}

      {/* Limit modal */}
      {limitError && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-5"
          style={{ background: "rgba(28,20,16,0.55)" }}
          onClick={() => setLimitError(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold text-[#1C1410] mb-2">
              {limitError === "like_limit"
                ? t("swipe.like_limit_heading")
                : t("swipe.match_limit_heading")}
            </p>
            <p className="text-sm text-[#6B5A52] mb-5">
              {limitError === "like_limit"
                ? t("swipe.like_limit_body")
                : t("swipe.match_limit_body")}
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="w-full py-3.5 rounded-2xl bg-[#E0175C] text-white font-bold text-sm"
                onClick={() => { setLimitError(null); window.location.href = "/settings"; }}
              >
                {t("premium.cta")}
              </button>
              <button
                className="w-full py-3 rounded-2xl text-[#A89488] text-sm"
                onClick={() => setLimitError(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
