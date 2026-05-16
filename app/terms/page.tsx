"use client";

import { useRouter } from "next/navigation";
import { useT } from "../../lib/i18n/I18nProvider";
import {
  SectionTitle,
  SubTitle,
  Note,
  P,
  A,
  UL,
  OL,
  Placeholder,
} from "../components/LegalDoc";

export default function TermsPage() {
  const router = useRouter();
  const t = useT();

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-neutral-500 text-lg"
          aria-label={t("common.back")}
        >
          ←
        </button>
        <img
          src="/brand/icononly_transparent_nobuffer.png"
          alt="Unseen"
          className="h-7 w-auto object-contain"
        />
        <h1 className="text-lg font-semibold flex-1">{t("terms.heading")}</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">
            {t("terms.effective_date")} <Placeholder>INSERT DATE</Placeholder> · {t("terms.version")}
          </p>
          <p className="text-sm text-neutral-500">{t("terms.applicable")}</p>
        </div>

        {/* Locale notice */}
        <Note>{t("terms.locale_notice")}</Note>

        {/* TOC */}
        <nav aria-label={t("terms.contents")} className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">{t("terms.contents")}</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-neutral-700">
            <li><a href="#s-intro" className="hover:text-[#E0175C]">Introduction</a></li>
            <li><a href="#s-definitions" className="hover:text-[#E0175C]">Definitions</a></li>
            <li><a href="#s1" className="hover:text-[#E0175C]">Eligibility &amp; Acceptance</a></li>
            <li><a href="#s2" className="hover:text-[#E0175C]">Account Registration &amp; Security</a></li>
            <li><a href="#s3" className="hover:text-[#E0175C]">Photo Verification</a></li>
            <li><a href="#s4" className="hover:text-[#E0175C]">Subscriptions &amp; Billing</a></li>
            <li><a href="#s5" className="hover:text-[#E0175C]">Intellectual Property</a></li>
            <li><a href="#s6" className="hover:text-[#E0175C]">User Conduct</a></li>
            <li><a href="#s7" className="hover:text-[#E0175C]">Toxic Behaviour Protections</a></li>
            <li><a href="#s8" className="hover:text-[#E0175C]">Privacy &amp; Data</a></li>
            <li><a href="#s9" className="hover:text-[#E0175C]">Reporting &amp; Enforcement</a></li>
            <li><a href="#s10" className="hover:text-[#E0175C]">Mental Health &amp; Vulnerable Users</a></li>
            <li><a href="#s11" className="hover:text-[#E0175C]">Limitation of Liability</a></li>
            <li><a href="#s12" className="hover:text-[#E0175C]">Dispute Resolution</a></li>
            <li><a href="#s13" className="hover:text-[#E0175C]">Governing Law</a></li>
            <li><a href="#s14" className="hover:text-[#E0175C]">Account Termination</a></li>
          </ol>
        </nav>

        {/* Introduction */}
        <section className="space-y-3">
          <SectionTitle id="s-intro">Introduction</SectionTitle>
          <P>
            Welcome to Unseen. These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the Unseen mobile application and related services (collectively, the &ldquo;App&rdquo; or &ldquo;Platform&rdquo;), operated by Unseen Ltd. (&ldquo;Unseen&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
          </P>
          <P>
            By creating an account or using the App, you confirm that you have read, understood, and agreed to be bound by these Terms. If you do not agree, you must not access or use the App.
          </P>
          <P>
            These Terms apply to users in the European Union (&ldquo;EU&rdquo;), the United Kingdom (&ldquo;UK&rdquo;), and the United States of America (&ldquo;USA&rdquo;). Where regional law creates specific obligations or rights, those are addressed in the relevant sections.
          </P>
        </section>

        {/* Definitions */}
        <section className="space-y-3">
          <SectionTitle id="s-definitions">Definitions</SectionTitle>
          <P>In these Terms, the following definitions apply:</P>
          <dl className="space-y-3 text-neutral-700">
            <div><dt className="font-semibold text-black">&ldquo;App&rdquo;</dt><dd>The Unseen mobile application, website, and all associated services.</dd></div>
            <div><dt className="font-semibold text-black">&ldquo;User&rdquo; / &ldquo;you&rdquo;</dt><dd>Any individual who registers for or uses the App.</dd></div>
            <div><dt className="font-semibold text-black">&ldquo;Account&rdquo;</dt><dd>The registered profile a User creates to access the App.</dd></div>
            <div><dt className="font-semibold text-black">&ldquo;Content&rdquo;</dt><dd>Any text, images, messages, or other material submitted to the App.</dd></div>
            <div><dt className="font-semibold text-black">&ldquo;Subscription&rdquo;</dt><dd>A paid tier of access to premium features within the App.</dd></div>
            <div><dt className="font-semibold text-black">&ldquo;Verification Photo&rdquo;</dt><dd>A photo submitted by the User during identity verification and used as the basis for ongoing photo verification status.</dd></div>
            <div><dt className="font-semibold text-black">&ldquo;Match&rdquo;</dt><dd>A mutual connection formed when two Users express interest in each other.</dd></div>
          </dl>
        </section>

        {/* Section 1 */}
        <section className="space-y-3">
          <SectionTitle id="s1" num="1">Eligibility and Acceptance of Terms</SectionTitle>

          <SubTitle>1.1 Age Requirement</SubTitle>
          <P>The App is intended exclusively for adults. You must be at least 18 years of age to create an Account or use the App. By registering, you confirm that you meet this requirement. Unseen reserves the right to terminate any Account where there is reason to believe the User is under 18.</P>

          <SubTitle>1.2 Reporting Suspected Minors</SubTitle>
          <P>If you encounter a profile you have reason to believe belongs to a person under the age of 18, you are required to report it immediately using the in-app reporting tools. Unseen takes all such reports seriously and will investigate promptly.</P>

          <SubTitle>1.3 Acceptance</SubTitle>
          <P>By using the App, you accept these Terms in their entirety. You also confirm that you have the legal capacity to enter into a binding agreement.</P>

          <SubTitle>1.4 Changes to Terms</SubTitle>
          <P>Unseen may update these Terms from time to time. Where changes are material, we will notify you by email at the address associated with your Account at least 30 days before the changes take effect. Continued use of the App after the effective date of any revision constitutes your acceptance of the updated Terms.</P>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <SectionTitle id="s2" num="2">Account Registration and Security</SectionTitle>

          <SubTitle>2.1 Account Creation</SubTitle>
          <P>To use the App, you must create an Account by providing accurate, current, and complete information. You are responsible for keeping your account information up to date.</P>

          <SubTitle>2.2 Account Security</SubTitle>
          <P>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your Account. You must not share your login details with any third party. If you suspect unauthorised access, you must notify us immediately at <A href="mailto:unseen-security@randenibezfiltru.cz">unseen-security@randenibezfiltru.cz</A>.</P>

          <SubTitle>2.3 One Account per Person</SubTitle>
          <P>Each User may maintain only one active Account. Creating multiple Accounts, particularly to circumvent a suspension or ban, is a violation of these Terms and may result in permanent exclusion from the platform.</P>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <SectionTitle id="s3" num="3">Photo Verification</SectionTitle>

          <SubTitle>3.1 Mandatory Verification</SubTitle>
          <P>All Accounts must undergo photo verification before being permitted to use the App. Unverified Accounts will not have access to any matching or messaging features. This requirement exists to protect our community from impersonation and catfishing.</P>

          <SubTitle>3.2 Ongoing Verification Status</SubTitle>
          <P>Verification is tied to the specific photos submitted at the time of verification (&ldquo;Verification Photos&rdquo;). You may add new photos to your profile at any time without triggering re-verification, provided that at least one of your original Verification Photos remains on your profile.</P>
          <P>If you remove or replace all of your Verification Photos such that none of the photos present during your original verification remain on your profile, your Account will be suspended pending re-verification. This policy addresses a common identity deception pattern in which a person verifies with a genuine photo and subsequently replaces all photos with fraudulent ones.</P>

          <SubTitle>3.3 Accuracy of Profile Photos</SubTitle>
          <P>All profile photos must be recent, accurate representations of your current appearance. Heavily filtered, misleading, or manipulated photos that misrepresent your identity are not permitted and may constitute grounds for Account termination.</P>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <SectionTitle id="s4" num="4">Subscriptions, Billing, and Cancellations</SectionTitle>

          <SubTitle>4.1 Free and Paid Tiers</SubTitle>
          <P>Unseen offers both a free tier and paid Subscription tiers with enhanced features. The features available under each tier are described within the App and are subject to change.</P>

          <SubTitle>4.2 Billing</SubTitle>
          <P>Subscription fees are billed in advance on a recurring basis (monthly or annually, as selected). By subscribing, you authorise Unseen to charge your selected payment method. All prices are inclusive of applicable taxes where required by law.</P>

          <SubTitle>4.3 Cancellation</SubTitle>
          <P>You may cancel your Subscription at any time through your Account settings or the relevant app store. Cancellation will take effect at the end of your current billing period. You will retain access to paid features until that date.</P>

          <SubTitle>4.4 Refunds</SubTitle>
          <P>Subscription fees are generally non-refundable, except where required by law. EU and UK residents may exercise a right of withdrawal within 14 days of purchase under applicable consumer protection law, unless paid features have already been used.</P>

          <SubTitle>4.5 Price Changes</SubTitle>
          <P>We may adjust Subscription pricing at any time. Where we increase prices, we will provide reasonable advance notice and an opportunity to cancel before the new pricing takes effect.</P>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <SectionTitle id="s5" num="5">Intellectual Property</SectionTitle>

          <SubTitle>5.1 Unseen&apos;s Rights</SubTitle>
          <P>The App, its design, software, trademarks, and all content created by Unseen are the exclusive property of Unseen Ltd. or its licensors. Nothing in these Terms grants you any rights in the App beyond what is necessary to use it as intended.</P>

          <SubTitle>5.2 Your Content</SubTitle>
          <P>You retain ownership of the Content you submit to the App. By submitting Content, you grant Unseen a non-exclusive, worldwide, royalty-free licence to use, store, display, and process your Content solely for the purpose of operating and improving the App and conducting anonymised research as described in Section 8.</P>

          <SubTitle>5.3 Content Restrictions</SubTitle>
          <P>You must not upload or share Content that infringes the intellectual property rights of any third party. If you believe your intellectual property has been infringed on the App, please contact us at <A href="mailto:unseen-legal@randenibezfiltru.cz">unseen-legal@randenibezfiltru.cz</A>.</P>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <SectionTitle id="s6" num="6">User Conduct</SectionTitle>
          <P>Unseen is built on the principle that every person deserves to be treated with dignity. By using the App, you agree to the following conduct standards.</P>

          <SubTitle>6.1 General Prohibitions</SubTitle>
          <P>You must not:</P>
          <UL>
            <li>Harass, threaten, intimidate, bully, or abuse any other User in any form, whether through messages, profile content, or any other feature of the App.</li>
            <li>Post or share hate speech, discriminatory language, or content that degrades individuals based on race, ethnicity, gender, sexual orientation, disability, religion, or any other protected characteristic.</li>
            <li>Impersonate any other person, User, public figure, or entity, whether living or deceased.</li>
            <li>Use the App for any form of solicitation, including but not limited to sex work, escort services, commercial promotion, multi-level marketing, or spam.</li>
            <li>Encourage, facilitate, or participate in the use of the App by any person under the age of 18.</li>
          </UL>

          <SubTitle>6.2 Screenshots and Sharing</SubTitle>
          <P>Given the practical anonymity afforded to users on this platform, Unseen permits screenshots and the sharing of conversations or profile content for the purpose of reporting, evidencing, or raising awareness of abusive or toxic behaviour.</P>
          <P>However, you must not use screenshots or shared content to:</P>
          <UL>
            <li>Publicly mock, humiliate, or shame another User.</li>
            <li>Harass a User outside the App.</li>
            <li>Enable or assist in identifying a User who has not consented to being identified.</li>
            <li>Dox another User (see Section 7.6).</li>
          </UL>
          <Note>The right to share evidence of misconduct is a deliberate feature of this platform. We trust our community to exercise this right responsibly and in good faith.</Note>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <SectionTitle id="s7" num="7">Toxic Behaviour Protections</SectionTitle>
          <P>Dating apps carry a unique responsibility to protect users from patterns of behaviour that, while sometimes normalised elsewhere, cause real harm. The following provisions are central to how Unseen operates.</P>

          <SubTitle>7.1 No Sexual Coercion or Pressure</SubTitle>
          <P>Zero tolerance applies to any form of sexual coercion, pressure, or manipulation. This includes pressuring a User to engage in sexual activity, share intimate images, or continue a conversation they have expressed a wish to end. Violations will result in immediate suspension pending investigation.</P>

          <SubTitle>7.2 No Unsolicited Explicit Content</SubTitle>
          <P>You must not send unsolicited explicit images, videos, or messages of a sexual nature. &ldquo;Unsolicited&rdquo; means any explicit content sent without the prior, clear, and voluntary agreement of the recipient. Explicit content should only ever be shared where both parties have actively and clearly consented to that type of exchange.</P>

          <SubTitle>7.3 No Catfishing or Identity Misrepresentation</SubTitle>
          <P>You must not deliberately misrepresent your identity, age, gender, physical appearance, or any other material characteristic with the intent to deceive another User. This includes the use of photos of another person, heavily manipulated images, or false biographical information. This prohibition operates alongside the photo verification requirements in Section 3.</P>

          <SubTitle>7.4 No Love Bombing or Emotional Manipulation</SubTitle>
          <P>You must not engage in deliberate emotional manipulation of other Users. Love bombing — the use of overwhelming affection, flattery, or attention as a tactic to control or destabilise another person — and other forms of psychological manipulation are prohibited and may result in Account termination.</P>

          <SubTitle>7.5 No Contact After Unmatching or Blocking</SubTitle>
          <P>If a User unmatches or blocks you, all connection between your Accounts is severed and must remain so. Any attempt to contact that User through alternative Accounts, or to solicit others to pass messages on your behalf, is a serious violation of these Terms. We treat persistent unwanted contact as a form of harassment and will act accordingly.</P>

          <SubTitle>7.6 No Doxxing</SubTitle>
          <P>You must not seek out, compile, share, or publish the personal information of another User without their explicit consent. Personal information includes, but is not limited to: full name, home or work address, phone number, workplace, social media profiles, or any other data that could be used to identify or locate a person in the physical world.</P>

          <SubTitle>7.7 Ghosting — A Community Standard</SubTitle>
          <Note>The following is a community standard, not an enforceable rule. It reflects the values we ask all Unseen users to aspire to.</Note>
          <P>We recognise that ghosting — ending a connection by ceasing all communication without explanation — can cause real emotional harm. While Unseen cannot enforce relational conduct, we encourage all users to practise direct, respectful communication. Even a brief, kind message is better than silence.</P>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <SectionTitle id="s8" num="8">Privacy and Data</SectionTitle>
          <P>Your privacy matters to us. This section summarises our core data practices. Our full Privacy Policy, which forms part of these Terms, is available at <Placeholder>privacy policy link</Placeholder> and should be read alongside this section.</P>

          <SubTitle>8.1 Data We Collect</SubTitle>
          <P>In the course of providing the App, we collect the following categories of data:</P>
          <UL>
            <li>Identity and profile data: name, date of birth, photos, gender, and preferences.</li>
            <li>Contact data: email address.</li>
            <li>Location data: approximate or precise location, where permitted by your device settings.</li>
            <li>Behavioural data: how you interact with the App, including swipe patterns, session duration, and feature usage.</li>
            <li>Device data: device type, operating system, and app version.</li>
            <li>Communications: messages sent through the App.</li>
          </UL>

          <SubTitle>8.2 How We Use Your Data</SubTitle>
          <P>Unseen uses your data exclusively for the following purposes:</P>
          <UL>
            <li>Operating and improving the App and its matching features.</li>
            <li>Verifying your identity and ensuring compliance with these Terms.</li>
            <li>Providing customer support and investigating reported conduct.</li>
            <li>Conducting internal and third-party-assisted research, subject to the strict anonymisation requirements described in Section 8.3.</li>
          </UL>
          <P>Unseen does not sell your personal data. We do not use your data for advertising purposes.</P>

          <SubTitle>8.3 Research and Third-Party Data Sharing</SubTitle>
          <P>Unseen may engage third-party researchers to assist in improving the App and understanding user behaviour. All data shared with third parties for research purposes is strictly anonymised before transfer. Specifically:</P>
          <UL>
            <li>No email addresses, names, or profile photos are shared with third parties.</li>
            <li>Third parties receive only de-identified qualitative data, such as general aesthetic or compositional characteristics of photos, behavioural patterns, and broad demographic groupings.</li>
            <li>All data shared remains the property of Unseen at all times. Third parties are prohibited from re-identifying data or using it for any purpose other than the specific research engaged.</li>
          </UL>
          <P>Third parties operate under strict contractual obligations, including data processing agreements that comply with applicable law.</P>

          <SubTitle>8.4 Retention of Conversations</SubTitle>
          <P>For the safety of our community, all messages sent through the App are stored by Unseen and remain linked to your Account. This allows us to investigate reports of abusive conduct, enforce these Terms, and cooperate with law enforcement where required by law.</P>
          <P>This retention is maintained even following Account deletion where a report or investigation is pending or reasonably anticipated, or where we have a legal obligation to retain the data.</P>
          <Note>GDPR / UK GDPR Note: Where you submit a data deletion request, Unseen may lawfully retain conversation data under the legal bases of legitimate interests (community safety) and legal obligation. Retained data is held securely and accessed only for safety investigation purposes.</Note>

          <SubTitle>8.5 Your Rights</SubTitle>
          <P>Depending on your location, you have the following rights in relation to your personal data:</P>
          <UL>
            <li>Right of access: request a copy of the data we hold about you.</li>
            <li>Right to rectification: request correction of inaccurate data.</li>
            <li>Right to erasure: request deletion of your data, subject to the retention provisions in Section 8.4 and applicable legal obligations.</li>
            <li>Right to portability: request your data in a machine-readable format.</li>
            <li>Right to object: object to certain types of processing, including profiling.</li>
            <li>Right to restrict processing: request that we limit how we use your data.</li>
          </UL>
          <P>To exercise any of these rights, contact <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>. We will respond within the timeframes required by applicable law (30 days under GDPR; 45 days under CCPA).</P>

          <SubTitle>8.6 GDPR Compliance (EU and UK Users)</SubTitle>
          <P>Unseen processes personal data in accordance with the EU General Data Protection Regulation (GDPR) and, for UK users, the UK GDPR as retained in domestic law. Our lawful bases for processing include: performance of a contract (providing the App), legitimate interests (safety and improvement), legal obligation, and consent where required. Details of our data protection officer are available in the Privacy Policy.</P>

          <SubTitle>8.7 CCPA Compliance (California Users)</SubTitle>
          <P>California residents have rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected and shared, the right to delete personal information, and the right to opt out of the sale of personal information. Unseen does not sell personal information. To submit a CCPA request, contact <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>

          <SubTitle>8.8 Cookies and Tracking</SubTitle>
          <P>The App uses cookies and similar technologies for authentication, performance analysis, and user experience improvement. We do not use cookies for third-party advertising. You may manage your preferences through your device settings. Full details are in our Cookie Policy, available at <Placeholder>cookie policy link</Placeholder>.</P>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <SectionTitle id="s9" num="9">Reporting and Enforcement</SectionTitle>

          <SubTitle>9.1 Reporting Tools</SubTitle>
          <P>Every profile and conversation in the App includes built-in reporting and blocking tools. We encourage all Users to report conduct they believe violates these Terms, even if they are uncertain whether a formal violation has occurred.</P>

          <SubTitle>9.2 How We Investigate Reports</SubTitle>
          <P>All reports are reviewed by the Unseen Trust and Safety team. Investigations may involve reviewing messages, account history, reported content, and patterns of behaviour. Where necessary, we may contact the reporting User for additional information. All reports are treated in confidence.</P>

          <SubTitle>9.3 Consequence Ladder</SubTitle>
          <P>Depending on the nature and severity of a violation, Unseen may take the following actions:</P>
          <OL>
            <li>Formal warning issued to the offending Account.</li>
            <li>Temporary suspension of the Account pending investigation.</li>
            <li>Permanent ban from the platform, including prohibition on creating new Accounts.</li>
            <li>Referral to law enforcement where conduct may constitute a criminal offence.</li>
          </OL>
          <P>Unseen reserves the right to take any of the above actions without prior warning where conduct is sufficiently serious, including but not limited to violations involving sexual coercion, unsolicited explicit content, threats of violence, or conduct involving minors.</P>

          <SubTitle>9.4 Right to Remove Content and Users</SubTitle>
          <P>Unseen reserves the right to remove any Content or suspend any Account that, in our reasonable judgement, violates the letter or spirit of these Terms or is otherwise harmful to our community, even if the specific behaviour is not explicitly listed herein. We will not be liable to any User for taking such action in good faith.</P>

          <SubTitle>9.5 No Guarantee of Third-Party Behaviour</SubTitle>
          <P>Unseen provides tools to help Users stay safe but cannot guarantee the conduct of other Users. You acknowledge that you interact with other Users at your own discretion and risk. Unseen is not responsible for the actions of Users outside the App, or for harm arising from interactions that begin on the App and continue elsewhere.</P>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <SectionTitle id="s10" num="10">Mental Health and Vulnerable Users</SectionTitle>

          <SubTitle>10.1 No Exploitation of Vulnerability</SubTitle>
          <P>You must not target, manipulate, or exploit Users who have disclosed or displayed signs of mental health difficulties, emotional distress, or psychological vulnerability. Unseen is committed to ensuring that vulnerable people are protected, not preyed upon.</P>

          <SubTitle>10.2 No Harmful Content</SubTitle>
          <P>You must not post, share, or send Content that encourages, glorifies, or provides guidance on self-harm, suicide, disordered eating, or any other behaviour that could endanger the physical or psychological wellbeing of another User. Such content will be removed immediately and the Account may be terminated.</P>

          <SubTitle>10.3 Safe Messaging</SubTitle>
          <P>Users discussing mental health topics are encouraged to follow safe messaging practices: listen without judgement, avoid graphic descriptions, and offer support rather than solutions. Unseen reserves the right to intervene where conversations indicate a User may be at risk.</P>

          <SubTitle>10.4 Crisis Resources</SubTitle>
          <P>If you or someone you know is in crisis, please contact a support service in your region. Unseen signposts the following resources within the App:</P>
          <UL>
            <li><strong className="text-black">EU:</strong> <Placeholder>Local emergency services or national mental health helpline for your country</Placeholder></li>
            <li><strong className="text-black">UK:</strong> <Placeholder>e.g. Samaritans · 116 123 · samaritans.org</Placeholder></li>
            <li><strong className="text-black">USA:</strong> <Placeholder>e.g. 988 Suicide &amp; Crisis Lifeline · call or text 988</Placeholder></li>
          </UL>
          <P>These resources will be localised based on your region. Unseen is not responsible for the services provided by third-party crisis organisations.</P>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <SectionTitle id="s11" num="11">Limitation of Liability and Disclaimers</SectionTitle>

          <SubTitle>11.1 App Provided &ldquo;As Is&rdquo;</SubTitle>
          <P>The App is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Unseen makes no representations or warranties of any kind, whether express or implied, regarding the App&apos;s availability, accuracy, reliability, or fitness for a particular purpose.</P>

          <SubTitle>11.2 Limitation of Liability</SubTitle>
          <P>To the fullest extent permitted by applicable law, Unseen shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App, including damages arising from the conduct of other Users.</P>
          <P>Where liability cannot be excluded by law (including under EU and UK consumer protection legislation), Unseen&apos;s total liability shall not exceed the amount you paid to Unseen in the 12 months preceding the event giving rise to the claim.</P>

          <SubTitle>11.3 Consumer Rights</SubTitle>
          <P>Nothing in these Terms limits or excludes rights you have as a consumer under applicable law, including the Consumer Rights Act 2015 (UK) or applicable EU Directives.</P>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <SectionTitle id="s12" num="12">Dispute Resolution</SectionTitle>

          <SubTitle>12.1 Informal Resolution</SubTitle>
          <P>We encourage Users to contact us directly in the first instance to resolve any dispute or complaint. Please email <A href="mailto:unseen-support@randenibezfiltru.cz">unseen-support@randenibezfiltru.cz</A> with a description of your concern. We aim to respond within 10 business days.</P>

          <SubTitle>12.2 Arbitration (US Users)</SubTitle>
          <P>For Users in the United States, any dispute, claim, or controversy arising out of or relating to these Terms or the App that cannot be resolved informally shall be submitted to binding individual arbitration in accordance with the rules of <Placeholder>arbitration body, e.g. AAA</Placeholder>. You waive any right to bring claims as part of a class action or representative proceeding, except where such waiver is prohibited by law.</P>

          <SubTitle>12.3 Jurisdiction (EU and UK Users)</SubTitle>
          <P>For EU Users, disputes shall be subject to the jurisdiction of the courts of the member state in which you are habitually resident. For UK Users, disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales, subject to your right as a consumer to bring proceedings in the courts of your home country.</P>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <SectionTitle id="s13" num="13">Governing Law</SectionTitle>
          <P>These Terms are governed by the laws of <Placeholder>INSERT GOVERNING JURISDICTION</Placeholder>, without regard to conflict of law principles. Where mandatory consumer protection laws of your country of residence offer greater protection, those laws will apply to that extent.</P>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
          <SectionTitle id="s14" num="14">Account Termination</SectionTitle>

          <SubTitle>14.1 Termination by You</SubTitle>
          <P>You may delete your Account at any time through the App settings. Upon deletion, your profile will be removed from the App. Certain data may be retained as described in Section 8.4.</P>

          <SubTitle>14.2 Termination by Unseen</SubTitle>
          <P>Unseen may suspend or permanently terminate your Account at any time, with or without notice, for breach of these Terms, behaviour harmful to other Users or the platform, or any other reason at Unseen&apos;s reasonable discretion.</P>

          <SubTitle>14.3 Effect of Termination</SubTitle>
          <P>Upon termination, your right to access the App ceases immediately. Subscription fees paid for the remainder of a billing period will not be refunded except where required by law. Sections relating to intellectual property, data, limitation of liability, and dispute resolution survive termination.</P>
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-2 text-sm text-neutral-500 text-center border-t border-neutral-200">
          <p>Questions? Contact <A href="mailto:unseen-legal@randenibezfiltru.cz">unseen-legal@randenibezfiltru.cz</A></p>
          <p className="mt-1">© Unseen Ltd. All rights reserved.</p>
        </footer>

        <div className="pt-2">
          <button
            onClick={() => router.back()}
            className="w-full py-4 rounded-full border font-medium"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    </main>
  );
}
