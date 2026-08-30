import { isCzechProperNoun } from "./csProperNouns";

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

// ── Unicode-aware word boundaries ────────────────────────────────────────────
//
// JavaScript's \b is defined over ASCII word characters only, so it does NOT
// see a boundary next to a Czech/Slovak diacritic. That silently broke every
// pattern whose alternative starts or ends in one: "najdeš mě", "sleduj mě",
// "šest", "čtyři", "náměstí", "tvojí" all slipped through the filter while
// their diacritic-free spellings were caught. These lookarounds are the same
// idea as \b but over Unicode letters and digits, and the patterns below are
// built with the `u` flag so they work.
const WS = "(?<![\\p{L}\\p{N}_])"; // start of word
const WE = "(?![\\p{L}\\p{N}_])";  // end of word

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
const CZ_SK_SHARING_RE = new RegExp(
  WS +
    "(najde(š|s|te)?\\s+m[eě]|jsem\\s+na\\s+(instagramu|snapu|tiktoku|facebooku|telegramu|discordu|twitteru)|m[ůuo]j\\s+(ig|insta|instagram|snap(chat)?|tiktok|fb|facebook|telegram|signal|discord|twitter)\\s+(je|:)|moje\\s+(ig|insta|instagram|snap(chat)?|tiktok|fb|facebook|telegram|signal|discord|twitter)\\s+(je|:)|p[ií](š(te)?|šete)\\s+mi\\s+na|sleduj\\s+m[eě]|follow\\s+me\\s+(as|on)|add\\s+me\\s+(as|on)|najdi\\s+m[eě]|ozvi\\s+se\\s+(mi\\s+)?(na|jako)|kontaktuj\\s+m[eě]\\s+(na|jako))" +
    WE,
  "iu"
);

// Street address heuristic: number + street keyword.
const ADDRESS_RE = new RegExp(
  WS +
    "\\d{1,5}\\s+[a-zA-Z]{3,}[\\s,]+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|square|sq|alley|al|ulice|náměstí|třída)" +
    WE,
  "iu"
);

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
const CZ_SK_NUMBER_ALT =
  "(?:nula|jedna|jeden|dva|dvě|dve|tři|tri|čtyři|štyri|pět|päť|šest|šesť|sedm|sedum|sedem|osm|osum|osem|devět|deväť)";
const NUM_TOKEN = "(\\d|" + WS + CZ_SK_NUMBER_ALT + WE + ")";
const MEZERA_TOKEN = WS + "mezera" + WE;

const MEZERA_RE = new RegExp(
  NUM_TOKEN + ".{0,10}" + MEZERA_TOKEN + "|" + MEZERA_TOKEN + ".{0,10}" + NUM_TOKEN,
  "iu"
);

const CZ_SK_NUMBER_WORDS = [
  "nula", "jedna", "jeden", "dva", "dvě", "dve", "tři", "tri",
  "čtyři", "ctyri", "štyri", "styri", "pět", "päť", "pat",
  "šest", "šesť", "sedm", "sedum", "sedem", "osm", "osum", "osem",
  "devět", "deväť", "devet",
];

