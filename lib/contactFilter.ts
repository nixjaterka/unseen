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
// path, or possessive ("my", "mine", "moje", "muj", "můj") suggesting sharing.
const PLATFORM_NAME_RE =
  /\b(instagram|insta|snapchat|snap|tiktok|facebook|fb|whatsapp|wa|telegram|signal|viber|wechat|kik|skype|discord|twitter|x\.com)\b.{0,40}(@[a-zA-Z0-9._]{2,}|\/[a-zA-Z0-9._]{2,}|\bmy\b|\bmine\b|\bmoje\b|\bmůj\b|\bmuj\b|\bje\b\s+[a-zA-Z0-9._]{3,})/i;

// Czech / Slovak social-sharing phrases that don't require an @ sign.
// Covers patterns like:
//   "najdeš mě jako nixjaterka"
//   "jsem na instagramu jako X"
//   "moje ig je reandenibezfiltru"
//   "píš mi na X"
//   "sleduj mě na X" / "follow me as X"
//   "najdi mě" / "find me"
const CZ_SK_SHARING_RE =
  /\b(najde(š|s|te)?\s+m[eě]|jsem\s+na\s+(instagramu|snapu|tiktoku|facebooku|telegramu|discordu|twitteru)|m[ůuo]j\s+(ig|insta|instagram|snap(chat)?|tiktok|fb|facebook|telegram|signal|discord|twitter)\s+(je|:)|moje\s+(ig|insta|instagram|snap(chat)?|tiktok|fb|facebook|telegram|signal|discord|twitter)\s+(je|:)|p[ií](š(te)?|šete)\s+mi\s+na|sleduj\s+m[eě]|follow\s+me\s+(as|on)|add\s+me\s+(as|on)|najdi\s+m[eě]|ozvi\s+se\s+(mi\s+)?(na|jako)|kontaktuj\s+m[eě]\s+(na|jako))\b/i;

// Street address heuristic: number + street keyword.
const ADDRESS_RE =
  /\b\d{1,5}\s+[a-zA-Z]{3,}[\s,]+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|square|sq|alley|al|ulice|náměstí|třída)\b/i;

// ── Patterns for REQUESTING contact info ─────────────────────────────────────

const REQUEST_RE =
  /\b(what(\'s| is) your (number|phone|email|instagram|insta|snap(chat)?|tiktok|facebook|fb|telegram|whatsapp|wa|signal|handle|username|contact|address)|give me your (number|email|phone|instagram|insta|snap|contact|address|handle)|send me your (number|email|instagram|snap|contact|handle)|share your (number|email|phone|contact|instagram|snap)|my (number|phone|email|instagram|insta|snap|whatsapp|telegram) is|find me on (instagram|snap|tiktok|facebook|fb|telegram|discord|twitter)|add me on |dm me on |message me on |text me (at|on)?\s*([\d+]|instagram|whatsapp|telegram)?|call me (at|on)?\s*[\d+]?|reach me (at|on)?|jak(é|e) (m[aá](š|s)|je tvoje) (ig|insta(gram)?|snap(chat)?|číslo|telefonní číslo|facebook|telegram|tiktok|discord)|co\s+(je|máš)\s+(tvoje|tvůj|tvojí)?\s*(ig|insta(gram)?|snap|číslo|číslo))/i;

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

// ── Contextual handle detection ──────────────────────────────────────────────
//
// When a recent message from the OTHER person asked for contact info
// (ig, snap, číslo, etc.), we apply stricter analysis to the reply:
//
// A token is "handle-like" if it:
//   • Is 5+ characters long
//   • Contains only ASCII alphanumeric + dots + underscores (no Czech diacritics)
//   • Is not obviously a common English word (too short, or contains digits/dots)
//
// The message is blocked if it is short (≤ 4 words) and contains such a token —
// because in that context a bare word like "nixjaterka" is almost certainly a username.
//
// "Preceding request" means a recent message from the OTHER sender matched
// REQUEST_RE or contained social platform keywords alongside asking language.

const SOCIAL_CONTEXT_KEYWORDS_RE =
  /\b(ig|insta(gram)?|snap(chat)?|tiktok|facebook|fb|telegram|whatsapp|signal|discord|twitter|číslo|telefon|kontakt|handle|username)\b/i;

// Czech diacritics — if a token has ANY of these it's almost certainly a real Czech word
const CZECH_DIACRITICS_RE = /[áéíóúůýěščřžýďťňÁÉÍÓÚŮÝĚŠČŘŽÝĎŤŇ]/;

function looksLikeHandle(token: string): boolean {
  if (token.length < 5) return false;
  // Only ASCII-safe chars (no diacritics, no punctuation beyond . and _)
  if (!/^[a-zA-Z0-9._]+$/.test(token)) return false;
  if (CZECH_DIACRITICS_RE.test(token)) return false;
  // Must contain a digit, dot, or underscore (common in handles),
  // OR be long enough that it's likely a concatenated username (8+ chars)
  return /[0-9._]/.test(token) || token.length >= 8;
}

export function checkContactInfoInContext(
  text: string,
  recentMessages: { sender_id: string; content: string }[],
  currentSenderId: string
): FilterResult {
  // First do the normal check
  const normal = checkContactInfo(text);
  if (normal.blocked) return normal;

  // Check if any recent message from the OTHER person constitutes a contact request
  const otherMessages = recentMessages.filter((m) => m.sender_id !== currentSenderId);
  const hasRecentRequest = otherMessages.some((m) => {
    const r = checkContactInfo(m.content.normalize("NFKC"));
    if (r.blocked && r.reason === "request") return true;
    // Also catch softer forms: platform keyword + asking tone
    return SOCIAL_CONTEXT_KEYWORDS_RE.test(m.content) &&
      /\b(m[aá](š|s)\b|tvoj(e|í|i)\b|dej|pošl|řekni|give|share|send|what|jaké|jakej|co je)\b/i.test(m.content);
  });

  if (!hasRecentRequest) return { blocked: false };

  // Contextual handle check: short reply containing a handle-like token
  const words = text.trim().split(/\s+/);
  if (words.length <= 4 && words.some(looksLikeHandle)) {
    return { blocked: true, reason: "share" };
  }

  return { blocked: false };
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
    CZ_SK_SHARING_RE.test(t) ||
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
