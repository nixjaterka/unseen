import type { Locale } from "./index";

// Flat-key dictionaries. Keys are dotted strings for organization, but they're
// just strings — the lookup is direct.
//
// Conventions:
//   - Czech uses informal address ("ty"), consistent with the brand voice.
//   - Where Czech needs gendered forms, masculine is the default (Czech default).
//   - Some "values" (gender, age-relation, language-name) are canonical English
//     keys stored in the DB; we only translate them at display time.

const en = {
  // ---------- common ----------
  "common.loading": "Loading…",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.back": "Back",
  "common.submit": "Submit",
  "common.update": "Update",
  "common.set": "Set",
  "common.last_updated": "Last updated:",
  "common.dash": "—",

  // ---------- cookie consent ----------
  "cookie.text": "We use essential cookies to keep you signed in and the app working. No tracking, no ads.",
  "cookie.accept": "Got it",
  "cookie.privacy_link": "Privacy Policy",

  // ---------- nav ----------
  "nav.home": "Home",
  "nav.matches": "Matches",
  "nav.profile": "Profile",
  "nav.settings": "Settings",

  // ---------- landing ----------
  "landing.tagline_line1": "Match on photos.",
  "landing.tagline_line2": "Talk without seeing who.",
  "landing.tagline_line3": "Meet to find out.",
  "landing.cta_create_account": "Create account",
  "landing.cta_log_in": "Log in",
  "landing.hero_heading": "Swipe on looks. Fall for the person.",
  "landing.hero_sub": "You already know you're attracted. Now find out if you actually like them.",
  "landing.step1_title": "See their photos. Nothing else.",
  "landing.step1_body": "No bio, no job title, no name. Swipe on instinct alone.",
  "landing.step2_title": "A conversation begins. Anonymously.",
  "landing.step2_body": "24 hours after matching, a chat opens. You still don't know who you're talking to.",
  "landing.step3_title": "Agree to meet. Then find out.",
  "landing.step3_body": "When you're both ready, you arrange something. That's when the mystery ends.",
  "landing.philosophy": "Most apps tell you everything before you've felt anything. We think that's backwards.",
  "landing.final_cta_heading": "Ready to try something different?",

  // ---------- login ----------
  "login.heading": "Get to Unseen",
  "login.email_placeholder": "Email",
  "login.password_placeholder": "Password",
  "login.cta_login": "Log in",
  "login.cta_login_loading": "Logging in...",
  "login.cta_signup": "Create account",
  "login.cta_signup_loading": "Creating account...",
  "login.signup_email_confirm":
    "Account created. Check your email to confirm, then come back and log in.",
  "login.forgot_password_link": "Forgot password?",
  "login.error_account_deleted": "This account has been deleted.",

  // ---------- signup ----------
  "signup.heading": "Create your account",
  "signup.first_name_placeholder": "First name",
  "signup.last_name_placeholder": "Last name",
  "signup.dob_label": "Date of birth",
  "signup.error_fields": "Please fill in all fields.",
  "signup.error_underage": "You must be 18 or older to join.",
  "signup.error_password_short": "Password must be at least 6 characters.",
  "signup.cta": "Create account",
  "signup.cta_loading": "Creating account…",
  "signup.email_confirm": "Account created. Check your email to confirm, then come back and log in.",
  "signup.back_to_login": "Already have an account? Log in",

  // ---------- forgot password ----------
  "forgot.heading": "Reset your password",
  "forgot.intro":
    "Enter the email you signed up with. We'll send you a link to set a new password.",
  "forgot.submit": "Send reset link",
  "forgot.sending": "Sending…",
  "forgot.sent":
    "If that email exists, a reset link is on its way. Check your inbox.",
  "forgot.back_to_login": "Back to login",

  // ---------- reset password ----------
  "reset.heading": "Set a new password",
  "reset.password_placeholder": "New password",
  "reset.confirm_placeholder": "Confirm new password",
  "reset.submit": "Update password",
  "reset.updating": "Updating…",
  "reset.error_mismatch": "Passwords don't match.",
  "reset.error_too_short": "Password must be at least 6 characters.",
  "reset.error_expired":
    "This link has expired or is invalid. Request a new one.",
  "reset.checking": "Checking your link…",
  "reset.request_new": "Request a new link",

  // ---------- onboarding intro (the three-principle teaching moment) ----------
  "intro.principle1_title": "Photos only.",
  "intro.principle1_body": "No bios, no prompts, no profile to scroll.",
  "intro.principle2_title": "Chat opens later.",
  "intro.principle2_body": "About a day after you both swipe right.",
  "intro.principle3_title": "No identity reveal.",
  "intro.principle3_body":
    "The way to learn about someone is to talk to them.",
  "intro.cta": "Got it",

  // ---------- onboarding ----------
  "onboarding.heading": "Your profile",
  "onboarding.intro":
    "A few quick details. You can change all of this later.",
  "onboarding.birth_year": "Birth year",
  "onboarding.gender": "Gender",
  "onboarding.city": "City",
  "onboarding.bio_optional": "Short bio (optional)",
  "onboarding.bio_placeholder": "A couple lines. Human, not a CV.",
  "onboarding.languages": "Languages spoken (choose up to 5)",
  "onboarding.selected_count": "Selected: {n}/5",
  "onboarding.three_prompts": "Three prompts",
  "onboarding.no_prompts":
    "I can’t see at least 3 prompts in the database yet. (Go run the SQL seed.)",
  "onboarding.save_continue": "Save & Continue",
  "onboarding.error.birth_year": "Birth year looks off.",
  "onboarding.error.gender": "Pick a gender option.",
  "onboarding.error.city": "City is required.",
  "onboarding.error.languages_min": "Choose at least 1 language.",
  "onboarding.error.languages_max": "Choose up to 5 languages.",
  "onboarding.error.prompts": "Please answer all 3 prompts (a bit more than 2 letters).",

  // ---------- photo uploader ----------
  "photos.loading": "Loading photos…",
  "photos.help": "Up to 6 photos. The first tile is your profile photo.",
  "photos.badge_profile": "Profile",
  "photos.error_not_logged_in": "Not logged in.",
  "photos.rejected":
    "We couldn't use this photo. Please upload a different one.",

  // ---------- profile ----------
  // ---------- personality (sliders) ----------
  "personality.heading": "Personality",
  "personality.intro":
    "Optional. The system uses these to find people on similar wavelengths. Hidden during swipe.",
  "personality.group.social.title": "Social energy",
  "personality.group.emotional.title": "Emotional style",
  "personality.group.lifestyle.title": "Lifestyle & structure",
  "personality.group.communication.title": "Communication & conflict",
  "personality.group.values.title": "Values & connection",

  "personality.slider.0.left": "Introverted",
  "personality.slider.0.right": "Extroverted",
  "personality.slider.1.left": "Small circle",
  "personality.slider.1.right": "Large social network",
  "personality.slider.2.left": "Quiet time",
  "personality.slider.2.right": "Constant activity",
  "personality.slider.3.left": "Observing",
  "personality.slider.3.right": "Expressive",
  "personality.slider.4.left": "Low stimulation",
  "personality.slider.4.right": "High stimulation",

  "personality.slider.5.left": "Reserved",
  "personality.slider.5.right": "Emotionally expressive",
  "personality.slider.6.left": "Logical",
  "personality.slider.6.right": "Emotion-driven",
  "personality.slider.7.left": "Stable",
  "personality.slider.7.right": "Intense emotional swings",
  "personality.slider.8.left": "Slow to open",
  "personality.slider.8.right": "Open quickly",
  "personality.slider.9.left": "Independent",
  "personality.slider.9.right": "Needs closeness",

  "personality.slider.10.left": "Spontaneous",
  "personality.slider.10.right": "Structured",
  "personality.slider.11.left": "Messy",
  "personality.slider.11.right": "Organized",
  "personality.slider.12.left": "Flexible schedule",
  "personality.slider.12.right": "Routine-driven",
  "personality.slider.13.left": "Relaxed",
  "personality.slider.13.right": "Ambitious",
  "personality.slider.14.left": "Work–life balance",
  "personality.slider.14.right": "Career-focused",

  "personality.slider.15.left": "Avoids conflict",
  "personality.slider.15.right": "Confronts directly",
  "personality.slider.16.left": "Indirect",
  "personality.slider.16.right": "Direct",
  "personality.slider.17.left": "Needs space",
  "personality.slider.17.right": "Resolves immediately",
  "personality.slider.18.left": "Light conversation",
  "personality.slider.18.right": "Deep conversation",
  "personality.slider.19.left": "Playful",
  "personality.slider.19.right": "Serious",

  "personality.slider.20.left": "Independent life",
  "personality.slider.20.right": "Shared life",
  "personality.slider.21.left": "Freedom first",
  "personality.slider.21.right": "Stability first",
  "personality.slider.22.left": "Present-focused",
  "personality.slider.22.right": "Future-oriented",
  "personality.slider.23.left": "Private",
  "personality.slider.23.right": "Open life",
  "personality.slider.24.left": "Practical",
  "personality.slider.24.right": "Idealistic",

  "priority.heading": "What matters most",
  "priority.help":
    "Compatibility is scored on this. Pick 1 for now — you'll be able to pick more on Premium.",
  "priority.help_premium":
    "Compatibility is scored on these. Pick up to 3.",
  "priority.locked_premium":
    "More slots unlock with Premium.",

  "profile.heading": "Profile",
  "profile.photos": "Photos",
  "profile.gender_label": "Gender",
  "profile.select_gender": "Select gender",
  "profile.city_label": "City",
  "profile.bio_label": "Bio",
  "profile.bio_placeholder": "Write something small and human.",
  "profile.languages_label": "Languages",
  "profile.languages_help": "Choose up to 5 languages.",
  "profile.save": "Save profile",
  "profile.saved": "Profile saved.",
  "profile.error.birth_year": "Please enter a valid birth year.",
  "profile.error.gender": "Please select your gender.",
  "profile.error.city": "Please enter your city.",
  "profile.account_section": "Account",
  "profile.account_name": "Name",
  "profile.account_email": "Email",
  "profile.account_dob": "Date of birth",

  // ---------- swipe ----------
  "swipe.heading": "Swipe",
  "swipe.filters": "Filters",
  "swipe.looking_for": "Looking for",
  "swipe.age_preference": "Age preference",
  "swipe.like": "Like",
  "swipe.pass": "Pass",
  "swipe.liked_toast": "Liked",
  "swipe.passed_toast": "Passed",
  "swipe.compat": "Compatibility",
  "swipe.compat_unknown": "Compatibility unknown",
  "swipe.empty_title": "Nothing new right now.",
  "swipe.empty_body":
    "Adjust your filters above, or come back soon. Unseen is small on purpose.",
  "swipe.age_unavailable": "Age unavailable",
  "swipe.language_unavailable": "language unavailable",

  // ---------- matches ----------
  "matches.heading": "Conversations",
  "matches.empty_title": "Nothing here yet.",
  "matches.empty_body":
    "New matches appear about a day after you both swipe right — that’s when chat opens.",
  "matches.start_aria": "Start a conversation",
  "matches.language_unavailable": "language unavailable",
  "matches.no_messages": "No messages yet.",
  "matches.you_prefix": "You: ",
  "matches.clear_emoji": "Clear emoji",

  // ---------- chat ----------
  "chat.write_message": "Write a message...",
  "chat.send": "Send",
  "chat.sending": "Sending...",
  "chat.no_messages": "No messages yet.",
  "chat.plan_a_date": "Plan a date",
  "chat.edit_date_plan": "Edit date plan",
  "chat.unmatch": "Unmatch",
  "chat.report": "Report",
  "chat.report_submitted": "Report submitted.",
  "chat.clear_emoji": "Clear emoji",

  "chat.date_plan.heading_create": "Plan a date",
  "chat.date_plan.heading_edit": "Edit date plan",
  "chat.date_plan.date_time": "Date and time",
  "chat.date_plan.place": "Place",
  "chat.date_plan.place_placeholder":
    "Paste exact place, address, or Google Maps link",
  "chat.date_plan.open_maps": "Open in Google Maps",
  "chat.date_plan.notes": "Notes",
  "chat.date_plan.optional_details": "Optional details",
  "chat.date_plan.contact_name": "Emergency contact name",
  "chat.date_plan.contact_phone": "Emergency contact phone",
  "chat.date_plan.contact_email": "Emergency contact email",
  "chat.date_plan.cancel_date": "Cancel date",
  "chat.date_plan.error_date_required": "Please choose date and time.",
  "chat.date_plan.error_place_required": "Please enter a specific place.",
  "chat.date_plan.error_cancel_blocked":
    "Date plan was not cancelled. This is likely blocked by database permissions.",

  "chat.date_card.title": "Planned date",
  "chat.date_card.checkin_after": "check-in after {n} min",
  "chat.date_card.open_maps": "Open in Maps",
  "chat.date_card.edit": "Edit",
  "chat.date_card.cancel_date": "Cancel date",
  "chat.date_card.emergency_contact": "Emergency contact",

  "chat.unmatch.heading": "Unmatch",
  "chat.unmatch.body":
    "This conversation will disappear for both of you, and you will not be able to message here anymore.",

  "chat.report.heading": "Report",
  "chat.report.reason_label": "Reason",
  "chat.report.reason_inappropriate": "Inappropriate messages",
  "chat.report.reason_harassment": "Harassment",
  "chat.report.reason_fake": "Fake profile",
  "chat.report.reason_other": "Other",
  "chat.report.details_label": "Details",
  "chat.report.optional_details": "Optional details",

  // ---------- dashboard ----------
  "dashboard.hello": "Hello, {name}",
  "dashboard.brand": "Unseen",
  "dashboard.stat.active": "Active for you",
  "dashboard.stat.liked": "You’ve been liked",
  "dashboard.stat.unread": "Unread messages",
  "dashboard.stat.open_matches": "Open matches",
  "dashboard.checking_prefs": "Checking your current preferences…",
  "dashboard.checking_interest": "Checking recent interest…",
  "dashboard.recover_button": "Reset session & go to login",

  "dashboard.active.0":
    "Nothing new right now. Adjust filters in Swipe, or check back later.",
  "dashboard.active.few": "A few people match your current filters.",
  "dashboard.active.handful": "A handful of people match right now.",
  "dashboard.active.plenty": "Plenty of people to look through.",

  "dashboard.liked.quiet_new": "Quiet so far. The first few days usually are.",
  "dashboard.liked.quiet_old":
    "Still quiet. Your first photo is the only signal during swipe — try a different one.",
  "dashboard.liked.few": "A few people have liked you recently, including matches.",
  "dashboard.liked.many": "You’ve been getting noticed lately, including matches.",

  // ---------- settings ----------
  "settings.heading": "Settings",
  "settings.language_label": "Language",
  "settings.language_help": "Saved on this device.",
  "settings.appearance_label": "Appearance",
  "settings.appearance_value": "Light · Dark — coming later",
  "settings.account_label": "Account",
  "settings.account_email": "Email",
  "settings.account_member_since": "Member since",
  "settings.help_label": "Help",
  "settings.help_contact": "Contact support",
  "settings.legal_label": "Legal",
  "settings.terms": "Terms & conditions",
  "settings.privacy": "Privacy policy",
  "settings.data_label": "Your data",
  "settings.export": "Export my data",
  "settings.exporting": "Preparing…",
  "settings.logout": "Log out",
  "settings.delete_account": "Delete account",
  "settings.delete_confirm_body":
    "This deletes your account. Your photos and profile are removed immediately. Conversations are kept securely for safety purposes — see the Privacy Policy. You will be signed out and won't be able to log back in with this email.",
  "settings.delete_confirm_button": "Confirm delete",
  "settings.deleting": "Deleting…",
  "settings.error_export": "Could not prepare your data right now.",
  "settings.error_delete": "Could not delete the account right now.",

  // ---------- terms / privacy ----------
  "terms.heading": "Terms & conditions",
  "terms.body": "Terms content goes here.",
  "terms.version": "Version 1.0",
  "terms.applicable":
    "Applicable in the European Union, United Kingdom, and United States of America.",
  "terms.contents": "Contents",
  "terms.effective_date": "Effective date:",
  "terms.locale_notice":
    "These Terms are currently provided in English only.",
  "privacy.heading": "Privacy policy",
  "privacy.body": "Privacy content goes here.",
  "privacy.version": "Version 1.0",
  "privacy.applicable":
    "Applicable in the European Union, United Kingdom, and United States of America.",
  "privacy.contents": "Contents",
  "privacy.effective_date": "Effective date:",
  "privacy.locale_notice":
    "This Privacy Policy is currently provided in English only.",

  // ---------- gender ----------
  "gender.woman": "Woman",
  "gender.man": "Man",
  "gender.nonbinary": "Non-binary",
  "gender.women": "Women",
  "gender.men": "Men",

  // ---------- age relations (canonical English keys → label) ----------
  "age_relation.about your age": "about your age",
  "age_relation.a bit older than you": "a bit older than you",
  "age_relation.older than you": "older than you",
  "age_relation.much older than you": "much older than you",
  "age_relation.a bit younger than you": "a bit younger than you",
  "age_relation.younger than you": "younger than you",
  "age_relation.much younger than you": "much younger than you",

  // ---------- language names (canonical English keys → display) ----------
  "language_name.English": "English",
  "language_name.Czech": "Czech",
  "language_name.Slovak": "Slovak",
  "language_name.German": "German",
  "language_name.French": "French",
  "language_name.Spanish": "Spanish",
  "language_name.Italian": "Italian",
  "language_name.Polish": "Polish",
  "language_name.Dutch": "Dutch",
  "language_name.Portuguese": "Portuguese",
  "language_name.Romanian": "Romanian",
  "language_name.Hungarian": "Hungarian",

  // ---------- cities (canonical English keys → display) ----------
  "city.Prague": "Prague",
  "city.Brno": "Brno",
  "city.Ostrava": "Ostrava",
  "city.Olomouc": "Olomouc",
} as const;