function countCzSkNumberWords(text: string): number {
  const lower = text.toLowerCase();
  return CZ_SK_NUMBER_WORDS.filter((w) =>
    new RegExp(WS + w + WE, "u").test(lower)
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

const SOCIAL_CONTEXT_KEYWORDS_RE = new RegExp(
  WS +
    "(ig|insta(gram)?|snap(chat)?|tiktok|facebook|fb|telegram|whatsapp|signal|discord|twitter|číslo|telefon|kontakt|handle|username)" +
    WE,
  "iu"
);

// "Asking" tone that turns a platform mention into a contact request. Stems
// (dej-, pošl-) spell out their endings so the closing boundary still holds.
const ASK_TONE_RE = new RegExp(
  WS +
    "(m[aá](š|s)|tvoj(e|í|i)|dej(te)?|pošl(i|ete)?|řekni|give|share|send|what|jaké|jakej|co\\s+je)" +
    WE,
  "iu"
);

// Czech diacritics — if a token has ANY of these it's almost certainly a real Czech word
const CZECH_DIACRITICS_RE = /[áéíóúůýěščřžýďťňÁÉÍÓÚŮÝĚŠČŘŽÝĎŤŇ]/;

// Czech and Slovak are very often typed WITHOUT diacritics in chat, and plenty
// of everyday words survive that as 8+ plain-ASCII letters — "souhlasim",
// "zajimave", "samozrejme". Without this list they read as usernames to the
// length heuristic below, and perfectly ordinary one-word replies get refused.
// Extend it from real logs if false positives show up.
const CZ_SK_COMMON_WORDS = new Set([
  "souhlasim","nesouhlasim","souhlasime","samozrejme","zajimave","zajimavy","zajimava","zajimalo",
  "bezvadne","neprijemne","prijemny","prijemna","prijemne","nadherny","nadherna","nadherne",
  "perfektni","sympaticky","sympaticka","naprosto","naprosta","rozhodne","opravdu","urcite",
  "nejspis","doufam","myslim","nemyslim","rozumim","nerozumim","nechapu","pamatuju","vzpominam",
  "mimochodem","nicmene","protoze","kdyztak","popripade","pripadne","nakonec","celkove","konkretne",
  "uvidime","uslysime","domluvime","domluvit","dohodneme","potrebuju","potrebujes","zvladnu",
  "zvladneme","nemuzeme","muzeme","budeme","planujeme","planuju","predstav","predstavuji",
  "neuveritelne","neuveritelny","pripravena","pripraveny","zaneprazdneny","telefonovat","napiseme",
  "dopoledne","odpoledne","narozeniny","restaurace","prochazka","prochazky","kamaradka","kamarad",
  "pritelkyne","znamost","dovolena","koncert","divadlo","snidane","ctvrtek","pondeli","streda",
  "vecirek","paradni","luxusni","sportuju","studuju","pracuju","cestuju","vypadas","znamena",
  "hezky","dobre","spatne","skvele","uzasne","krasne","spravne","konecne","vlastne","strasne",
  "hrozne","docela","ohromne","fakticky","opatruj","poslouchej","povidej","dekuju","dekuji",
]);

// Given names, surnames and places come from the generated hunspell-derived
// list in ./csProperNouns (49k entries) rather than anything hand-written.

// Strip surrounding punctuation before judging a token. Without this a
// sentence-final word like "existuje." reads as a handle purely because of
// the full stop — a dot only means "username" INSIDE a token.
function cleanToken(word: string): string {
  return word.replace(/^[^\p{L}\p{N}_]+/u, "").replace(/[^\p{L}\p{N}]+$/u, "");
}

// Three or more of the same letter in a row is chat emphasis, never a
// username: "supeeeeer", "hahahaha", "neeeeeee".
const ELONGATED_RE = /(.)\1{2,}/;

/**
 * STRUCTURAL handle shape — unambiguous on its own.
 *
 * An internal dot or underscore, or letters mixed with digits: nobody writes
 * an ordinary Czech word as "nikol.jaterkova", "nix_jaterka" or "veronika92".
 * Strong enough to act on with no context at all.
 */
function hasHandleShape(token: string): boolean {
  const t = cleanToken(token);
  if (t.length < 5 || t.length > 30) return false;
  if (!/^[a-zA-Z0-9._]+$/.test(t)) return false;
  if (CZECH_DIACRITICS_RE.test(t)) return false;
  if (ELONGATED_RE.test(t)) return false;

  const internalMark = /^[a-z0-9]+[._]+[a-z0-9._]*[a-z0-9]$/i.test(t);
  const lettersAndDigits = /[a-z]/i.test(t) && /\d/.test(t);
  return internalMark || lettersAndDigits;
}

/**
 * WEAK signal — a long plain-ASCII word we don't recognise.
 *
 * This is NOT sufficient on its own and must never be used without context.
 * Measured against the app's own Czech strings it flags 26 of 532 ordinary
 * phrases ("Nastavit", "Osobnost", "Konverzace"), plus essentially every
 * typo, loanword and bit of chat noise ("Instagramu", "Souhalsim"), because
 * the dictionary holds base forms only and Czech inflects everything. Use it
 * only where the surrounding context already implies a username.
 */
function isUnknownLongWord(token: string): boolean {
  const t = cleanToken(token);
  if (t.length < 8 || t.length > 30) return false;
  if (!/^[a-zA-Z]+$/.test(t)) return false;
  if (CZECH_DIACRITICS_RE.test(t)) return false;
  if (ELONGATED_RE.test(t)) return false;

  const lower = t.toLowerCase();
  return !CZ_SK_COMMON_WORDS.has(lower) && !isCzechProperNoun(lower);
}

const LOCATIVE_PREPOSITIONS = new Set(["v","ve","do","z","ze","u","k","ke","od","kolem","poblíž","pobliz"]);

/** Indexes of tokens that look like a handle, ignoring ones that read as places. */
function handleTokenIndexes(
  words: string[],
  mode: "structural" | "loose" = "structural"
): number[] {
  const test = mode === "loose"
    ? (w: string) => hasHandleShape(w) || isUnknownLongWord(w)
    : hasHandleShape;

  const out: number[] = [];
  for (let i = 0; i < words.length; i++) {
    if (!test(words[i])) continue;
    const prev = i > 0 ? words[i - 1].toLowerCase().replace(/[^\p{L}]/gu, "") : "";
    if (prev && LOCATIVE_PREPOSITIONS.has(prev)) continue;
    out.push(i);
  }
  return out;
}

// "Reach me at / find me / add me" — the verb half of sharing a handle. On its
// own this is harmless; combined with a handle-like token it is conclusive.
const CONTACT_INTENT_RE = new RegExp(
  WS +
    "(napiš|napis|napište|napiste|piš|pis|pište|piste|posli|pošli|ozvi|ozvete|hledej|hledejte|najdi|najdeš|najdes|najdete|přidej|pridej|přidejte|pridejte|sleduj|sledujte|kontaktuj|kontaktujte|zavolej|zavolejte|dm|add|follow|message|text|write|reach|find|search|username|handle|nick|nickname|profil|ucet|účet)" +
    WE,
  "iu"
);

export function checkContactInfoInContext(
  text: string,
  recentMessages: { sender_id: string; content: string }[],
  currentSenderId: string,
  opts: { strict?: boolean } = {}
): FilterResult {
  // First do the normal check
  const normal = checkContactInfo(text);
  if (normal.blocked) return normal;

  const words = text.trim().split(/\s+/);

  // Bare-handle rule. A message of one or two words that is nothing but a
  // handle-like token is treated as sharing, with no context required:
  // the commonest way to pass a username is simply to type it on its own.
  //
  // This deliberately also catches a long diacritic-free first name sent
  // alone ("Veronika"), which is the accepted cost of the rule — identities
  // stay hidden until the reveal anyway.
  // Structural handles ("nikol.jaterkova", "veronika92") are unambiguous, so
  // they are acted on with no context. A merely unfamiliar long word is not:
  // that signal is only trusted where the context already implies a username.
  const structuralIdx = handleTokenIndexes(words, "structural");
  const looseIdx = handleTokenIndexes(words, "loose");

  // Bare handle: one or two words that are nothing but a structural handle.
  // Digit/punctuation-only tokens don't count either way, so "nixjaterka 92"
  // is caught while "Ahoj Veronika" is two real words and passes.
  const meaningful = words.filter((w) => !/^[\d\W_]+$/.test(w));
  if (
    words.length <= 2 &&
    meaningful.length > 0 &&
    meaningful.every(hasHandleShape)
  ) {
    return { blocked: true, reason: "share" };
  }

  // Sharing verb + candidate. The verb supplies the context, so the weaker
  // unknown-word signal is allowed here — but only for a token CLOSE to the
  // verb. Without the proximity limit, an unrelated long word elsewhere in a
  // long sentence pairs with an incidental "účet" or "profil" and the whole
  // message is refused.
  const intentMatch = text.match(CONTACT_INTENT_RE);
  if (intentMatch) {
    const intentWord = cleanToken(intentMatch[0]).toLowerCase();
    const intentPos = words.findIndex(
      (w) => cleanToken(w).toLowerCase() === intentWord
    );
    const nearIntent =
      intentPos >= 0 &&
      looseIdx.some((i) => i > intentPos && i - intentPos <= 3);
    if (nearIntent || structuralIdx.length > 0) {
      return { blocked: true, reason: "share" };
    }
  }

  // `strict` means this person had a message refused in this conversation in
  // the last few minutes (see hasRecentContactRefusal). Someone mid-retry gets
  // the wider net: any short message containing a candidate token at all.
  if (opts.strict && words.length <= 4 && looseIdx.length > 0) {
    return { blocked: true, reason: "share" };
  }

  // Check if any recent message from the OTHER person constitutes a contact request
  const otherMessages = recentMessages.filter((m) => m.sender_id !== currentSenderId);
  const hasRecentRequest = otherMessages.some((m) => {
    const r = checkContactInfo(m.content.normalize("NFKC"));
    if (r.blocked && r.reason === "request") return true;
    // Also catch softer forms: platform keyword + asking tone
    return SOCIAL_CONTEXT_KEYWORDS_RE.test(m.content) &&
      ASK_TONE_RE.test(m.content);
  });

  if (!hasRecentRequest) return { blocked: false };

  // Contextual handle check: short reply containing a candidate token. The
  // other person having just asked for contact details is the context that
  // makes the weaker signal safe to act on.
  if (words.length <= 4 && looseIdx.length > 0) {
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
