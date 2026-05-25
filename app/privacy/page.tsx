"use client";

import { useRouter } from "next/navigation";
import { useT, useLocale } from "../../lib/i18n/I18nProvider";
import { LOCALES, type Locale } from "../../lib/i18n";
import {
  SectionTitle,
  SubTitle,
  Note,
  P,
  A,
  UL,
} from "../components/LegalDoc";

export default function PrivacyPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();

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
        <h1 className="text-lg font-semibold flex-1">{t("privacy.heading")}</h1>
        <div className="flex gap-1">
          {LOCALES.map((code) => (
            <button key={code} type="button" onClick={() => setLocale(code as Locale)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${locale === code ? "bg-[#E0175C] text-white" : "text-[#A89488] hover:text-[#E0175C]"}`}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">
            {t("privacy.effective_date")} 25. 5. 2026 · {t("privacy.version")}
          </p>
          <p className="text-sm text-neutral-500">{t("privacy.applicable")}</p>
          <p className="text-sm text-neutral-500">
            Správce údajů: Ing. Nikol Jaterková, IČO: 23702681 · <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>
          </p>
        </div>

        {/* Locale notice */}
        <Note>{t("privacy.locale_notice")}</Note>

        {/* TOC */}
        <nav aria-label={t("privacy.contents")} className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">{t("privacy.contents")}</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-neutral-700">
            <li><a href="#p-intro" className="hover:text-[#E0175C]">Introduction</a></li>
            <li><a href="#p1" className="hover:text-[#E0175C]">Who We Are</a></li>
            <li><a href="#p2" className="hover:text-[#E0175C]">Data We Collect</a></li>
            <li><a href="#p3" className="hover:text-[#E0175C]">How We Use Your Data</a></li>
            <li><a href="#p4" className="hover:text-[#E0175C]">Legal Bases for Processing</a></li>
            <li><a href="#p5" className="hover:text-[#E0175C]">Data Sharing &amp; Third Parties</a></li>
            <li><a href="#p6" className="hover:text-[#E0175C]">Data Retention</a></li>
            <li><a href="#p7" className="hover:text-[#E0175C]">International Data Transfers</a></li>
            <li><a href="#p8" className="hover:text-[#E0175C]">Your Rights</a></li>
            <li><a href="#p9" className="hover:text-[#E0175C]">Marketing Communications</a></li>
            <li><a href="#p10" className="hover:text-[#E0175C]">Cookies &amp; Tracking</a></li>
            <li><a href="#p11" className="hover:text-[#E0175C]">Children&apos;s Privacy</a></li>
            <li><a href="#p12" className="hover:text-[#E0175C]">Data Security</a></li>
            <li><a href="#p13" className="hover:text-[#E0175C]">Changes to This Policy</a></li>
            <li><a href="#p14" className="hover:text-[#E0175C]">Contact Us</a></li>
          </ol>
        </nav>

        {/* Introduction */}
        <section className="space-y-3">
          <SectionTitle id="p-intro">Introduction</SectionTitle>
          <P>This Privacy Policy explains how Unseen (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, stores, shares, and protects your personal data when you use the Unseen mobile application and related services (the &ldquo;App&rdquo;).</P>
          <P>We are committed to handling your data with care, transparency, and respect. Please read this Policy carefully. By creating an Account or using the App, you confirm that you have read and understood how we process your personal data.</P>
          <P>This Policy should be read alongside our Terms and Conditions, which are available at <A href="/terms">/terms</A>.</P>
        </section>

        {/* Section 1 */}
        <section className="space-y-3">
          <SectionTitle id="p1" num="1">Who We Are</SectionTitle>
          <P>The data controller responsible for your personal data is Ing. Nikol Jaterková, IČO: 23702681, operating the Unseen app at unseenapp.cz. If you have any questions about this Policy or how your data is handled, contact us at <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
          <Note>As a small independent operator, we do not have a formally appointed Data Protection Officer. All privacy queries go directly to the operator via the email above.</Note>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <SectionTitle id="p2" num="2">Data We Collect</SectionTitle>
          <P>We collect personal data in the following categories:</P>

          <SubTitle>2.1 Data You Provide Directly</SubTitle>
          <UL>
            <li>Identity data: date of birth, gender, and preferences.</li>
            <li>Contact data: email address.</li>
            <li>Profile data: photos and any other information you add to your profile.</li>
            <li>Verification data: photos submitted for identity verification purposes.</li>
            <li>Communications: messages, reports, and other content you send through the App.</li>
            <li>Payment data: billing information processed via our payment provider (we do not store card details directly).</li>
          </UL>

          <SubTitle>2.2 Data We Collect Automatically</SubTitle>
          <UL>
            <li>Location data: approximate city, where provided during onboarding.</li>
            <li>Behavioural data: how you use the App, including swipe patterns, feature interactions, session duration, and match activity.</li>
            <li>Device data: device type, operating system version, app version, and unique device identifiers.</li>
            <li>Log data: IP address, access timestamps, and error logs.</li>
          </UL>

          <SubTitle>2.3 Data We Do Not Collect</SubTitle>
          <P>We do not intentionally collect sensitive categories of personal data beyond what is inherent to a dating app (such as gender preferences). We encourage you not to share health, political, or religious information in your profile if you are not comfortable with it being stored.</P>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <SectionTitle id="p3" num="3">How We Use Your Data</SectionTitle>
          <P>We use your personal data only for the purposes set out below. We do not use your data for advertising, and we do not sell it to third parties.</P>

          <SubTitle>3.1 To Provide and Improve the App</SubTitle>
          <UL>
            <li>Creating and managing your Account.</li>
            <li>Enabling matching, messaging, and other core features.</li>
            <li>Photo verification to protect the community from impersonation.</li>
            <li>Personalising your experience based on your preferences and behaviour.</li>
            <li>Analysing usage patterns to improve the App&apos;s features and performance.</li>
          </UL>

          <SubTitle>3.2 For Safety and Enforcement</SubTitle>
          <UL>
            <li>Investigating reports of abusive or prohibited conduct.</li>
            <li>Detecting and preventing fraud, impersonation, and misuse.</li>
            <li>Retaining conversation data to support safety investigations (see Section 6).</li>
            <li>Cooperating with law enforcement where required by law.</li>
          </UL>

          <SubTitle>3.3 For Communications</SubTitle>
          <UL>
            <li>Sending transactional emails: account confirmations, safety alerts, match notifications, and policy updates.</li>
            <li>Sending marketing communications, but only if you have opted in (see Section 9).</li>
          </UL>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <SectionTitle id="p4" num="4">Legal Bases for Processing (EU Users)</SectionTitle>
          <P>Under the GDPR, we are required to have a lawful basis for each type of processing. Our legal bases are as follows:</P>
          <UL>
            <li><strong className="text-black">Performance of a contract:</strong> Processing necessary to provide the App — account creation, matching, messaging, and billing.</li>
            <li><strong className="text-black">Legitimate interests:</strong> Safety investigations, fraud prevention, and App improvement — where our interests do not override your fundamental rights.</li>
            <li><strong className="text-black">Legal obligation:</strong> Retaining data to comply with applicable Czech and EU law, including cooperation with law enforcement.</li>
            <li><strong className="text-black">Consent:</strong> Marketing emails and any processing of special category data you voluntarily disclose. You may withdraw consent at any time.</li>
          </UL>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <SectionTitle id="p5" num="5">Data Sharing and Third Parties</SectionTitle>
          <P>We do not sell your personal data. We share it only in the circumstances described below.</P>

          <SubTitle>5.1 Service Providers (Data Processors)</SubTitle>
          <P>We engage trusted third-party service providers to help us operate the App. These providers act as data processors and may only use your data on our instructions. They include:</P>
          <UL>
            <li>Cloud hosting and infrastructure: Supabase (database and authentication) and Vercel (application hosting).</li>
            <li>Payment processing: Stripe — handles Subscription billing. We do not store full payment card details.</li>
            <li>Email delivery: Resend — for transactional and notification emails.</li>
          </UL>
          <P>A current list of sub-processors is available on request at <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>

          <SubTitle>5.2 Legal Disclosure</SubTitle>
          <P>We may disclose your personal data to law enforcement, regulators, or courts where we are required to do so by law, or where we reasonably believe disclosure is necessary to protect the safety of any person or to prevent unlawful activity.</P>

          <SubTitle>5.3 Business Transfers</SubTitle>
          <P>If Unseen is involved in a sale or transfer of its assets, your personal data may be transferred to the acquiring party. We will notify you of any such transfer and the choices available to you.</P>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <SectionTitle id="p6" num="6">Data Retention</SectionTitle>

          <SubTitle>6.1 General Retention</SubTitle>
          <P>We retain your personal data for as long as your Account is active. When you delete your Account, your profile is removed from the App within 30 days. Certain categories of data are retained for longer periods as described below.</P>

          <SubTitle>6.2 Conversation Data</SubTitle>
          <P>For the safety of our community, all messages sent through the App are stored and remain linked to your Account. This allows us to investigate reports of abusive conduct and cooperate with law enforcement where required. This retention is maintained even after Account deletion where a safety investigation is pending or we have a legal obligation to retain the data.</P>
          <Note>GDPR Note: We retain conversation data under the legal bases of legitimate interests (community safety) and legal obligation. Retained data is held securely and accessed only for safety investigation purposes.</Note>

          <SubTitle>6.3 Financial Records</SubTitle>
          <P>Billing and transaction records are retained for a minimum of five years to comply with Czech financial and tax law.</P>

          <SubTitle>6.4 Safety Records</SubTitle>
          <P>Records relating to safety investigations, bans, and serious conduct violations may be retained indefinitely to prevent circumvention of enforcement actions.</P>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <SectionTitle id="p7" num="7">International Data Transfers</SectionTitle>
          <P>Your personal data may be processed outside the European Economic Area (&ldquo;EEA&rdquo;) by our service providers (including Supabase and Vercel, which operate infrastructure in the USA and EU). Where we transfer personal data outside the EEA, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission to ensure adequate protection.</P>
          <P>You may request details of the relevant transfer safeguards by contacting us at <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <SectionTitle id="p8" num="8">Your Rights</SectionTitle>
          <P>Under the GDPR, you have the following rights:</P>
          <UL>
            <li><strong className="text-black">Access:</strong> request a copy of the personal data we hold about you.</li>
            <li><strong className="text-black">Rectification:</strong> request that inaccurate or incomplete data be corrected.</li>
            <li><strong className="text-black">Erasure:</strong> request deletion of your data, subject to retention obligations in Section 6.</li>
            <li><strong className="text-black">Restriction:</strong> request that we temporarily limit how we use your data.</li>
            <li><strong className="text-black">Portability:</strong> receive your data in a structured, machine-readable format.</li>
            <li><strong className="text-black">Object:</strong> object to processing based on legitimate interests.</li>
          </UL>
          <P>To exercise any of these rights, contact <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>. We will respond within 30 days. If you are not satisfied with our response, you have the right to lodge a complaint with the Czech data protection authority:</P>
          <P>Úřad pro ochranu osobních údajů (ÚOOÚ) · <A href="https://www.uoou.cz">uoou.cz</A> · posta@uoou.cz · +420 234 514 111</P>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <SectionTitle id="p9" num="9">Marketing Communications</SectionTitle>
          <P>Unseen will only send you marketing or promotional emails if you have explicitly opted in to receive them. You may withdraw your consent and unsubscribe at any time by clicking the unsubscribe link in any marketing email, or by updating your notification preferences in your Account settings.</P>
          <P>We will always send you transactional and safety-related emails (such as match notifications and account confirmations) regardless of your marketing preferences, as these are necessary to provide the App.</P>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <SectionTitle id="p10" num="10">Cookies and Tracking Technologies</SectionTitle>
          <P>The App uses cookies and similar tracking technologies for the following purposes:</P>
          <UL>
            <li>Authentication: to keep you logged in securely.</li>
            <li>Performance: to monitor App stability and diagnose errors.</li>
          </UL>
          <P>We do not use cookies for third-party advertising or cross-site tracking. You can manage your cookie preferences through the cookie banner in the App.</P>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <SectionTitle id="p11" num="11">Children&apos;s Privacy</SectionTitle>
          <P>The App is not intended for persons under the age of 18. We do not knowingly collect personal data from anyone under 18. If we become aware that we have collected personal data from a minor, we will delete it promptly. If you believe a minor has created an Account, please report it to <A href="mailto:unseen-safety@randenibezfiltru.cz">unseen-safety@randenibezfiltru.cz</A>.</P>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <SectionTitle id="p12" num="12">Data Security</SectionTitle>
          <P>Unseen implements appropriate technical and organisational measures to protect your personal data against unauthorised access, disclosure, alteration, or destruction. These include encryption of data in transit and at rest, access controls, and Row Level Security on our database.</P>
          <P>No method of transmission over the internet is completely secure. We cannot guarantee absolute security, but we will notify you and the relevant authorities in the event of a data breach where required by law.</P>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <SectionTitle id="p13" num="13">Changes to This Policy</SectionTitle>
          <P>We may update this Privacy Policy from time to time. Where changes are material, we will notify you by email at the address associated with your Account at least 30 days before the changes take effect. Continued use of the App after the effective date constitutes your acknowledgement of the revised Policy.</P>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
          <SectionTitle id="p14" num="14">Contact Us</SectionTitle>
          <P>If you have any questions, concerns, or requests relating to this Privacy Policy or how we handle your data, please contact us:</P>
          <UL>
            <li><strong className="text-black">Email:</strong> <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A></li>
            <li><strong className="text-black">Provozovatel:</strong> Ing. Nikol Jaterková, IČO: 23702681</li>
          </UL>
          <p className="text-xs text-neutral-400">Adresa sídla je evidována v živnostenském rejstříku a je dostupná na vyžádání.</p>
          <P>If you are not satisfied with our response, you have the right to complain to the ÚOOÚ (see Section 8).</P>
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-2 text-sm text-neutral-500 text-center border-t border-neutral-200">
          <p>Questions? Contact <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A></p>
          <p className="mt-1">© 2026 Ing. Nikol Jaterková, IČO: 23702681, provozující Unseen (unseenapp.cz)</p>
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