const cs: Record<keyof typeof en, string> = {
  // ---------- common ----------
  "common.loading": "Načítání…",
  "common.save": "Uložit",
  "common.saving": "Ukládám…",
  "common.cancel": "Zrušit",
  "common.close": "Zavřít",
  "common.back": "Zpět",
  "common.submit": "Odeslat",
  "common.update": "Uložit změny",
  "common.set": "Nastavit",
  "common.last_updated": "Naposledy upraveno:",
  "common.dash": "—",

  // ---------- cookie consent ----------
  "cookie.text": "Používáme nezbytné cookies, abys zůstal přihlášen a aplikace fungovala správně. Žádné sledování, žádné reklamy.",
  "cookie.accept": "Rozumím",
  "cookie.privacy_link": "Zásady ochrany soukromí",

  // ---------- nav ----------
  "nav.home": "Domů",
  "nav.matches": "Matche",
  "nav.profile": "Profil",
  "nav.settings": "Nastavení",

  // ---------- landing ----------
  "landing.tagline_line1": "Vyber si podle fotky.",
  "landing.tagline_line2": "Mluv, aniž víš s kým.",
  "landing.tagline_line3": "Sejdi se, ať to zjistíš.",
  "landing.cta_create_account": "Vytvořit účet",
  "landing.cta_log_in": "Přihlásit se",
  "landing.hero_heading": "Vybíráš podle vzhledu. Zamiluješ se do člověka.",
  "landing.hero_sub": "Přitažlivost tam je. Teď zjisti, jestli se ti opravdu líbí.",
  "landing.step1_title": "Vidíš jejich fotky. Nic jiného.",
  "landing.step1_body": "Žádné bio, žádná práce, žádné jméno. Vybíráš jen podle instinktu.",
  "landing.step2_title": "Začíná konverzace. Anonymně.",
  "landing.step2_body": "24 hodin po matchi se otevře chat. Pořád nevíš, s kým mluvíš.",
  "landing.step3_title": "Domluvte se na setkání. Pak se to dozvíš.",
  "landing.step3_body": "Až budete oba připraveni, domluvíte schůzku. Tehdy záhada končí.",
  "landing.philosophy": "Většina appek ti řekne vše, než cokoliv pocítíš. My si myslíme, že je to obráceně.",
  "landing.final_cta_heading": "Připraven/a zkusit něco jiného?",

  // ---------- login ----------
  "login.heading": "Pojď do Unseen",
  "login.email_placeholder": "E-mail",
  "login.password_placeholder": "Heslo",
  "login.cta_login": "Přihlásit se",
  "login.cta_login_loading": "Přihlašuji…",
  "login.cta_signup": "Vytvořit účet",
  "login.cta_signup_loading": "Vytvářím účet…",
  "login.signup_email_confirm":
    "Účet vytvořen. Potvrď ho v e-mailu a vrať se sem k přihlášení.",
  "login.forgot_password_link": "Zapomenuté heslo?",
  "login.error_account_deleted": "Tento účet byl smazán.",

  // ---------- signup ----------
  "signup.heading": "Vytvoř si účet",
  "signup.first_name_placeholder": "Jméno",
  "signup.last_name_placeholder": "Příjmení",
  "signup.dob_label": "Datum narození",
  "signup.error_fields": "Vyplň prosím všechna pole.",
  "signup.error_underage": "Do Unseen mohou vstoupit pouze osoby starší 18 let.",
  "signup.error_password_short": "Heslo musí mít alespoň 6 znaků.",
  "signup.cta": "Vytvořit účet",
  "signup.cta_loading": "Vytvářím účet…",
  "signup.email_confirm": "Účet vytvořen. Potvrď ho v e-mailu a vrať se přihlásit.",
  "signup.back_to_login": "Už máš účet? Přihlas se",

  // ---------- forgot password ----------
  "forgot.heading": "Obnovit heslo",
  "forgot.intro":
    "Zadej e-mail, se kterým ses registroval/a. Pošleme ti odkaz na nastavení nového hesla.",
  "forgot.submit": "Poslat odkaz",
  "forgot.sending": "Odesílám…",
  "forgot.sent":
    "Pokud takový e-mail existuje, odkaz je na cestě. Podívej se do schránky.",
  "forgot.back_to_login": "Zpět na přihlášení",

  // ---------- reset password ----------
  "reset.heading": "Nastav nové heslo",
  "reset.password_placeholder": "Nové heslo",
  "reset.confirm_placeholder": "Potvrď nové heslo",
  "reset.submit": "Uložit heslo",
  "reset.updating": "Ukládám…",
  "reset.error_mismatch": "Hesla se neshodují.",
  "reset.error_too_short": "Heslo musí mít alespoň 6 znaků.",
  "reset.error_expired":
    "Tento odkaz vypršel nebo je neplatný. Vyžádej si nový.",
  "reset.checking": "Kontroluju tvůj odkaz…",
  "reset.request_new": "Vyžádat nový odkaz",

  // ---------- onboarding intro ----------
  "intro.principle1_title": "Jen fotky.",
  "intro.principle1_body": "Žádné bio, žádné otázky, žádný profil k procházení.",
  "intro.principle2_title": "Chat se otevře později.",
  "intro.principle2_body": "Asi den poté, co si oba dáte líbí.",
  "intro.principle3_title": "Žádné odhalení identity.",
  "intro.principle3_body":
    "Jediný způsob, jak někoho poznat, je s ním mluvit.",
  "intro.cta": "Rozumím",

  // ---------- onboarding ----------
  "onboarding.heading": "Tvůj profil",
  "onboarding.intro":
    "Pár rychlých detailů. Všechno můžeš později změnit.",
  "onboarding.birth_year": "Rok narození",
  "onboarding.gender": "Pohlaví",
  "onboarding.city": "Město",
  "onboarding.bio_optional": "Krátké bio (volitelné)",
  "onboarding.bio_placeholder": "Pár řádků. Lidsky, ne jako životopis.",
  "onboarding.languages": "Jazyky, kterými mluvíš (vyber až 5)",
  "onboarding.selected_count": "Vybráno: {n}/5",
  "onboarding.three_prompts": "Tři otázky",
  "onboarding.no_prompts":
    "V databázi zatím nevidím alespoň 3 otázky. (Spusť SQL seed.)",
  "onboarding.save_continue": "Uložit a pokračovat",
  "onboarding.error.birth_year": "Rok narození vypadá divně.",
  "onboarding.error.gender": "Vyber pohlaví.",
  "onboarding.error.city": "Zadej město.",
  "onboarding.error.languages_min": "Vyber alespoň 1 jazyk.",
  "onboarding.error.languages_max": "Vyber maximálně 5 jazyků.",
  "onboarding.error.prompts":
    "Odpověz prosím na všechny 3 otázky (víc než dvě písmena).",

  // ---------- photo uploader ----------
  "photos.loading": "Načítání fotek…",
  "photos.help": "Až 6 fotek. První dlaždice je tvoje profilová.",
  "photos.badge_profile": "Profilová",
  "photos.error_not_logged_in": "Nejsi přihlášen/a.",
  "photos.rejected":
    "Tuto fotku nemůžeme použít. Nahraj prosím jinou.",

  // ---------- profile ----------
  // ---------- personality ----------
  "personality.heading": "Osobnost",
  "personality.intro":
    "Volitelné. Systém to používá k hledání lidí na podobné vlně. Při swipování skryté.",
  "personality.group.social.title": "Sociální energie",
  "personality.group.emotional.title": "Emoční styl",
  "personality.group.lifestyle.title": "Životní styl a struktura",
  "personality.group.communication.title": "Komunikace a konflikty",
  "personality.group.values.title": "Hodnoty a spojení",

  "personality.slider.0.left": "Introvert",
  "personality.slider.0.right": "Extrovert",
  "personality.slider.1.left": "Úzký okruh",
  "personality.slider.1.right": "Velká sociální síť",
  "personality.slider.2.left": "Klid",
  "personality.slider.2.right": "Neustálá aktivita",
  "personality.slider.3.left": "Pozoruje",
  "personality.slider.3.right": "Projevuje se",
  "personality.slider.4.left": "Nízká stimulace",
  "personality.slider.4.right": "Vysoká stimulace",

  "personality.slider.5.left": "Zdrženlivý",
  "personality.slider.5.right": "Emocionálně otevřený",
  "personality.slider.6.left": "Racionální",
  "personality.slider.6.right": "Vede ho emoce",
  "personality.slider.7.left": "Stabilní",
  "personality.slider.7.right": "Intenzivní výkyvy",
  "personality.slider.8.left": "Pomalu se otevírá",
  "personality.slider.8.right": "Otevře se rychle",
  "personality.slider.9.left": "Nezávislý",
  "personality.slider.9.right": "Potřebuje blízkost",

  "personality.slider.10.left": "Spontánní",
  "personality.slider.10.right": "Strukturovaný",
  "personality.slider.11.left": "Nepořádný",
  "personality.slider.11.right": "Organizovaný",
  "personality.slider.12.left": "Flexibilní rozvrh",
  "personality.slider.12.right": "Rutina",
  "personality.slider.13.left": "Pohodový",
  "personality.slider.13.right": "Ambiciózní",
  "personality.slider.14.left": "Rovnováha práce a života",
  "personality.slider.14.right": "Zaměřený na kariéru",

  "personality.slider.15.left": "Vyhýbá se konfliktům",
  "personality.slider.15.right": "Konfrontuje přímo",
  "personality.slider.16.left": "Nepřímý",
  "personality.slider.16.right": "Přímý",
  "personality.slider.17.left": "Potřebuje prostor",
  "personality.slider.17.right": "Řeší okamžitě",
  "personality.slider.18.left": "Lehká konverzace",
  "personality.slider.18.right": "Hluboká konverzace",
  "personality.slider.19.left": "Hravý",
  "personality.slider.19.right": "Vážný",

  "personality.slider.20.left": "Samostatný život",
  "personality.slider.20.right": "Sdílený život",
  "personality.slider.21.left": "Svoboda na prvním místě",
  "personality.slider.21.right": "Stabilita na prvním místě",
  "personality.slider.22.left": "Přítomnost",
  "personality.slider.22.right": "Budoucnost",
  "personality.slider.23.left": "Soukromý",
  "personality.slider.23.right": "Otevřený život",
  "personality.slider.24.left": "Praktický",
  "personality.slider.24.right": "Idealistický",

  "priority.heading": "Co je pro tebe nejdůležitější",
  "priority.help":
    "Podle toho se počítá kompatibilita. Zatím vyber 1 — víc si vybereš v Premium.",
  "priority.help_premium":
    "Podle těchto bodů se počítá kompatibilita. Vyber až 3.",
  "priority.locked_premium":
    "Další sloty se odemknou v Premium.",

  "profile.heading": "Profil",
  "profile.photos": "Fotky",
  "profile.gender_label": "Pohlaví",
  "profile.select_gender": "Vyber pohlaví",
  "profile.city_label": "Město",
  "profile.bio_label": "Bio",
  "profile.bio_placeholder": "Napiš něco krátkého a lidského.",
  "profile.languages_label": "Jazyky",
  "profile.languages_help": "Vyber až 5 jazyků.",
  "profile.save": "Uložit profil",
  "profile.saved": "Profil uložen.",
  "profile.error.birth_year": "Zadej platný rok narození.",
  "profile.error.gender": "Vyber prosím pohlaví.",
  "profile.error.city": "Zadej prosím město.",
  "profile.account_section": "Účet",
  "profile.account_name": "Jméno",
  "profile.account_email": "E-mail",
  "profile.account_dob": "Datum narození",

  // ---------- swipe ----------
  "swipe.heading": "Swipe",
  "swipe.filters": "Filtry",
  "swipe.looking_for": "Hledám",
  "swipe.age_preference": "Preference věku",
  "swipe.like": "Líbí",
  "swipe.pass": "Přeskočit",
  "swipe.liked_toast": "Lajknuto",
  "swipe.passed_toast": "Přeskočeno",
  "swipe.compat": "Kompatibilita",
  "swipe.compat_unknown": "Kompatibilita neznámá",
  "swipe.empty_title": "Zatím nic nového.",
  "swipe.empty_body":
    "Uprav filtry nahoře nebo se podívej později. Unseen je záměrně malé.",
  "swipe.age_unavailable": "Věk neuveden",
  "swipe.language_unavailable": "jazyk neuveden",

  // ---------- matches ----------
  "matches.heading": "Konverzace",
  "matches.empty_title": "Zatím tu nic není.",
  "matches.empty_body":
    "Nové matche se objeví asi den poté, co si oba dáte líbí — tehdy se otevře chat.",
  "matches.start_aria": "Začít konverzaci",
  "matches.language_unavailable": "jazyk neuveden",
  "matches.no_messages": "Zatím žádné zprávy.",
  "matches.you_prefix": "Ty: ",
  "matches.clear_emoji": "Smazat emoji",

  // ---------- chat ----------
  "chat.write_message": "Napiš zprávu…",
  "chat.send": "Odeslat",
  "chat.sending": "Odesílám…",
  "chat.no_messages": "Zatím žádné zprávy.",
  "chat.plan_a_date": "Naplánovat schůzku",
  "chat.edit_date_plan": "Upravit plán schůzky",
  "chat.unmatch": "Zrušit match",
  "chat.report": "Nahlásit",
  "chat.report_submitted": "Hlášení odesláno.",
  "chat.clear_emoji": "Smazat emoji",

  "chat.date_plan.heading_create": "Naplánovat schůzku",
  "chat.date_plan.heading_edit": "Upravit plán schůzky",
  "chat.date_plan.date_time": "Datum a čas",
  "chat.date_plan.place": "Místo",
  "chat.date_plan.place_placeholder":
    "Vlož přesné místo, adresu nebo odkaz z Google Maps",
  "chat.date_plan.open_maps": "Otevřít v Google Maps",
  "chat.date_plan.notes": "Poznámky",
  "chat.date_plan.optional_details": "Volitelné podrobnosti",
  "chat.date_plan.contact_name": "Jméno nouzového kontaktu",
  "chat.date_plan.contact_phone": "Telefon nouzového kontaktu",
  "chat.date_plan.contact_email": "E-mail nouzového kontaktu",
  "chat.date_plan.cancel_date": "Zrušit schůzku",
  "chat.date_plan.error_date_required": "Vyber prosím datum a čas.",
  "chat.date_plan.error_place_required": "Zadej konkrétní místo.",
  "chat.date_plan.error_cancel_blocked":
    "Schůzku se nepodařilo zrušit. Pravděpodobně to blokují oprávnění v databázi.",

  "chat.date_card.title": "Naplánovaná schůzka",
  "chat.date_card.checkin_after": "kontrola po {n} min",
  "chat.date_card.open_maps": "Otevřít v Mapách",
  "chat.date_card.edit": "Upravit",
  "chat.date_card.cancel_date": "Zrušit schůzku",
  "chat.date_card.emergency_contact": "Nouzový kontakt",

  "chat.unmatch.heading": "Zrušit match",
  "chat.unmatch.body":
    "Tahle konverzace zmizí oběma a už si tu nebudete moct psát.",

  "chat.report.heading": "Nahlášení",
  "chat.report.reason_label": "Důvod",
  "chat.report.reason_inappropriate": "Nevhodné zprávy",
  "chat.report.reason_harassment": "Obtěžování",
  "chat.report.reason_fake": "Falešný profil",
  "chat.report.reason_other": "Jiné",
  "chat.report.details_label": "Podrobnosti",
  "chat.report.optional_details": "Volitelné podrobnosti",

  // ---------- dashboard ----------
  "dashboard.hello": "Ahoj, {name}",
  "dashboard.brand": "Unseen",
  "dashboard.stat.active": "Aktivní pro tebe",
  "dashboard.stat.liked": "Tebe lajkli",
  "dashboard.stat.unread": "Nepřečtené zprávy",
  "dashboard.stat.open_matches": "Otevřené matche",
  "dashboard.checking_prefs": "Kontroluju tvé preference…",
  "dashboard.checking_interest": "Kontroluju nedávný zájem…",
  "dashboard.recover_button": "Resetovat sezení a přejít na přihlášení",

  "dashboard.active.0":
    "Zatím nikdo nový. Uprav filtry v sekci Swipe nebo se podívej později.",
  "dashboard.active.few": "Pár lidí odpovídá tvým filtrům.",
  "dashboard.active.handful": "Pár lidí teď sedí filtrům.",
  "dashboard.active.plenty": "Spousta lidí k prozkoumání.",

  "dashboard.liked.quiet_new": "Zatím ticho. První dny obvykle bývají.",
  "dashboard.liked.quiet_old":
    "Pořád ticho. Při výběru se ukazuje jen tvoje první fotka — zkus jinou.",
  "dashboard.liked.few": "Pár lidí tě nedávno lajklo, včetně matchů.",
  "dashboard.liked.many": "V poslední době si tě všímají, včetně matchů.",

  // ---------- settings ----------
  "settings.heading": "Nastavení",
  "settings.language_label": "Jazyk",
  "settings.language_help": "Uloženo v tomto zařízení.",
  "settings.appearance_label": "Vzhled",
  "settings.appearance_value": "Světlý · Tmavý — bude později",
  "settings.account_label": "Účet",
  "settings.account_email": "E-mail",
  "settings.account_member_since": "Členem od",
  "settings.help_label": "Pomoc",
  "settings.help_contact": "Kontaktovat podporu",
  "settings.legal_label": "Právní informace",
  "settings.terms": "Podmínky používání",
  "settings.privacy": "Ochrana soukromí",
  "settings.data_label": "Tvoje data",
  "settings.export": "Exportovat má data",
  "settings.exporting": "Připravuji…",
  "settings.logout": "Odhlásit se",
  "settings.delete_account": "Smazat účet",
    "settings.delete_confirm_body":
    "Tímto se smaže tvůj účet. Tvé fotky a profil se odstraní okamžitě. Konverzace jsou bezpečně uchovávány z bezpečnostních důvodů — viz Ochrana soukromí. Budeš odhlášen/a a s tímto e-mailem se už nebudeš moct přihlásit.",
  "settings.delete_confirm_button": "Potvrdit smazání",
  "settings.deleting": "Mažu…",
  "settings.error_export": "Tvá data teď nejde připravit.",
  "settings.error_delete": "Účet teď nejde smazat.",

  // ---------- terms / privacy ----------
  "terms.heading": "Podmínky používání",
  "terms.body": "Sem přijde text podmínek.",
  "terms.version": "Verze 1.0",
  "terms.applicable":
    "Platí v Evropské unii, Velké Británii a Spojených státech amerických.",
  "terms.contents": "Obsah",
  "terms.effective_date": "Platné od:",
  "terms.locale_notice":
    "Tyto podmínky jsou aktuálně k dispozici pouze v angličtině.",
  "privacy.heading": "Ochrana soukromí",
  "privacy.body": "Sem přijde text o soukromí.",
  "privacy.version": "Verze 1.0",
  "privacy.applicable":
    "Platí v Evropské unii, Velké Británii a Spojených státech amerických.",
  "privacy.contents": "Obsah",
  "privacy.effective_date": "Platné od:",
  "privacy.locale_notice":
    "Tyto Zásady ochrany soukromí jsou aktuálně k dispozici pouze v angličtině.",

  // ---------- gender ----------
  "gender.woman": "Žena",
  "gender.man": "Muž",
  "gender.nonbinary": "Nebinární",
  "gender.women": "Ženy",
  "gender.men": "Muži",

  // ---------- age relations ----------
  "age_relation.about your age": "kolem tvého věku",
  "age_relation.a bit older than you": "trochu starší než ty",
  "age_relation.older than you": "starší než ty",
  "age_relation.much older than you": "mnohem starší než ty",
  "age_relation.a bit younger than you": "trochu mladší než ty",
  "age_relation.younger than you": "mladší než ty",
  "age_relation.much younger than you": "mnohem mladší než ty",

  // ---------- language names ----------
  "language_name.English": "Angličtina",
  "language_name.Czech": "Čeština",
  "language_name.Slovak": "Slovenština",
  "language_name.German": "Němčina",
  "language_name.French": "Francouzština",
  "language_name.Spanish": "Španělština",
  "language_name.Italian": "Italština",
  "language_name.Polish": "Polština",
  "language_name.Dutch": "Nizozemština",
  "language_name.Portuguese": "Portugalština",
  "language_name.Romanian": "Rumunština",
  "language_name.Hungarian": "Maďarština",

  // ---------- cities ----------
  "city.Prague": "Praha",
  "city.Brno": "Brno",
  "city.Ostrava": "Ostrava",
  "city.Olomouc": "Olomouc",
};

export const dictionary: Record<Locale, Record<string, string>> = {
  en,
  cs,
};

export type DictKey = keyof typeof en;

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  // Look up in the requested locale, falling back to English, falling back to
  // the key string itself so missing translations are visible but not breaking.
  const direct = dictionary[locale]?.[key];
  const fallback = dictionary.en[key];
  let raw = direct ?? fallback ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      raw = raw.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return raw;
}
