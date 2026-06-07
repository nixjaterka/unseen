"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../lib/i18n/I18nProvider";

const CONSENT_KEY = "unseen_cookie_consent";

export default function CookieBanner() {
  const t = useT();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        setVisible(true);
      }
    } catch {
      // Private mode or localStorage unavailable — don't show banner
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-4 pb-4">
      <div className="bg-white border border-[#EDE3DA] rounded-2xl px-5 py-4 shadow-lg flex flex-col gap-3">
        <p className="text-sm text-[#6B5A52] leading-relaxed">
          {t("cookie.text")}{" "}
          <button
            onClick={() => router.push("/privacy")}
            className="text-[#E0175C] underline underline-offset-2 font-medium"
          >
            {t("cookie.privacy_link")}
          </button>
        </p>
        <button
          onClick={accept}
          className="w-full py-3 rounded-full bg-[#E0175C] text-white font-bold text-sm"
        >
          {t("cookie.accept")}
        </button>
      </div>
    </div>
  );
}
