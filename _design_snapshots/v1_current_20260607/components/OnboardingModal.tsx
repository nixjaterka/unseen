"use client";

import { useState } from "react";

export type OnboardingStep = {
  emoji: string;
  title: string;
  body: string;
};

type Props = {
  steps: OnboardingStep[];
  onDone: () => void;
  ctaLabel?: string; // label on the final button, default "Let's go!"
};

export default function OnboardingModal({ steps, onDone, ctaLabel }: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-5"
      style={{ background: "rgba(28,20,16,0.6)" }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-xl">

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center pt-5 pb-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? "20px" : "6px",
                background: i === index ? "#E0175C" : "#EDE3DA",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-7 pt-4 pb-6 text-center">
          <div className="text-5xl mb-4">{step.emoji}</div>
          <p className="text-lg font-bold text-[#1C1410] mb-2">{step.title}</p>
          <p className="text-sm text-[#6B5A52] leading-relaxed">{step.body}</p>
        </div>

        {/* Buttons */}
        <div className="px-5 pb-6 flex flex-col gap-2">
          <button
            onClick={() => {
              if (isLast) onDone();
              else setIndex((i) => i + 1);
            }}
            className="w-full py-3.5 rounded-2xl bg-[#E0175C] text-white font-bold text-sm"
          >
            {isLast ? (ctaLabel ?? "Let's go!") : "Next →"}
          </button>
          {!isLast && (
            <button
              onClick={onDone}
              className="w-full py-2 text-[#A89488] text-sm"
            >
              Skip
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
