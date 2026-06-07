"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../lib/i18n/I18nProvider";

interface Props {
  matchLabel: string;
  matchId: number;
  onDismiss: () => void;
}

export default function MatchCelebrationOverlay({ matchLabel, matchId, onDismiss }: Props) {
  const router = useRouter();
  const t = useT();
  // Stays until the user explicitly taps dismiss or the CTA — no auto-dismiss.

  const handleCta = useCallback(() => {
    onDismiss();
    router.push(`/chat/${matchId}`);
  }, [onDismiss, router, matchId]);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: "#FDE8EF" }}
    >
      {/* Decorative circles — brand pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "#E0175C", opacity: 0.07 }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full" style={{ background: "#E0175C", opacity: 0.05 }} />
        <div className="absolute top-1/3 -left-8 w-24 h-24 rounded-full border-2" style={{ borderColor: "#E0175C", opacity: 0.15 }} />
        <div className="absolute bottom-1/3 -right-6 w-16 h-16 rounded-full border-2" style={{ borderColor: "#E0175C", opacity: 0.12 }} />
      </div>

      {/* Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex flex-col items-center text-center gap-5"
      >
        {/* Pulsing heart */}
        <div
          style={{
            fontSize: "64px",
            animation: "unseen-pulse 1.2s ease-in-out infinite",
            lineHeight: 1,
          }}
          aria-hidden
        >
          ❤️
        </div>

        {/* Match label */}
        <p style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: "#E0175C",
          opacity: 0.7,
        }}>
          {matchLabel}
        </p>

        {/* Brand divider */}
        <div style={{ width: "30px", height: "3px", background: "#E0175C", borderRadius: "2px" }} />

        {/* Title */}
        <h1 style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "28px",
          fontWeight: 900,
          color: "#1C1410",
          lineHeight: 1.2,
          letterSpacing: "-0.5px",
        }}>
          {t("swipe.match_celebration_title")}
        </h1>

        {/* Subtext */}
        <p style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "#6B5A52",
          lineHeight: 1.5,
          maxWidth: "280px",
        }}>
          {t("swipe.match_celebration_sub")}
        </p>

        {/* CTA */}
        <button
          onClick={handleCta}
          style={{
            marginTop: "8px",
            background: "#E0175C",
            color: "#fff",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "15px",
            padding: "14px 36px",
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.2px",
          }}
        >
          {t("swipe.match_celebration_cta")}
        </button>

        {/* Dismiss hint */}
        <p style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          color: "#A89488",
          opacity: 0.6,
          marginTop: "4px",
        }}>
          {t("swipe.match_celebration_tap_dismiss")}
        </p>
      </div>

      <style>{`
        @keyframes unseen-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
