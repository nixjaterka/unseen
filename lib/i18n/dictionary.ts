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
  "landing.tagline_line1": "Swipe on photos, choose who you like.",
  "landing.tagline_line2": "Talk without seeing who.",
  "landing.tagline_line3": "Meet to find out.",
  "landing.cta_create_account": "Create account",
  "landing.cta_log_in": "Log in",
  "landing.hero_heading": "Swipe on looks.\nFall for the person.",
  "landing.hero_sub": "You already know you're attracted. Now find out if you actually like them.",
  "landing.step1_title": "See their photos. Nothing else.",
  "landing.step1_body": "No bio, no job title, no name. Swipe on instinct alone.",
  "landing.step2_title": "A conversation begins. Anonymously.",
  "landing.step2_body": "24 hours after matching, a chat opens. You don't know who you're talking to. You just know you both liked each other.",
  "landing.step3_title": "Go on a date and find out.",
  "landing.step3_body": "When you're both ready, you arrange something. That's when you find out who you've been talking to.",
  "landing.philosophy": "Most apps will force you to pay attention to who they are based on their looks. We think it should be the other way round.",
  "landing.how_it_works": "How it works",
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
  "login.error_link_expired": "Your link has expired or is invalid. Request a new one.",
  "login.cta_google": "Continue with Google",

  // ---------- signup ----------
  "signup.heading": "Create your account",
  "signup.first_name_placeholder": "First name",
  "signup.last_name_placeholder": "Last name",
  "signup.dob_label": "Date of birth",
  "signup.error_fields": "Please fill in all fields.",
  "signup.error_underage": "You must be 18 or older to join.",
  "signup.error_password_short": "Password must be at least 6 characters.",
  "signup.error_password_weak": "Password doesn't meet the requirements below.",
  "signup.error_email_exists": "An account with this email already exists. Try logging in instead.",
  "signup.cta": "Create account",
  "signup.cta_loading": "Creating account…",
  "signup.cta_google": "Sign up with Google",
  "signup.email_confirm": "Account created. Check your email to confirm, then come back and log in.",
  "signup.email_sent_heading": "Check your inbox",
  "signup.email_sent_body": "We sent a confirmation link to {email}. Click it to activate your account, then come back and log in.",
  "signup.email_sent_cta": "Go to login",
  "signup.confirm_password_placeholder": "Confirm password",
  "signup.passwords_match": "Passwords match",
  "signup.error_password_mismatch": "Passwords don't match.",
  "signup.dob_age_confirmed": "Age verified · {age} years old",
  "signup.dob_confirm_hint": "Tap ✓ to confirm your date",
  "dob_modal.heading": "One quick thing",
  "dob_modal.body": "We need your date of birth to show you age-matched profiles and to let you set age preferences. It takes two seconds.",
  "dob_modal.cta": "Save date of birth",
  "signup.pw_length":    "At least 8 characters",
  "signup.pw_uppercase": "One uppercase letter (A–Z)",
  "signup.pw_lowercase": "One lowercase letter (a–z)",
  "signup.pw_digit":     "One number (0–9)",
  "signup.pw_special":   "One special character (!@#$…)",
  "signup.back_to_login": "Already have an account? Log in",

  // ---------- common additions ----------
  "common.or": "or",

  // ---------- forgot password ----------
  "forgot.heading": "Reset your password",
  "forgot.intro":
    "Enter the email you signed up with. We'll send you a link to set a new password.",
  "forgot.submit": "Send reset link",
  "forgot.sending": "Sending…",
  "forgot.sent":
    "If that email exists, a reset link is on its way. Check your inbox (and spam).",
  "forgot.resend": "Resend link",
  "forgot.resend_wait": "Resend in {{seconds}}s",
  "forgot.back_to_login": "Back to login",

  // ---------- reset password ----------
  "reset.heading": "Set a new password",
  "reset.password_placeholder": "New password",
  "reset.confirm_placeholder": "Confirm new password",
  "reset.submit": "Update password",
  "reset.updating": "Updating…",
  "reset.error_mismatch": "Passwords don't match.",
  "reset.error_too_short": "Password must be at least 6 characters.",
  "reset.error_password_weak": "Password doesn't meet the requirements.",
  "reset.error_expired":
    "This link has expired or is invalid. Request a new one.",
  "reset.checking": "Checking your link…",
  "reset.request_new": "Request a new link",

  // ---------- onboarding intro (the three-principle teaching moment) ----------
  "intro.principle1_title": "Photos only.",
  "intro.principle1_body": "No bios, no prompts, no profile to scroll.",
  "intro.principle2_title": "Chat opens later.",
  "intro.principle2_body": "About a day after you both swipe right. So you don't know who you are talking to.",
  "intro.principle3_title": "No identity reveal.",
  "intro.principle3_body":
    "The way to learn about someone is to talk to them.",
  "intro.cta": "Got it",

  // ---------- onboarding ----------
  "onboarding.heading": "Your profile",
  "onboarding.intro":
    "A few quick details. You can change all of this later.",
  "onboarding.birth_year": "Birth year",
  "onboarding.gender": "I am",
  "onboarding.preferred_gender": "I'm looking for",
  "onboarding.error.preferred_gender": "Choose who you're looking for.",
  "onboarding.city": "City",
  "onboarding.city_placeholder": "Search for your city…",
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
  "photos.crop_heading": "Adjust photo",
  "photos.crop_confirm": "Use",
  "photos.crop_hint": "Drag or pinch to reposition · scroll to zoom",
  "photos.badge_profile": "Profile",
  "photos.badge_pending": "Under review",
  "photos.badge_rejected": "Rejected — tap to replace",
  "photos.remove": "Remove",
  "photos.error_not_logged_in": "Not logged in.",
  "photos.rejected":
    "We couldn't use this photo. Make sure it shows your face clearly, there are no other people, it's not explicit and is a real photo (not a drawing or illustration).",
  "photos.rejected_no_face":
    "No face visible in the cropped area. Zoom out or reposition so your face is clearly in the frame.",
  "photos.pending_review":
    "One or more of your photos is under review. It will appear to others once approved — we review photos daily.",
  "photos.rejected_notification":
    "One of your photos was rejected. Please upload a different one — make sure it clearly shows your face and is a real photograph.",

  "onboarding.photo_required": "You need at least one approved photo to continue. Upload one above — we'll review it shortly.",

  "profile.no_approved_photo_heading": "You need an approved photo to start swiping.",
  "profile.no_approved_photo_body": "Upload a photo below. We review photos daily — once approved, you're all set.",

  // ---------- profile ----------
  // ---------- personality (sliders) ----------
  "personality.heading": "Personality",
  "personality.intro":
    "Optional. The system uses these to find people on similar wavelengths. Hidden during swipe.",
  "personality.group.personality.title": "Personality",
  "personality.group.values.title": "Values",
  "personality.group.character.title": "Character",
  "personality.group.lifestyle.title": "Lifestyle",

  // Group: Personality (indices 0–3)
  "personality.slider.0.left": "Introverted",
  "personality.slider.0.right": "Extroverted",
  "personality.slider.1.left": "Spontaneous",
  "personality.slider.1.right": "Planful",
  "personality.slider.2.left": "Head",
  "personality.slider.2.right": "Heart",
  "personality.slider.3.left": "Calm",
  "personality.slider.3.right": "Passionate",

  // Group: Values (indices 4–7)
  "personality.slider.4.left": "Live for today",
  "personality.slider.4.right": "Build for tomorrow",
  "personality.slider.5.left": "Experiences",
  "personality.slider.5.right": "Stability",
  "personality.slider.6.left": "Relaxed",
  "personality.slider.6.right": "Driven",
  "personality.slider.7.left": "Independent",
  "personality.slider.7.right": "Shared life",

  // Group: Character (indices 8–11)
  "personality.slider.8.left": "Blunt",
  "personality.slider.8.right": "Tactful",
  "personality.slider.9.left": "Forgiving",
  "personality.slider.9.right": "Principled",
  "personality.slider.10.left": "Self-reliant",
  "personality.slider.10.right": "Community-minded",
  "personality.slider.11.left": "Idealistic",
  "personality.slider.11.right": "Pragmatic",

  // Group: Lifestyle (indices 12–15)
  "personality.slider.12.left": "Homebody",
  "personality.slider.12.right": "Outdoorsy",
  "personality.slider.13.left": "Laid-back",
  "personality.slider.13.right": "Sporty",
  "personality.slider.14.left": "Indifferent to animals",
  "personality.slider.14.right": "Animal lover",
  "personality.slider.15.left": "Night owl",
  "personality.slider.15.right": "Early bird",

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
  "profile.notif_heading": "Notifications",
  "profile.notif_messages": "New messages",
  "profile.notif_new_match": "New match",
  "profile.preview_button": "View profile preview",
  "profile.preview_heading": "Your profile",
  "profile.preview_no_photos": "No approved photos yet.",

  // ---------- swipe ----------
  "swipe.heading": "Swipe",
  "swipe.filters": "Filters",
  "swipe.looking_for": "Looking for",
  "swipe.age_preference": "Age preference",
  "swipe.age_younger": "Younger",
  "swipe.age_older": "Older",
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
    "New matches appear about a day after you both swipe right — that's when you can start chatting.",
  "matches.start_aria": "Start a conversation",
  "matches.language_unavailable": "language unavailable",
  "matches.no_messages": "No messages yet.",
  "matches.you_prefix": "You:",
  "matches.clear_emoji": "Clear emoji",
  "matches.archived_section": "Past conversations",
  "matches.archived_delete": "Delete",
  "chat.conversation_ended": "This conversation has ended.",
  "chat.conversation_ended_sub": "You can still read the messages.",

  // ---------- icebreakers ----------
  "icebreaker.q.recharge":          "Where do you go when you need to recharge?",
  "icebreaker.q.last_book":         "What's the last book you couldn't put down?",
  "icebreaker.q.ideal_evening":     "What's your ideal evening at home look like?",
  "icebreaker.q.interesting_person":"Who's the most interesting person you've met recently?",
  "icebreaker.q.best_night_out":    "What's been the best night out you've had this year?",
  "icebreaker.q.spontaneous_thing": "What's the most spontaneous thing you've done lately?",
  "icebreaker.q.packed_and_left":   "Have you ever just packed a bag and gone somewhere on a whim?",
  "icebreaker.q.looking_forward":   "What's something you're really looking forward to?",
  "icebreaker.q.five_years":        "Where do you want to be in five years — honestly?",
  "icebreaker.q.overthought":       "What's something you've completely overthought lately?",
  "icebreaker.q.moved_you":         "What's the last thing that genuinely moved you?",
  "icebreaker.q.crier_films":       "Are you someone who cries at films?",
  "icebreaker.q.peaceful_day":      "What does a genuinely peaceful day look like for you?",
  "icebreaker.q.wind_down":         "How do you wind down after a tough week?",
  "icebreaker.q.talk_for_hours":    "What could you talk about for hours?",
  "icebreaker.q.cause_you_care":    "Is there a cause you actually care about?",
  "icebreaker.q.free_weekend":      "Free weekend, zero plans — what actually happens?",
  "icebreaker.q.working_toward":    "What are you building or working toward right now?",
  "icebreaker.q.best_trip":         "What's the best trip you've ever taken?",
  "icebreaker.q.chasing_next":      "What's the next experience you're chasing?",
  "icebreaker.q.place_like_home":   "Is there a place that always feels like home to you?",
  "icebreaker.q.doing_nothing":     "What's your relationship with doing absolutely nothing?",
  "icebreaker.q.productive_day":    "What does a really productive day look like for you?",
  "icebreaker.q.prefer_alone":      "What's something you strongly prefer doing alone?",
  "icebreaker.q.love_with_people":  "What do you love doing with other people?",
  "icebreaker.q.stay_home_evening": "What's your perfect stay-at-home evening?",
  "icebreaker.q.comfort_food":      "What's your comfort food?",
  "icebreaker.q.favourite_outside": "What's your favourite place to be outside?",
  "icebreaker.q.mountains_sea":     "Mountains, sea, or forest?",
  "icebreaker.q.move_your_body":    "What do you do to move your body?",
  "icebreaker.q.sport_defend":      "Is there a sport you'd defend to the death?",
  "icebreaker.q.have_animals":      "Do you have any animals?",
  "icebreaker.q.dog_cat_chaos":     "Dog person, cat person, or chaotic neutral?",
  "icebreaker.q.one_am":            "What do you do at 1am when you can't sleep?",
  "icebreaker.q.best_late":         "What's the best thing about being up late?",
  "icebreaker.q.morning_looks_like":"You're a morning person — what does your morning actually look like?",
  "icebreaker.q.perfect_first_date":"What's your idea of a perfect first date?",
  "icebreaker.q.surprises_people":  "What's one thing about you that surprises people?",
  "icebreaker.q.into_right_now":    "What are you really into right now?",
  "icebreaker.q.best_this_week":    "What's the best thing that happened to you this week?",
  "icebreaker.q.take_me_somewhere": "If we went somewhere together, where would you take me?",
  "icebreaker.q.unpopular_opinion": "What's a genuinely unpopular opinion you hold?",

  // ---------- chat ----------
  "chat.write_message": "Write a message...",
  "chat.send": "Send",
  "chat.sending": "Sending...",
  "chat.seen": "Seen",
  "chat.no_messages": "No messages yet.",
  "chat.plan_a_date": "Plan a date",
  "chat.edit_date_plan": "Edit date plan",
  "chat.unmatch": "Unmatch",
  "chat.report": "Report",
  "chat.report_submitted": "Report submitted.",
  "chat.clear_emoji": "Clear emoji",
  "chat.reply": "Reply",
  "chat.replying_to": "Replying to",

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
    "This conversation will close for both of you, and you will not be able to message here anymore.",

  "chat.report.heading": "Report",
  "chat.report.reason_label": "Reason",
  "chat.report.reason_inappropriate": "Inappropriate messages",
  "chat.report.reason_harassment": "Harassment",
  "chat.report.reason_fake": "Fake profile",
  "chat.report.reason_other": "Other",
  "chat.report.details_label": "Details",
  "chat.report.optional_details": "Optional details",

  "chat.blocked.share":
    "You can't share personal contact details here — no phone numbers, emails, social handles, or addresses. The idea is to keep things anonymous until you decide to meet.",
  "chat.blocked.request":
    "You can't ask for personal contact details here. Once you're both ready to meet, you'll arrange it through the date plan feature instead.",

  // ---------- dashboard ----------
  "dashboard.hello": "Hello, {name}",
  "dashboard.brand": "Unseen",
  "dashboard.waiting_photo_heading": "Waiting for photo approval",
  "dashboard.waiting_photo_body": "We review photos daily. Once your photo is approved, you'll be able to swipe and see your matches.",
  "dashboard.stat.active": "Active for you",
  "dashboard.stat.liked": "You've been liked",
  "dashboard.stat.unread": "Unread messages",
  "dashboard.stat.open_matches": "Open matches",
  "dashboard.active_conversations": "Active conversations",
  "dashboard.you_prefix": "You:",
  "dashboard.info.active_conversations": "Matches where at least one message has been sent.",
  "dashboard.info.active": "People currently in the app who match your preferences — gender, age range, and shared language.",
  "dashboard.info.liked": "People who already swiped right on you. They liked what they saw — now it's your turn.",
  "dashboard.info.unread": "Matches who sent you a message you haven't read yet.",
  "dashboard.info.open_matches": "Matches where the chat has unlocked and you can talk.",
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
    "Still quiet. Your first photo is the first signal during swipe —maybe try a different one.",
  "dashboard.liked.few": "A few people have liked you recently.",
  "dashboard.liked.many": "You've been getting noticed lately. Matches included in this count.",

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
  "settings.install_label": "Mobile app",
  "settings.install_button": "Download mobile app",
  "settings.install_ios_title": "iPhone (Safari)",
  "settings.install_ios_1": "Open unseenapp.cz in Safari",
  "settings.install_ios_2": "Tap the Share button ↑ at the bottom",
  "settings.install_ios_3": "Tap \"Add to Home Screen\" → Add",
  "settings.install_android_title": "Android (Chrome)",
  "settings.install_android_1": "Open unseenapp.cz in Chrome",
  "settings.install_android_2": "Tap the three-dot menu ⋮ in the top right",
  "settings.install_android_3": "Tap \"Add to Home screen\"",
  "settings.logout": "Log out",
  "settings.delete_account": "Delete account",
  "settings.delete_confirm_body":
    "This deletes your account. Your photos and profile are removed after 6 months and conversations are kept securely, all for safety purposes. You will be signed out and won't be able to log back in with this email.",
  "settings.delete_confirm_button": "Confirm delete",
  "settings.deleting": "Deleting…",
  "settings.error_export": "Could not prepare your data right now.",
  "settings.error_delete": "Could not delete the account right now.",

  // ---------- premium ----------
  "premium.badge": "✦ Premium",
  "premium.upgrade_heading": "Unlock Unseen Premium",
  "premium.upgrade_body":
    "Unlimited likes · 3 priority sliders · Compatibility score · Up to 30 matches",
  "premium.cta": "Start for 199 CZK / month",
  "premium.active_label": "Your plan",
  "premium.active_value": "Premium",
  "premium.active_until": "Active until",
  "premium.manage": "Manage subscription",
  "premium.processing": "Redirecting to checkout…",
  "premium.error": "Could not start checkout right now.",

  // ---------- onboarding modal ----------
  "onboarding.s1.emoji": "👋",
  "onboarding.s1.title": "Welcome to Unseen",
  "onboarding.s1.body": "You see photos — nothing else. No names, no bios. Like or pass. When someone likes you back, it's a match.",

  "onboarding.s2.emoji": "📊",
  "onboarding.s2.title": "Your dashboard",
  "onboarding.s2.body": "The numbers here show how many people fit your preferences and how many have already liked you.",

  "onboarding.s3.emoji": "⏳",
  "onboarding.s3.title": "The 24-hour lock",
  "onboarding.s3.body": "A match appears approx 24 hours abter you both liked each other, so you don't know which of the people you liked the match is with. You know there are visual compatibility. Now figure your personalities actually match.",

  "onboarding.s4.emoji": "⭐",
  "onboarding.s4.title": "Priority slider",
  "onboarding.s4.body": "In your profile, pick the personality trait that matters most to you. Matches that align in that specific trait get a pink ✦. Just for you. Each person's stars are based on their own prefference.",

  "onboarding.s5.emoji": "🙈",
  "onboarding.s5.title": "That's it",
  "onboarding.s5.body": "No algorithms deciding your worth. Just photos, personality, and a little patience. Go see who's out there.",

  "onboarding.cta": "Let's go!",

  // ---------- premium onboarding modal ----------
  "premium_onboarding.s1.emoji": "✦",
  "premium_onboarding.s1.title": "You're on Premium!",
  "premium_onboarding.s1.body": "Unlimited likes, up to 30 active matches, and smarter compatibility signals.",

  "premium_onboarding.s2.emoji": "⭐",
  "premium_onboarding.s2.title": "3 priority sliders",
  "premium_onboarding.s2.body": "Go to your profile and set up to 3 personality priorities. Don't forget that others may have different priorities. You appear sooner to them, if you match their priorities. So fill in all of them, not just the ones important to you.",

  "premium_onboarding.s3.emoji": "★",
  "premium_onboarding.s3.title": "Yellow star",
  "premium_onboarding.s3.body": "When your match sliders aligns with you in 2 or 3 of your priorities, you'll see a yellow ★ instead of a pink ✦ — that's a strong signal worth paying attention to.",

  "premium_onboarding.cta": "Set my priorities →",

  // ---------- swipe match celebration ----------
  "swipe.match_celebration_title": "Your chat is open.",
  "swipe.match_celebration_sub": "You liked each other. You still don't know who they are — say hello and find out.",
  "swipe.match_celebration_cta": "Start chatting",
  "swipe.match_celebration_tap_dismiss": "Tap anywhere to dismiss",

  // ---------- swipe like limit ----------
  "swipe.like_limit_heading": "Like limit reached",
  "swipe.like_limit_body":
    "You've used your 30 free likes. They refresh in 12 hours — or upgrade to Premium for unlimited likes.",
  "swipe.match_limit_heading": "Match limit reached",
  "swipe.match_limit_body":
    "You have 10 active matches. Unmatch someone to keep swiping, or upgrade to Premium (up to 30 active matches).",

  // ---------- terms / privacy ----------
  "terms.heading": "Terms & conditions",
  "terms.body": "Terms content goes here.",
  "terms.version": "Version 1.0",
  "terms.applicable":
    "Primarily applicable in the European Union, governed by Czech law.",
  "terms.contents": "Contents",
  "terms.effective_date": "Effective date:",
  "terms.locale_notice":
    "These Terms are currently provided in English only.",
  "privacy.heading": "Privacy policy",
  "privacy.body": "Privacy content goes here.",
  "privacy.version": "Version 1.0",
  "privacy.applicable":
    "Primarily applicable in the European Union, governed by Czech law.",
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
  "language_name.Czech": "Czech",
  "language_name.Slovak": "Slovak",
  "language_name.Ukrainian": "Ukrainian",
  "language_name.Russian": "Russian",
  "language_name.Vietnamese": "Vietnamese",
  "language_name.Polish": "Polish",
  "language_name.German": "German",
  "language_name.Hungarian": "Hungarian",
  "language_name.English": "English",
  "language_name.Bulgarian": "Bulgarian",
  "language_name.Romanian": "Romanian",
  "language_name.Croatian": "Croatian",
  "language_name.Serbian": "Serbian",
  "language_name.Mongolian": "Mongolian",
  "language_name.French": "French",
  "language_name.Italian": "Italian",

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
  "landing.tagline_line1": "Swajpuj fotky, vybírej kdo se ti líbí.",
  "landing.tagline_line2": "Povídej si, aniž víš s kým.",
  "landing.tagline_line3": "Sejděte se, ať to zjistíš.",
  "landing.cta_create_account": "Vytvořit účet",
  "landing.cta_log_in": "Přihlásit se",
  "landing.hero_heading": "Vyber podle sympatií,\nzamiluj se do osobnosti.",
  "landing.hero_sub": "Víš, že se ti líbí. Teď zjisti, jestli je to opravdu člověk pro tebe.",
  "landing.step1_title": "Uvidíš fotky. Nic jiného.",
  "landing.step1_body": "Žádné bio, žádná práce, žádné jméno. Vybíráš jen podle instinktu a sympatií.",
  "landing.step2_title": "Začíná konverzace. Anonymně.",
  "landing.step2_body": "24 hodin po matchi se otevře chat. Nevíš s kým. Jenom víš, že jste oba dali lajk.",
  "landing.step3_title": "Jděte na rande a zjistěte to.",
  "landing.step3_body": "Až budete oba připraveni, domluvíte schůzku. Tam zjistíte, s kým jste si povídali.",
  "landing.philosophy": "Většina applikací tě nutí věnovat pozornost něčí osobnosti na základě vzhledu. My si myslíme, že to má být přesně naopak.",
  "landing.how_it_works": "Jak to funguje",
  "landing.final_cta_heading": "Jste připraveni zkusit něco jiného?",

  // ---------- login ----------
  "login.heading": "Připoj se do Unseen",
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
  "login.error_link_expired": "Odkaz vypršel nebo je neplatný. Vyžádej si nový.",
  "login.cta_google": "Pokračovat přes Google",

  // ---------- signup ----------
  "signup.heading": "Vytvoř si účet",
  "signup.first_name_placeholder": "Jméno",
  "signup.last_name_placeholder": "Příjmení",
  "signup.dob_label": "Datum narození",
  "signup.error_fields": "Vyplň prosím všechna pole.",
  "signup.error_underage": "Do Unseen mohou vstoupit pouze osoby starší 18 let.",
  "signup.error_password_short": "Heslo musí mít alespoň 6 znaků.",
  "signup.error_password_weak": "Heslo nesplňuje požadavky níže.",
  "signup.error_email_exists": "Účet s tímto e-mailem už existuje. Zkus se přihlásit.",
  "signup.cta": "Vytvořit účet",
  "signup.cta_loading": "Vytvářím účet…",
  "signup.cta_google": "Registrovat přes Google",
  "signup.email_confirm": "Účet vytvořen. Potvrď ho v e-mailu a vrať se přihlásit.",
  "signup.email_sent_heading": "Zkontroluj e-mail",
  "signup.email_sent_body": "Poslali jsme potvrzovací odkaz na {email}. Klikni na něj, aktivuj si účet a vrať se přihlásit.",
  "signup.email_sent_cta": "Přejít na přihlášení",
  "signup.confirm_password_placeholder": "Zopakuj heslo",
  "signup.passwords_match": "Hesla se shodují",
  "signup.error_password_mismatch": "Hesla se neshodují.",
  "signup.dob_age_confirmed": "Věk ověřen · {age} let",
  "signup.dob_confirm_hint": "Klepni na ✓ pro potvrzení data",
  "dob_modal.heading": "Ještě jedna věc",
  "dob_modal.body": "Potřebujeme tvé datum narození, abychom ti mohli zobrazovat věkově odpovídající profily a nastavit věkové preference. Trvá to dvě vteřiny.",
  "dob_modal.cta": "Uložit datum narození",
  "signup.pw_length":    "Alespoň 8 znaků",
  "signup.pw_uppercase": "Jedno velké písmeno (A–Z)",
  "signup.pw_lowercase": "Jedno malé písmeno (a–z)",
  "signup.pw_digit":     "Jedna číslice (0–9)",
  "signup.pw_special":   "Jeden speciální znak (!@#$…)",
  "signup.back_to_login": "Už máš účet? Přihlas se",

  // ---------- common additions ----------
  "common.or": "nebo",

  // ---------- forgot password ----------
  "forgot.heading": "Obnovit heslo",
  "forgot.intro":
    "Zadej e-mail, se kterým ses registroval/a. Pošleme ti odkaz na nastavení nového hesla.",
  "forgot.submit": "Poslat odkaz",
  "forgot.sending": "Odesílám…",
  "forgot.sent":
    "Pokud takový e-mail existuje, odkaz je na cestě. Podívej se do schránky (i do spamu).",
  "forgot.resend": "Poslat znovu",
  "forgot.resend_wait": "Znovu za {{seconds}} s",
  "forgot.back_to_login": "Zpět na přihlášení",

  // ---------- reset password ----------
  "reset.heading": "Nastav nové heslo",
  "reset.password_placeholder": "Nové heslo",
  "reset.confirm_placeholder": "Potvrď nové heslo",
  "reset.submit": "Uložit heslo",
  "reset.updating": "Ukládám…",
  "reset.error_mismatch": "Hesla se neshodují.",
  "reset.error_too_short": "Heslo musí mít alespoň 6 znaků.",
  "reset.error_password_weak": "Heslo nesplňuje požadavky.",
  "reset.error_expired":
    "Tento odkaz vypršel nebo je neplatný. Vyžádej si nový.",
  "reset.checking": "Kontroluju tvůj odkaz…",
  "reset.request_new": "Vyžádat nový odkaz",

  // ---------- onboarding intro ----------
  "intro.principle1_title": "Jenom fotky.",
  "intro.principle1_body": "Žádné bio, žádné otázky, žádný profil k procházení.",
  "intro.principle2_title": "Chat se otevře později.",
  "intro.principle2_body": "Asi den poté, co si oba dáte like. Takže nevíš, s kým mluvíš.",
  "intro.principle3_title": "Žádné odhalení identity.",
  "intro.principle3_body":
    "Jediný způsob, jak někoho poznat, je s ním mluvit.",
  "intro.cta": "Rozumím",

  // ---------- onboarding ----------
  "onboarding.heading": "Tvůj profil",
  "onboarding.intro":
    "Pár rychlých detailů. Všechno můžeš později změnit.",
  "onboarding.birth_year": "Rok narození",
  "onboarding.gender": "Jsem",
  "onboarding.preferred_gender": "Hledám",
  "onboarding.error.preferred_gender": "Vyber, koho hledáš.",
  "onboarding.city": "Město",
  "onboarding.city_placeholder": "Hledej své město…",
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
  "onboarding.error.languages_max": "Vyber až 5 jazyků.",
  "onboarding.error.prompts":
    "Odpověz prosím na všechny 3 otázky (víc než dvě písmena).",

  // ---------- photo uploader ----------
  "photos.loading": "Načítání fotek…",
  "photos.help": "Až 6 fotek. První dlaždice je tvoje profilová.",
  "photos.crop_heading": "Upravit foto",
  "photos.crop_confirm": "Použít",
  "photos.crop_hint": "Táhni nebo přibliž prsty · kolečko myši pro zoom",
  "photos.badge_profile": "Profilová",
  "photos.badge_pending": "Čeká na schválení",
  "photos.badge_rejected": "Zamítnuto — klepnutím nahraď",
  "photos.remove": "Odebrat",
  "photos.error_not_logged_in": "Nejsi přihlášen/a.",
  "photos.rejected":
    "Tuto fotku nemůžeme použít. Ujisti se, že na ní jasně vidíš svůj obličej, není na ní více lidí, není explicitní a že jde o skutečnou fotografii (ne kresbu nebo ilustraci).",
  "photos.rejected_no_face":
    "V oříznuté oblasti není vidět žádný obličej. Oddal se nebo posuň fotku tak, aby byl tvůj obličej jasně ve výřezu.",
  "photos.pending_review":
    "Jedna nebo více fotek čeká na schválení. Ostatním se zobrazí, jakmile projde kontrolou — fotky kontrolujeme každý den.",
  "photos.rejected_notification":
    "Jedna z tvých fotek byla zamítnuta. Nahraj prosím jinou — musí jasně zobrazovat tvůj obličej a jít o skutečnou fotografii.",

  "onboarding.photo_required": "Pro pokračování potřebuješ alespoň jednu schválenou fotku. Nahraj ji výše — zkontrolujeme ji brzy.",

  "profile.no_approved_photo_heading": "Pro přístup ke swipování potřebuješ schválenou fotku.",
  "profile.no_approved_photo_body": "Nahraj fotku níže. Fotky kontrolujeme každý den — jakmile bude schválena, můžeš začít.",

  // ---------- profile ----------
  // ---------- personality ----------
  "personality.heading": "Osobnost",
  "personality.intro":
    "Volitelné. Systém to používá k hledání lidí na podobné vlně. Při swipování skryté.",
  "personality.group.personality.title": "Osobnost",
  "personality.group.values.title": "Hodnoty",
  "personality.group.character.title": "Charakter",
  "personality.group.lifestyle.title": "Životní styl",

  // Group: Osobnost (indices 0–3)
  "personality.slider.0.left": "Introvert",
  "personality.slider.0.right": "Extrovert",
  "personality.slider.1.left": "Spontánní",
  "personality.slider.1.right": "Plánovač",
  "personality.slider.2.left": "Rozum",
  "personality.slider.2.right": "Srdce",
  "personality.slider.3.left": "Klidný",
  "personality.slider.3.right": "Vášnivý",

  // Group: Hodnoty (indices 4–7)
  "personality.slider.4.left": "Žij přítomností",
  "personality.slider.4.right": "Buduj budoucnost",
  "personality.slider.5.left": "Zážitky",
  "personality.slider.5.right": "Stabilita",
  "personality.slider.6.left": "Pohodový",
  "personality.slider.6.right": "Cílevědomý",
  "personality.slider.7.left": "Nezávislý",
  "personality.slider.7.right": "Sdílený život",

  // Group: Charakter (indices 8–11)
  "personality.slider.8.left": "Přímý",
  "personality.slider.8.right": "Taktní",
  "personality.slider.9.left": "Odpouštějící",
  "personality.slider.9.right": "Zásadový",
  "personality.slider.10.left": "Soběstačný",
  "personality.slider.10.right": "Komunitní",
  "personality.slider.11.left": "Idealista",
  "personality.slider.11.right": "Pragmatik",

  // Group: Životní styl (indices 12–15)
  "personality.slider.12.left": "Domácí typ",
  "personality.slider.12.right": "Milovník přírody",
  "personality.slider.13.left": "Relaxovaný",
  "personality.slider.13.right": "Sportovní",
  "personality.slider.14.left": "Lhostejný ke zvířatům",
  "personality.slider.14.right": "Milovník zvířat",
  "personality.slider.15.left": "Noční sova",
  "personality.slider.15.right": "Ranní ptáče",

  "priority.heading": "Co je pro tebe nejdůležitější",
  "priority.help":
    "Podle toho se počítá kompatibilita. Zatím vyber 1 — víc si můžeš vybrat v Premium verzi.",
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
  "profile.notif_heading": "Oznámení",
  "profile.notif_messages": "Nové zprávy",
  "profile.notif_new_match": "Nový match",
  "profile.preview_button": "Náhled profilu",
  "profile.preview_heading": "Tvůj profil",
  "profile.preview_no_photos": "Zatím žádné schválené fotky.",

  // ---------- swipe ----------
  "swipe.heading": "Swipe",
  "swipe.filters": "Filtry",
  "swipe.looking_for": "Hledám",
  "swipe.age_preference": "Preference věku",
  "swipe.age_younger": "Mladší",
  "swipe.age_older": "Starší",
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
    "Nové matche se objeví asi den poté, co se oba lajknete — tehdy si můžete začít povídat.",
  "matches.start_aria": "Začít konverzaci",
  "matches.language_unavailable": "jazyk neuveden",
  "matches.no_messages": "Zatím žádné zprávy.",
  "matches.you_prefix": "Ty:",
  "matches.clear_emoji": "Smazat emoji",
  "matches.archived_section": "Minulé konverzace",
  "matches.archived_delete": "Smazat",
  "chat.conversation_ended": "Tato konverzace skončila.",
  "chat.conversation_ended_sub": "Zprávy si stále můžeš přečíst.",

  // ---------- icebreakers ----------
  "icebreaker.q.recharge":          "Kam zajdeš, když potřebuješ dobít baterky?",
  "icebreaker.q.last_book":         "Jaká je poslední kniha, kterou jsi nemohl/a odložit?",
  "icebreaker.q.ideal_evening":     "Jak vypadá tvůj ideální večer doma?",
  "icebreaker.q.interesting_person":"Kdo je nejzajímavější člověk, kterého jsi nedávno potkal/a?",
  "icebreaker.q.best_night_out":    "Jaká byla tvá nejlepší noc venku letos?",
  "icebreaker.q.spontaneous_thing": "Co nejspontánnějšího jsi nedávno udělal/a?",
  "icebreaker.q.packed_and_left":   "Sbalil/a ses někdy jen tak a odježdel/a bez plánu?",
  "icebreaker.q.looking_forward":   "Na co se teď hodně těšíš?",
  "icebreaker.q.five_years":        "Kde chceš být za pět let — upřímně?",
  "icebreaker.q.overthought":       "Co jsi nedávno úplně přemýšlel/a k smrti?",
  "icebreaker.q.moved_you":         "Co tě naposledy opravdu dojalo?",
  "icebreaker.q.crier_films":       "Brečíš u filmů?",
  "icebreaker.q.peaceful_day":      "Jak vypadá opravdu klidný den pro tebe?",
  "icebreaker.q.wind_down":         "Jak se dostaneš z těžkého týdne?",
  "icebreaker.q.talk_for_hours":    "O čem bys mohl/a mluvit hodiny?",
  "icebreaker.q.cause_you_care":    "Je nějaká věc, o které ti skutečně záleží?",
  "icebreaker.q.free_weekend":      "Volný víkend, žádné plány — co se reálně stane?",
  "icebreaker.q.working_toward":    "Na čem teď pracuješ nebo co buduješ?",
  "icebreaker.q.best_trip":         "Jaký byl nejlepší výlet, který jsi kdy podnikl/a?",
  "icebreaker.q.chasing_next":      "Jaký zážitek teď honíš?",
  "icebreaker.q.place_like_home":   "Existuje místo, které pro tebe vždy bude domovem?",
  "icebreaker.q.doing_nothing":     "Jaký máš vztah s naprostým nicneděláním?",
  "icebreaker.q.productive_day":    "Jak vypadá opravdu produktivní den?",
  "icebreaker.q.prefer_alone":      "Co radši děláš sám/sama?",
  "icebreaker.q.love_with_people":  "Co rád/ráda děláš s ostatními lidmi?",
  "icebreaker.q.stay_home_evening": "Jak vypadá tvůj perfektní večer doma?",
  "icebreaker.q.comfort_food":      "Co je tvoje comfort food?",
  "icebreaker.q.favourite_outside": "Jaké je tvoje oblíbené místo venku?",
  "icebreaker.q.mountains_sea":     "Hory, moře, nebo les?",
  "icebreaker.q.move_your_body":    "Co děláš pro pohyb?",
  "icebreaker.q.sport_defend":      "Je nějaký sport, který bys hájil/a za každou cenu?",
  "icebreaker.q.have_animals":      "Máš nějaká zvířata?",
  "icebreaker.q.dog_cat_chaos":     "Psí typ, kočičí typ, nebo totální chaos?",
  "icebreaker.q.one_am":            "Co děláš ve jednu v noci, když nemůžeš spát?",
  "icebreaker.q.best_late":         "Co je nejlepší na tom být vzhůru pozdě?",
  "icebreaker.q.morning_looks_like":"Jsi ranní ptáče — jak tvoje ráno reálně vypadá?",
  "icebreaker.q.perfect_first_date":"Jak by vypadala tvoje ideální první schůzka?",
  "icebreaker.q.surprises_people":  "Co tě odlišuje — co lidi překvapí, když tě poznají lépe?",
  "icebreaker.q.into_right_now":    "Do čeho jsi teď ponořený/á?",
  "icebreaker.q.best_this_week":    "Co nejlepšího se ti stalo tento týden?",
  "icebreaker.q.take_me_somewhere": "Kdybychom šli někam spolu, kam bys mě vzal/a?",
  "icebreaker.q.unpopular_opinion": "Jaký máš skutečně nepopulární názor?",

  // ---------- chat ----------
  "chat.write_message": "Napiš zprávu…",
  "chat.send": "Odeslat",
  "chat.sending": "Odesílám…",
  "chat.seen": "Přečteno",
  "chat.no_messages": "Zatím žádné zprávy.",
  "chat.plan_a_date": "Naplánovat schůzku",
  "chat.edit_date_plan": "Upravit plán schůzky",
  "chat.unmatch": "Zrušit match",
  "chat.report": "Nahlásit",
  "chat.report_submitted": "Hlášení odesláno.",
  "chat.clear_emoji": "Smazat emoji",
  "chat.reply": "Odpovědět",
  "chat.replying_to": "Odpověď na",

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
    "Tahle konverzace se oběma uzamkne a už si tu nebudete moct psát.",

  "chat.report.heading": "Nahlášení",
  "chat.report.reason_label": "Důvod",
  "chat.report.reason_inappropriate": "Nevhodné zprávy",
  "chat.report.reason_harassment": "Obtěžování",
  "chat.report.reason_fake": "Falešný profil",
  "chat.report.reason_other": "Jiné",
  "chat.report.details_label": "Podrobnosti",
  "chat.report.optional_details": "Volitelné podrobnosti",

  "chat.blocked.share":
    "Tady nemůžeš sdílet osobní kontaktní údaje — žádná telefonní čísla, e-maily, sociální sítě ani adresy. Smyslem je zůstat v anonymitě, dokud se nerozhodnete sejít.",
  "chat.blocked.request":
    "Tady nemůžeš žádat o osobní kontaktní údaje. Až budete oba připraveni se sejít, domluvíte se přes funkci plánování schůzky.",

  // ---------- dashboard ----------
  "dashboard.hello": "Ahoj, {name}",
  "dashboard.brand": "Unseen",
  "dashboard.waiting_photo_heading": "Čekáme na schválení fotky",
  "dashboard.waiting_photo_body": "Fotky kontrolujeme každý den. Jakmile bude tvoje fotka schválena, můžeš začít swajpovat a uvidíš svoje shody.",
  "dashboard.stat.active": "Aktivní pro tebe",
  "dashboard.stat.liked": "Lajkli tě",
  "dashboard.stat.unread": "Nepřečtené zprávy",
  "dashboard.stat.open_matches": "Otevřené matche",
  "dashboard.active_conversations": "Aktivní konverzace",
  "dashboard.you_prefix": "Ty:",
  "dashboard.info.active_conversations": "Matche, kde už někdo napsal zprávu.",
  "dashboard.info.active": "Lidé, kteří jsou teď aktivní v aplikaci a odpovídají tvým preferencím — pohlaví, věk a společný jazyk.",
  "dashboard.info.liked": "Lidé, kteří tě už olajkovali. Líbíš se jim — teď záleží na tobě.",
  "dashboard.info.unread": "Matche, kteří ti napsali zprávu, kterou jsi ještě nečetl/a.",
  "dashboard.info.open_matches": "Matche, kde se odemkl chat a můžete si psát.",
  "dashboard.checking_prefs": "Kontroluju tvé preference…",
  "dashboard.checking_interest": "Kontroluju nedávný zájem…",
  "dashboard.recover_button": "Resetovat sezení a přejít na přihlášení",

  "dashboard.active.0":
    "Zatím nikdo nový. Uprav filtry v sekci Swipe nebo se podívej později.",
  "dashboard.active.few": "Pár lidí odpovídá tvým filtrům.",
  "dashboard.active.handful": "Pár lidí teď sedí filtrům.",
  "dashboard.active.plenty": "Spousta lidí k prozkoumání.",

  "dashboard.liked.quiet_new": "Zatím ticho. První dny takové obvykle bývají.",
  "dashboard.liked.quiet_old":
    "Pořád ticho. Při výběru se ukazuje jako první tvoje profilová fotka — možná zkus jinou.",
  "dashboard.liked.few": "Pár lidí tě nedávno lajklo. Číslo zahrnuje i matche.",
  "dashboard.liked.many": "V poslední době si tě všímají. Číslo zahrnuje i matche.",

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
  "settings.install_label": "Mobilní aplikace",
  "settings.install_button": "Stáhnout mobilní aplikaci",
  "settings.install_ios_title": "iPhone (Safari)",
  "settings.install_ios_1": "Otevři unseenapp.cz v Safari",
  "settings.install_ios_2": "Klikni na tlačítko Sdílet ↑ dole",
  "settings.install_ios_3": 'Klikni na "Přidat na plochu" → Přidat',
  "settings.install_android_title": "Android (Chrome)",
  "settings.install_android_1": "Otevři unseenapp.cz v Chrome",
  "settings.install_android_2": "Klikni na menu se třemi tečkami ⋮ vpravo nahoře",
  "settings.install_android_3": 'Klikni na "Přidat na plochu"',
  "settings.logout": "Odhlásit se",
  "settings.delete_account": "Smazat účet",
    "settings.delete_confirm_body":
    "Tímto se smaže tvůj účet. Tvé fotky a profil se odstraní za 6 měsíců a konverzace jsou bezpečně uchovávány, vše z bezpečnostních důvodů. Budeš odhlášen/a a s tímto e-mailem se už nebudeš moct přihlásit.",
  "settings.delete_confirm_button": "Potvrdit smazání",
  "settings.deleting": "Mažu…",
  "settings.error_export": "Tvá data teď nejde připravit.",
  "settings.error_delete": "Účet teď nejde smazat.",

  // ---------- premium ----------
  "premium.badge": "✦ Premium",
  "premium.upgrade_heading": "Odemkni Unseen Premium",
  "premium.upgrade_body":
    "Neomezené lajky · 3 prioritní slidery · Skóre kompatibility · Až 30 shod",
  "premium.cta": "Začít za 199 Kč / měsíc",
  "premium.active_label": "Tvůj plán",
  "premium.active_value": "Premium",
  "premium.active_until": "Aktivní do",
  "premium.manage": "Spravovat předplatné",
  "premium.processing": "Přesměrovávám na platbu…",
  "premium.error": "Teď nejde spustit platbu.",

  // ---------- onboarding modal ----------
  "onboarding.s1.emoji": "👋",
  "onboarding.s1.title": "Vítej v Unseen",
  "onboarding.s1.body": "Vidíš fotky — nic víc. Žádná jména, žádné bio. Lajkuješ nebo přeskočíš. Když se lajknete navzájem, je to shoda.",

  "onboarding.s2.emoji": "📊",
  "onboarding.s2.title": "Tvůj přehled",
  "onboarding.s2.body": "Čísla tady ukazují, kolik lidí odpovídá tvým preferencím — a kolik tě už lajkovalo.",

  "onboarding.s3.emoji": "⏳",
  "onboarding.s3.title": "24hodinový zámek.",
  "onboarding.s3.body": "Shoda se zobrazí až po +- 24 hodinách. Abyste nevěděli, s kým z lajknuvých profilů je. Víte, že jste si vizuálně sympatičtí. Teď zjistěte, jestli se vám líbí vaše osobnosti.",

  "onboarding.s4.emoji": "⭐",
  "onboarding.s4.title": "Prioritní slider",
  "onboarding.s4.body": "V profilu si vyber osobnostní vlastnost, na které ti záleží nejvíc. Shody, kde to máte podobně, dostanou růžovou ✦. Uvidíš ji jenom ty. Každý vidí hvězdičky na základě jím zvolených preferencí.",

  "onboarding.s5.emoji": "🙈",
  "onboarding.s5.title": "To je vše",
  "onboarding.s5.body": "Žádné algoritmy, které rozhodují o tvé hodnotě. Jen fotky, osobnost a trocha trpělivosti. Jdi se podívat, kdo tam je.",

  "onboarding.cta": "Jdeme na to!",

  // ---------- premium onboarding modal ----------
  "premium_onboarding.s1.emoji": "✦",
  "premium_onboarding.s1.title": "Máš Premium!",
  "premium_onboarding.s1.body": "Neomezené lajky, až 30 aktivních shod a chytřejší signály kompatibility.",

  "premium_onboarding.s2.emoji": "⭐",
  "premium_onboarding.s2.title": "3 prioritní slidery",
  "premium_onboarding.s2.body": "Jdi do profilu a nastav až 3 osobnostní priority. Čím víc z nich se se shodou kryje, tím silnější signál. Nezapomeň, že ostatní můžou mít jiné priority. Zobrazíš se jim dřív, pokud odpovídáš jejich prioritám. Proto vyplň všehny, a ne jenom ty, které jsou důležité pro tebe.",

  "premium_onboarding.s3.emoji": "★",
  "premium_onboarding.s3.title": "Žlutá hvězda",
  "premium_onboarding.s3.body": "Když má tvůj match podobně nastavené hodnoty u 2 nebo 3 ze tvých priorit, uvidíš žlutou ★ místo růžové ✦ — to je silný signál, který stojí za pozornost.",

  "premium_onboarding.cta": "Nastavit priority →",

  // ---------- swipe match celebration ----------
  "swipe.match_celebration_title": "Chat je otevřený.",
  "swipe.match_celebration_sub": "Líbíte se si navzájem. Pořád nevíš, kdo to je — napiš a zjisti.",
  "swipe.match_celebration_cta": "Začít chatovat",
  "swipe.match_celebration_tap_dismiss": "Klepnutím zavřeš",

  // ---------- swipe like limit ----------
  "swipe.like_limit_heading": "Dosáhla jsi limitu lajků",
  "swipe.like_limit_body":
    "Využila jsi 30 volných lajků. Obnoví se za 12 hodin — nebo přejdi na Premium pro neomezené lajky.",
  "swipe.match_limit_heading": "Dosáhla jsi limitu shod.",
  "swipe.match_limit_body":
    "Máš 10 aktivních shod. Zkus si s nimi povídat, nebo zruš propojení, pro další swajpování, nebo přejdi na Premium (až 30 aktivních shod).",

  // ---------- terms / privacy ----------
  "terms.heading": "Podmínky používání",
  "terms.body": "Sem přijde text podmínek.",
  "terms.version": "Verze 1.0",
  "terms.applicable":
    "Platí především v Evropské unii, řídí se českým právem.",
  "terms.contents": "Obsah",
  "terms.effective_date": "Platné od:",
  "terms.locale_notice":
    "Tyto podmínky jsou aktuálně k dispozici pouze v angličtině.",
  "privacy.heading": "Ochrana soukromí",
  "privacy.body": "Sem přijde text o soukromí.",
  "privacy.version": "Verze 1.0",
  "privacy.applicable":
    "Platí především v Evropské unii, řídí se českým právem.",
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
  "language_name.Czech": "Čeština",
  "language_name.Slovak": "Slovenština",
  "language_name.Ukrainian": "Ukrajinština",
  "language_name.Russian": "Ruština",
  "language_name.Vietnamese": "Vietnamština",
  "language_name.Polish": "Polština",
  "language_name.German": "Němčina",
  "language_name.Hungarian": "Maďarština",
  "language_name.English": "Angličtina",
  "language_name.Bulgarian": "Bulharština",
  "language_name.Romanian": "Rumunština",
  "language_name.Croatian": "Chorvatština",
  "language_name.Serbian": "Srbština",
  "language_name.Mongolian": "Mongolština",
  "language_name.French": "Francouzština",
  "language_name.Italian": "Italština",

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
