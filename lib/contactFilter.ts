/**
 * Contact info filter — blocks messages that share or request personal
 * contact details before a date has been arranged.
 *
 * Checks for:
 *  • Email addresses
 *  • Phone numbers (local + international, various separators)
 *  • Social handles / usernames (Instagram, Snapchat, TikTok, Facebook, etc.)
 *  • Messaging apps (WhatsApp, Telegram, Signal, etc.)
 *  • Street addresses
 *  • Requests asking for the above
 */

type FilterResult =
  | { blocked: false }
  | { blocked: true; reason: "share" | "request" };

// ── Patterns for information being SHARED ────────────────────────────────────

const EMAIL_RE =
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i;

// Matches phone numbers with 7+ digits, allowing spaces / dashes / dots /
// parentheses / leading + for international prefix.
const PHONE_RE =
  /(?<!\w)(\+?[\d][\d\s\-().]{6,}[\d])(?!\w)/;

// "@username" — at least 3 chars, common social handle characters.
// We require a word boundary before @ to avoid false positives like prices.
const SOCIAL_HANDLE_RE =
  /(?:^|[\s,;:(])@[a-zA-Z0-9._]{3,}/;

// Platform name only flagged when combined with sharing context —
// avoids blocking casual references like "I saw it on Instagram".
// Triggers when platform name is followed (within 40 chars) by a handle,
// path, or possessive ("my", "mine") suggesting the user is sharing their account.
const PLATFORM_NAME_RE =
  /\b(instagram|insta|snapchat|snap|tiktok|facebook|fb|whatsapp|wa|telegram|signal|viber|wechat|kik|skype|discord|twitter|x\.com)\b.{0,40}(@[a-zA-Z0-9._]{2,}|\/[a-zA-Z0-9._]{2,}|\bmy\b|\bmine\b)/i;

// Street address heuristic: number + street keyword.
const ADDRESS_RE =
  /\b\d{1,5}\s+[a-zA-Z]{3,}[\s,]+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|square|sq|alley|al|ulice|náměstí|třída)\b/i;

// ── Patterns for REQUESTING contact info ─────────────────────────────────────

const REQUEST_RE =
  /\b(what(\'s| is) your (number|phone|email|instagram|insta|snap(chat)?|tiktok|facebook|fb|telegram|whatsapp|wa|signal|handle|username|contact|address)|give me your (number|email|phone|instagram|insta|snap|contact|address|handle)|send me your (number|email|instagram|snap|contact|handle)|share your (number|email|phone|contact|instagram|snap)|my (number|phone|email|instagram|insta|snap|whatsapp|telegram) is|find me on (instagram|snap|tiktok|facebook|fb|telegram|discord|twitter)|add me on |dm me on |message me on |text me (at|on)?\s*([\d+]|instagram|whatsapp|telegram)?|call me (at|on)?\s*[\d+]?|reach me (at|on)?)/i;

// ── Czech / Slovak spelled-out number bypass ─────────────────────────────────
//
// Users sometimes write phone numbers using number words + "mezera" (= space/gap)
// as a separator, e.g. "sedum 2 mezera osum 6 šest nula mezera osum 1 devět".
//
// "mezera" appearing in a message is an almost certain signal — it's the Czech/
// Slovak word for "space/gap" and is essentially only used to describe how digits
// are spaced out in a phone number.
//
// As a secondary check we also count Czech/Slovak number words: 4+ in one message
// strongly suggests a number sequence even without "mezera".

// "mezera" only flagged when adjacent to digits or number words —
// normal uses like "mezera ve vztahu" (gap in a relationship) pass through.
const MEZERA_RE = /(\d|\b(?:nula|jedna|jeden|dva|dvě|dve|tři|tri|čtyři|štyri|pět|päť|šest|šesť|sedm|sedum|sedem|osm|osum|osem|devět|deväť)\b).{0,10}\bmezera\b|\bmezera\b.{0,10}(\d|\b(?:nula|jedna|jeden|dva|dvě|dve|tři|tri|čtyři|štyri|pět|päť|šest|šesť|sedm|sedum|sedem|osm|osum|osem|devět|deväť)\b)/i;

const CZ_SK_NUMBER_WORDS = [
  "nula", "jedna", "jeden", "dva", "dvě", "dve", "tři", "tri",
  "čtyři", "ctyri", "štyri", "styri", "pět", "päť", "pat",
  "šest", "šesť", "sedm", "sedum", "sedem", "osm", "osum", "osem",
  "devět", "deväť", "devet",
];

function countCzSkNumberWords(text: string): number {
  const lower = text.toLowerCase();
  return CZ_SK_NUMBER_WORDS.filter((w) =>
    new RegExp(`\\b${w}\\b`).test(lower)
  ).length;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function checkContactInfo(text: string): FilterResult {
  const t = text.trim();
  if (!t) return { blocked: false };

  // Check for sharing first
  if (
    EMAIL_RE.test(t) ||
    PHONE_RE.test(t) ||
    SOCIAL_HANDLE_RE.test(t) ||
    PLATFORM_NAME_RE.test(t) ||
    ADDRESS_RE.test(t) ||
    MEZERA_RE.test(t) ||
    countCzSkNumberWords(t) >= 4
  ) {
    return { blocked: true, reason: "share" };
  }

  // Check for requesting
  if (REQUEST_RE.test(t)) {
    return { blocked: true, reason: "request" };
  }

  return { blocked: false };
}
