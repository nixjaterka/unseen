/**
 * Czech vocative case for first names.
 *
 * Czech greetings use the vocative: "Ahoj, Lukáši!" not "Ahoj, Lukáš!".
 * This function transforms a nominative name into its vocative form using
 * common Czech name endings. Unknown patterns are returned unchanged —
 * which is always grammatically safe for feminine names ending in a consonant
 * (e.g. Nikol) and acceptable in casual speech for any other edge case.
 *
 * Only call this when locale === "cs". English names are never transformed.
 */
export function toCzechVocative(name: string): string {
  if (!name) return name;
  const l = name.toLowerCase();

  // ── Masculine endings ────────────────────────────────────────
  // -áš → -áši  (Lukáš→Lukáši, Tomáš→Tomáši, Jonáš→Jonáši)
  if (l.endsWith("áš")) return name.slice(0, -1) + "i";

  // -ek → -ku  (Marek→Marku, Radek→Radku, Zdeněk→Zdeňku)
  if (l.endsWith("ek")) return name.slice(0, -2) + "ku";

  // -ík → -íku  (Patrik? No — Patrik ends -ik)
  // -ik → -iku  (Dominik→Dominiku, Patrik→Patriku)
  if (l.endsWith("ik")) return name.slice(0, -2) + "iku";

  // -el → -eli  (Daniel→Danieli, Gabriel→Gabrieli)
  if (l.endsWith("el")) return name + "i";

  // -al → -ale  (Michal→Michale)
  if (l.endsWith("al")) return name + "e";

  // -an → -ane  (Milan→Milane, Roman→Romane, Ivan→Ivane)
  if (l.endsWith("an")) return name + "e";

  // -in → -ine  (Martin→Martine)
  if (l.endsWith("in")) return name + "e";

  // -on → -one  (Šimon→Šimone)
  if (l.endsWith("on")) return name + "e";

  // -ef → -efe  (Josef→Josefe)
  if (l.endsWith("ef")) return name + "e";

  // -ír → -íre  (Vladimír→Vladimíre)
  if (l.endsWith("ír")) return name + "e";

  // -oslav / -slav → -oslave / -slave  (Miroslav→Miroslava? No — Miroslava is genitive)
  // Czech vocative of Miroslav = Miroslav (unchanged, hard to handle reliably)

  // ── Feminine endings ─────────────────────────────────────────
  // -a → -o  (Eva→Evo, Jana→Jano, Petra→Petro, Tereza→Terezo)
  if (l.endsWith("a")) return name.slice(0, -1) + "o";

  // Feminine names ending in consonant (Nikol, Carmen, etc.) — no change.
  // Masculine names not matched above — no change (safe fallback).
  return name;
}
