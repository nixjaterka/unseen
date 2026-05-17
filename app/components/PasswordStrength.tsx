"use client";

import { checkPassword } from "../../lib/password";

interface Props {
  password: string;
}

const rules = [
  { key: "length",    label: "At least 8 characters" },
  { key: "uppercase", label: "One uppercase letter (A–Z)" },
  { key: "lowercase", label: "One lowercase letter (a–z)" },
  { key: "digit",     label: "One number (0–9)" },
  { key: "special",   label: "One special character (!@#$…)" },
] as const;

export default function PasswordStrength({ password }: Props) {
  if (!password) return null;

  const checks = checkPassword(password);

  return (
    <ul className="flex flex-col gap-1 px-1">
      {rules.map(({ key, label }) => {
        const ok = checks[key];
        return (
          <li key={key} className="flex items-center gap-2 text-xs">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                ok
                  ? "bg-green-100 text-green-600"
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {ok ? "✓" : "·"}
            </span>
            <span className={ok ? "text-green-700" : "text-neutral-500"}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
