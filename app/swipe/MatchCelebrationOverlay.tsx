"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../lib/i18n/I18nProvider";

interface Props {
  matchLabel: string;
  onDismiss: () => void;
}

export default function MatchCelebrationOverlay({ matchLabel, onDismiss }: Props) {
  const router = useRouter();
  const t = useT();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  function handleCta() {
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss();
    router.push("/matches");
  }

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #E0175C 0%, #ff8e53 50%, #E0175C 100%)" }}
    >
      {/* CSS-only confetti */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece absolute block rounded-sm"
            style={{
              left: `${(i * 3.7) % 100}%`,
              width: `${6 + (i % 4) * 2}px`,
              height: `${8 + (i % 3) * 3}px`,
              background: ["#fff", "#ffe066", "#ffd6e8", "#b5f0ff", "#d4f7c5"][i % 5],
              opacity: 0.9,
              animationDelay: `${(i * 0.11) % 1.5}s`,
              animationDuration: `${2.2 + (i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating hearts */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {(["❤️", "🧡", "💛", "🩷", "❤️‍🔥"] as const).map((emoji, i) => (
          <span
            key={i}
            className="heart-float absolute text-3xl"
            style={{
              left: `${10 + i * 18}%`,
              bottom: "-10%",
              animationDelay: `${i * 0.28}s`,
              animationDuration: "3.2s",
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 mx-6 flex flex-col items-center gap-5 rounded-3xl px-8 py-10 text-center shadow-2xl"
        style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
      >
        <span
          className="text-7xl select-none"
          style={{ animation: "unseen-heartbeat 0.9s ease-in-out infinite" }}
          aria-hidden
        >
          ❤️
        </span>

        <p className="text-base font-semibold uppercase tracking-widest text-white/70">
          {matchLabel}
        </p>

        <h1 className="text-3xl font-bold leading-tight text-white">
          {t("swipe.match_celebration_title")}
        </h1>

        <p className="max-w-xs text-sm leading-relaxed text-white/80">
          {t("swipe.match_celebration_sub")}
        </p>

        <button
          onClick={handleCta}
          className="mt-1 rounded-full bg-white px-8 py-3 text-base font-bold text-[#E0175C] shadow-lg transition hover:scale-105 active:scale-95"
        >
          {t("swipe.match_celebration_cta")}
        </button>
      </div>

      <style>{`
        @keyframes unseen-heartbeat {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.2); }
        }
        @keyframes unseen-confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes unseen-heart-float {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          80%  { opacity: 0.7; }
          100% { transform: translateY(-110vh) scale(1.4); opacity: 0; }
        }
        .confetti-piece { animation: unseen-confetti-fall linear forwards; }
        .heart-float    { animation: unseen-heart-float ease-in forwards; }
      `}</style>
    </div>
  );
}
