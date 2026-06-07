"use client";

import { checkPassword } from "../../lib/password";
import { useT } from "../../lib/i18n/I18nProvider";

interface Props {
  password: string;
}

export default function PasswordStrength({ password }: Props) {
  const t = useT();
  if (!password) return null;

  const checks = checkPassword(password);

  const rules = [
    { key: "length",    label: t("signup.pw_length") },
    { key: "uppercase", label: t("signup.pw_uppercase") },
    { key: "lowercase", label: t("signup.pw_lowercase") },
    { key: "digit",     label: t("signup.pw_digit") },
    { key: "special",   label: t("signup.pw_special") },
  ] as const;

  return (
    <ul className="flex flex-col gap-1.5 px-1">
      {rules.map(({ key, label }) => {
        const ok = checks[key];
        return (
          <li key={key} className="flex items-center gap-2 text-xs">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                ok
                  ? "bg-green-500 text-white"
                  : "bg-neutral-200 text-neutral-400"
              }`}
            >
              {ok ? "✓" : "·"}
            </span>
            <span className={ok ? "text-green-700 font-medium" : "text-neutral-500"}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
