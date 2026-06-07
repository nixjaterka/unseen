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
  OL,
} from "../components/LegalDoc";

function TermsEN() {
  return (
    <>
      <section className="space-y-3">
        <SectionTitle id="s-intro">Introduction</SectionTitle>
        <P>Welcome to Unseen. These Terms and Conditions ("Terms") govern your access to and use of the Unseen mobile application and related services (the "App"), operated by Ing. Nikol Jaterková, IČO: 23702681 ("Unseen", "we", "us", or "our").</P>
        <P>By creating an account or using the App, you confirm that you have read, understood, and agreed to be bound by these Terms. If you do not agree, you must not use the App.</P>
        <P>These Terms are primarily intended for users in the European Union and are governed by Czech and EU law.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s-definitions">Definitions</SectionTitle>
        <dl className="space-y-3 text-neutral-700">
          <div><dt className="font-semibold text-black">"App"</dt><dd>The Unseen mobile application, website (unseenapp.cz), and all associated services.</dd></div>
          <div><dt className="font-semibold text-black">"User" / "you"</dt><dd>Any individual who registers for or uses the App.</dd></div>
          <div><dt className="font-semibold text-black">"Account"</dt><dd>The registered profile a User creates to access the App.</dd></div>
          <div><dt className="font-semibold text-black">"Content"</dt><dd>Any text, images, messages, or other material submitted to the App.</dd></div>
          <div><dt className="font-semibold text-black">"Subscription"</dt><dd>A paid tier of access to premium features within the App.</dd></div>
          <div><dt className="font-semibold text-black">"Verification Photo"</dt><dd>A photo submitted by the User during identity verification.</dd></div>
          <div><dt className="font-semibold text-black">"Match"</dt><dd>A mutual connection formed when two Users express interest in each other.</dd></div>
        </dl>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s1" num="1">Eligibility and Acceptance</SectionTitle>
        <SubTitle>1.1 Age Requirement</SubTitle>
        <P>The App is intended exclusively for adults aged 18 and over. By registering, you confirm you meet this requirement. Unseen reserves the right to terminate any Account where there is reason to believe the User is under 18.</P>
        <SubTitle>1.2 Reporting Suspected Minors</SubTitle>
        <P>If you encounter a profile you believe belongs to a person under 18, report it immediately using the in-app reporting tools.</P>
        <SubTitle>1.3 Acceptance</SubTitle>
        <P>By using the App, you accept these Terms in their entirety and confirm you have the legal capacity to enter into a binding agreement.</P>
        <SubTitle>1.4 Changes to Terms</SubTitle>
        <P>Unseen may update these Terms from time to time. Where changes are material, we will notify you by email at least 30 days before they take effect. Continued use constitutes acceptance.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s2" num="2">Account Registration and Security</SectionTitle>
        <SubTitle>2.1 Account Creation</SubTitle>
        <P>You must provide accurate, current, and complete information when creating an Account and keep it up to date.</P>
        <SubTitle>2.2 Account Security</SubTitle>
        <P>You are responsible for maintaining the confidentiality of your login credentials and all activity under your Account. If you suspect unauthorised access, notify us at <A href="mailto:unseen-security@randenibezfiltru.cz">unseen-security@randenibezfiltru.cz</A>.</P>
        <SubTitle>2.3 One Account per Person</SubTitle>
        <P>Each User may maintain only one active Account. Creating multiple Accounts to circumvent a suspension is a violation of these Terms.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s3" num="3">Photo Verification</SectionTitle>
        <SubTitle>3.1 Mandatory Verification</SubTitle>
        <P>All Accounts must undergo photo verification before accessing matching or messaging features. This protects our community from impersonation and catfishing.</P>
        <SubTitle>3.2 Ongoing Verification Status</SubTitle>
        <P>Verification is tied to the photos submitted at the time of verification. You may add new photos without re-verification, provided at least one original Verification Photo remains on your profile. Removing all Verification Photos will result in Account suspension pending re-verification.</P>
        <SubTitle>3.3 Accuracy of Profile Photos</SubTitle>
        <P>All profile photos must be recent, accurate representations of your current appearance. Heavily filtered or misleading photos are not permitted.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s4" num="4">Subscriptions and Billing</SectionTitle>
        <SubTitle>4.1 Free and Paid Tiers</SubTitle>
        <P>Unseen offers both a free tier and paid Subscription tiers. Features of each tier are described within the App and are subject to change.</P>
        <SubTitle>4.2 Billing</SubTitle>
        <P>Subscription fees are billed in advance on a recurring basis. By subscribing, you authorise Unseen to charge your selected payment method.</P>
        <SubTitle>4.3 Cancellation</SubTitle>
        <P>You may cancel your Subscription at any time through your Account settings. Cancellation takes effect at the end of the current billing period.</P>
        <SubTitle>4.4 Refunds</SubTitle>
        <P>Subscription fees are generally non-refundable, except where required by law. EU residents may exercise a right of withdrawal within 14 days of purchase, unless paid features have already been used.</P>
        <SubTitle>4.5 Price Changes</SubTitle>
        <P>We may adjust pricing at any time with reasonable advance notice and an opportunity to cancel.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s5" num="5">Intellectual Property</SectionTitle>
        <SubTitle>5.1 Unseen&apos;s Rights</SubTitle>
        <P>The App, its design, software, and trademarks are the exclusive property of Ing. Nikol Jaterková, trading as Unseen, or its licensors.</P>
        <SubTitle>5.2 Your Content</SubTitle>
        <P>You retain ownership of Content you submit. By submitting Content, you grant Unseen a non-exclusive, worldwide, royalty-free licence to use, store, display, and process it solely for operating and improving the App.</P>
        <SubTitle>5.3 Content Restrictions</SubTitle>
        <P>You must not upload Content that infringes third-party intellectual property rights. Suspected infringement: <A href="mailto:unseen-legal@randenibezfiltru.cz">unseen-legal@randenibezfiltru.cz</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s6" num="6">User Conduct</SectionTitle>
        <P>Unseen is built on the principle that every person deserves to be treated with dignity.</P>
        <SubTitle>6.1 General Prohibitions</SubTitle>
        <P>You must not:</P>
        <UL>
          <li>Harass, threaten, intimidate, or abuse any other User.</li>
          <li>Post hate speech or discriminatory content based on race, gender, sexual orientation, religion, or other protected characteristics.</li>
          <li>Impersonate any person or entity.</li>
          <li>Use the App for solicitation, spam, or commercial promotion.</li>
          <li>Facilitate or encourage use of the App by anyone under 18.</li>
        </UL>
        <SubTitle>6.2 Screenshots and Sharing</SubTitle>
        <P>Screenshots may be shared to report or evidence abusive behaviour. You must not use them to publicly mock, shame, harass, dox, or identify another User without their consent.</P>
        <Note>The right to share evidence of misconduct is a deliberate feature of this platform. We trust our community to use it responsibly.</Note>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s7" num="7">Toxic Behaviour Protections</SectionTitle>
        <SubTitle>7.1 No Sexual Coercion or Pressure</SubTitle>
        <P>Zero tolerance for any form of sexual coercion, pressure, or manipulation. Violations result in immediate suspension.</P>
        <SubTitle>7.2 No Unsolicited Explicit Content</SubTitle>
        <P>You must not send unsolicited explicit images, videos, or messages. Explicit content may only be shared where both parties have clearly and actively consented.</P>
        <SubTitle>7.3 No Catfishing</SubTitle>
        <P>You must not deliberately misrepresent your identity, age, gender, or appearance. This operates alongside the verification requirements in Section 3.</P>
        <SubTitle>7.4 No Love Bombing or Emotional Manipulation</SubTitle>
        <P>Deliberate emotional manipulation, including love bombing, is prohibited and may result in Account termination.</P>
        <SubTitle>7.5 No Contact After Unmatching or Blocking</SubTitle>
        <P>If a User unmatches or blocks you, all contact must cease. Attempting to circumvent this via alternative Accounts is a serious violation.</P>
        <SubTitle>7.6 No Doxxing</SubTitle>
        <P>You must not seek, compile, share, or publish the personal information of another User without their explicit consent.</P>
        <SubTitle>7.7 Ghosting — A Community Standard</SubTitle>
        <Note>This is a community standard, not an enforceable rule.</Note>
        <P>Ghosting can cause real emotional harm. We encourage all users to practise direct, respectful communication.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s8" num="8">Privacy and Data</SectionTitle>
        <P>Our full Privacy Policy is at <A href="/privacy">/privacy</A> and forms part of these Terms.</P>
        <SubTitle>8.1 Data We Collect</SubTitle>
        <UL>
          <li>Identity and profile data: date of birth, photos, gender, and preferences.</li>
          <li>Contact data: email address.</li>
          <li>Location data: approximate city, where provided during onboarding.</li>
          <li>Behavioural data: swipe patterns, session duration, and feature usage.</li>
          <li>Communications: messages sent through the App.</li>
        </UL>
        <SubTitle>8.2 How We Use Your Data</SubTitle>
        <P>Only to operate and improve the App, verify identity, provide support, and investigate conduct. We do not sell your data or use it for advertising.</P>
        <SubTitle>8.3 Retention of Conversations</SubTitle>
        <P>Messages are stored and linked to your Account to enable safety investigations. Retention may continue after Account deletion where a report is pending.</P>
        <SubTitle>8.4 Your Rights</SubTitle>
        <P>Under GDPR, you have the right to access, correct, delete, and port your data. Contact <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>. We will respond within 30 days.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s9" num="9">Reporting and Enforcement</SectionTitle>
        <SubTitle>9.1 Reporting Tools</SubTitle>
        <P>Every profile and conversation includes reporting and blocking tools. Use them if you believe someone is violating these Terms.</P>
        <SubTitle>9.2 Investigations</SubTitle>
        <P>All reports are reviewed by Unseen. Investigations may involve reviewing messages, account history, and behaviour patterns. Reports are treated in confidence.</P>
        <SubTitle>9.3 Consequence Ladder</SubTitle>
        <OL>
          <li>Formal warning.</li>
          <li>Temporary suspension pending investigation.</li>
          <li>Permanent ban, including prohibition on new Accounts.</li>
          <li>Referral to law enforcement where conduct may be criminal.</li>
        </OL>
        <SubTitle>9.4 Right to Remove Content and Users</SubTitle>
        <P>Unseen reserves the right to remove Content or suspend Accounts that violate the letter or spirit of these Terms.</P>
        <SubTitle>9.5 No Guarantee of Third-Party Behaviour</SubTitle>
        <P>Unseen cannot guarantee the conduct of other Users. You interact with others at your own discretion.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s10" num="10">Mental Health and Vulnerable Users</SectionTitle>
        <SubTitle>10.1 No Exploitation of Vulnerability</SubTitle>
        <P>You must not target, manipulate, or exploit Users displaying signs of emotional distress or psychological vulnerability.</P>
        <SubTitle>10.2 No Harmful Content</SubTitle>
        <P>You must not share Content encouraging self-harm, suicide, or disordered eating.</P>
        <SubTitle>10.3 Crisis Resources</SubTitle>
        <UL>
          <li><strong className="text-black">ČR — Linka bezpečí:</strong> 116 111 (nonstop, free) · <A href="https://www.linkabezpeci.cz">linkabezpeci.cz</A></li>
          <li><strong className="text-black">ČR — Centrum krizové intervence:</strong> 284 016 666 (nonstop)</li>
          <li><strong className="text-black">SK — Linka dôvery Nezábudka:</strong> 0800 800 566 (nonstop, free)</li>
          <li><strong className="text-black">EU:</strong> <A href="https://www.befrienders.org">befrienders.org</A></li>
        </UL>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s11" num="11">Limitation of Liability</SectionTitle>
        <SubTitle>11.1 App Provided &ldquo;As Is&rdquo;</SubTitle>
        <P>The App is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind.</P>
        <SubTitle>11.2 Limitation of Liability</SubTitle>
        <P>To the fullest extent permitted by law, Unseen shall not be liable for indirect, incidental, or consequential damages. Where liability cannot be excluded, our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</P>
        <SubTitle>11.3 Consumer Rights</SubTitle>
        <P>Nothing in these Terms limits rights you have as a consumer under applicable EU or Czech law.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s12" num="12">Dispute Resolution</SectionTitle>
        <SubTitle>12.1 Informal Resolution</SubTitle>
        <P>Contact <A href="mailto:unseen-support@randenibezfiltru.cz">unseen-support@randenibezfiltru.cz</A> first. We aim to respond within 10 business days.</P>
        <SubTitle>12.2 Consumer Disputes</SubTitle>
        <P>Czech consumers may contact the Czech Trade Inspection Authority (<A href="https://www.coi.cz">coi.cz</A>). EU consumers may use the European Commission&apos;s ODR platform at <A href="https://ec.europa.eu/odr">ec.europa.eu/odr</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s13" num="13">Governing Law</SectionTitle>
        <P>These Terms are governed by the laws of the Czech Republic. Disputes are subject to the jurisdiction of Czech courts. Where mandatory consumer protection laws of your country offer greater protection, those laws apply.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s14" num="14">Account Termination</SectionTitle>
        <SubTitle>14.1 Termination by You</SubTitle>
        <P>You may delete your Account at any time in App settings. Your profile will be removed within 30 days. Certain data may be retained as described in Section 8.</P>
        <SubTitle>14.2 Termination by Unseen</SubTitle>
        <P>Unseen may suspend or terminate your Account at any time for breach of these Terms or behaviour harmful to other Users or the platform.</P>
        <SubTitle>14.3 Effect of Termination</SubTitle>
        <P>On termination, your access ceases immediately. Subscription fees for the remaining period will not be refunded except where required by law. Sections on intellectual property, data, liability, and disputes survive termination.</P>
      </section>
    </>
  );
}

function TermsCS() {
  return (
    <>
      <section className="space-y-3">
        <SectionTitle id="s-intro">Úvod</SectionTitle>
        <P>Vítejte v Unseen. Tyto Obchodní podmínky ("Podmínky") upravují váš přístup k mobilní aplikaci Unseen a souvisejícím službám (dále "Aplikace" nebo "Platforma"), provozovaným Ing. Nikol Jaterková, IČO: 23702681 ("Unseen", "my", "nás" nebo "naše").</P>
        <P>Vytvořením účtu nebo používáním Aplikace potvrzujete, že jste si tyto Podmínky přečetli, porozuměli jim a souhlasíte s jejich dodržováním. Pokud nesouhlasíte, nesmíte Aplikaci používat.</P>
        <P>Tyto Podmínky jsou primárně určeny uživatelům v Evropské unii a řídí se českým a unijním právem.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s-definitions">Definice</SectionTitle>
        <dl className="space-y-3 text-neutral-700">
          <div><dt className="font-semibold text-black">„Aplikace"</dt><dd>Mobilní aplikace Unseen, webová stránka (unseenapp.cz) a veškeré související služby.</dd></div>
          <div><dt className="font-semibold text-black">„Uživatel" / „vy"</dt><dd>Jakákoliv fyzická osoba, která si v Aplikaci vytvoří účet nebo ji používá.</dd></div>
          <div><dt className="font-semibold text-black">„Účet"</dt><dd>Registrovaný profil, který si Uživatel vytvoří pro přístup k Aplikaci.</dd></div>
          <div><dt className="font-semibold text-black">„Obsah"</dt><dd>Veškeré texty, obrázky, zprávy nebo jiný materiál vložený do Aplikace.</dd></div>
          <div><dt className="font-semibold text-black">„Předplatné"</dt><dd>Placená úroveň přístupu k prémiovým funkcím Aplikace.</dd></div>
          <div><dt className="font-semibold text-black">„Ověřovací fotografie"</dt><dd>Fotografie předložená Uživatelem při ověřování totožnosti.</dd></div>
          <div><dt className="font-semibold text-black">„Shoda"</dt><dd>Vzájemné propojení dvou Uživatelů, kteří si navzájem vyjádřili zájem.</dd></div>
        </dl>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s1" num="1">Způsobilost a přijetí podmínek</SectionTitle>
        <SubTitle>1.1 Věkový limit</SubTitle>
        <P>Aplikace je určena výhradně dospělým osobám starším 18 let. Registrací potvrzujete, že splňujete tento požadavek. Unseen si vyhrazuje právo zrušit Účet, pokud má důvod se domnívat, že Uživatel nesplňuje věkový limit.</P>
        <SubTitle>1.2 Nahlášení podezřelého nezletilého</SubTitle>
        <P>Pokud narazíte na profil, o němž máte důvod se domnívat, že patří osobě mladší 18 let, nahlaste jej neprodleně prostřednictvím nástrojů pro nahlašování v Aplikaci.</P>
        <SubTitle>1.3 Přijetí podmínek</SubTitle>
        <P>Používáním Aplikace přijímáte tyto Podmínky v plném rozsahu a potvrzujete, že máte právní způsobilost uzavřít závaznou smlouvu.</P>
        <SubTitle>1.4 Změny podmínek</SubTitle>
        <P>Unseen může tyto Podmínky čas od času aktualizovat. O podstatných změnách vás budeme informovat e-mailem nejméně 30 dní před jejich účinností. Další používání Aplikace po nabytí účinnosti změn představuje jejich přijetí.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s2" num="2">Registrace účtu a bezpečnost</SectionTitle>
        <SubTitle>2.1 Vytvoření účtu</SubTitle>
        <P>Při vytváření Účtu musíte poskytnout přesné, aktuální a úplné informace a udržovat je aktuální.</P>
        <SubTitle>2.2 Bezpečnost účtu</SubTitle>
        <P>Jste zodpovědní za zachování důvěrnosti přihlašovacích údajů a veškeré aktivity prováděné pod vaším Účtem. V případě podezření na neoprávněný přístup nás neprodleně kontaktujte na <A href="mailto:unseen-security@randenibezfiltru.cz">unseen-security@randenibezfiltru.cz</A>.</P>
        <SubTitle>2.3 Jeden účet na osobu</SubTitle>
        <P>Každý Uživatel smí mít pouze jeden aktivní Účet. Vytváření více účtů za účelem obejití pozastavení nebo zákazu je porušením těchto Podmínek.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s3" num="3">Ověření fotografií</SectionTitle>
        <SubTitle>3.1 Povinné ověření</SubTitle>
        <P>Všechny Účty musí projít ověřením fotografie před získáním přístupu k funkcím párování a zasílání zpráv. Tato podmínka chrání naši komunitu před vydáváním se za jinou osobu.</P>
        <SubTitle>3.2 Průběžný stav ověření</SubTitle>
        <P>Ověření se váže na fotografie předložené v době ověřování. Nové fotografie můžete přidávat bez opakovaného ověřování, pokud na profilu zůstane alespoň jedna původní Ověřovací fotografie. Odstraněním všech Ověřovacích fotografií dojde k pozastavení Účtu do doby opakovaného ověření.</P>
        <SubTitle>3.3 Přesnost profilových fotografií</SubTitle>
        <P>Všechny profilové fotografie musí být aktuálními a věrnými zobrazeními vaší současné podoby. Silně upravené nebo zavádějící fotografie nejsou povoleny.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s4" num="4">Předplatné a platby</SectionTitle>
        <SubTitle>4.1 Bezplatná a placená úroveň</SubTitle>
        <P>Unseen nabízí bezplatnou úroveň i placená Předplatná s rozšířenými funkcemi. Funkce jednotlivých úrovní jsou popsány v Aplikaci a mohou se měnit.</P>
        <SubTitle>4.2 Fakturace</SubTitle>
        <P>Poplatky za Předplatné se účtují předem opakovaně (měsíčně nebo ročně dle výběru). Přihlášením k odběru zmocňujete Unseen k účtování poplatků zvolenému způsobu platby.</P>
        <SubTitle>4.3 Zrušení</SubTitle>
        <P>Předplatné můžete kdykoli zrušit v nastavení Účtu. Zrušení nabývá účinnosti na konci aktuálního fakturačního období.</P>
        <SubTitle>4.4 Vrácení peněz</SubTitle>
        <P>Poplatky za Předplatné jsou zpravidla nevratné, s výjimkou případů stanovených zákonem. Spotřebitelé v EU mohou uplatnit právo na odstoupení od smlouvy do 14 dnů od nákupu, pokud prémiové funkce ještě nebyly využity.</P>
        <SubTitle>4.5 Změny cen</SubTitle>
        <P>Ceny Předplatného se mohou měnit. O zdražení vás budeme informovat s dostatečným předstihem s možností zrušení před účinností nové ceny.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s5" num="5">Duševní vlastnictví</SectionTitle>
        <SubTitle>5.1 Práva Unseen</SubTitle>
        <P>Aplikace, její design, software a ochranné známky jsou výhradním vlastnictvím Ing. Nikol Jaterková, provozující Unseen, nebo jejích poskytovatelů licence.</P>
        <SubTitle>5.2 Váš obsah</SubTitle>
        <P>Vložený Obsah zůstává vaším vlastnictvím. Vložením Obsahu udělujete Unseen nevýhradní, celosvětovou, bezúplatnou licenci k jeho použití, ukládání, zobrazování a zpracování výhradně za účelem provozování a zlepšování Aplikace.</P>
        <SubTitle>5.3 Omezení obsahu</SubTitle>
        <P>Nesmíte nahrávat Obsah porušující práva duševního vlastnictví třetích stran. V případě podezření na porušení nás kontaktujte na <A href="mailto:unseen-legal@randenibezfiltru.cz">unseen-legal@randenibezfiltru.cz</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s6" num="6">Chování uživatelů</SectionTitle>
        <P>Unseen je postaven na principu, že každý člověk si zaslouží důstojné zacházení.</P>
        <SubTitle>6.1 Obecné zákazy</SubTitle>
        <P>Je zakázáno:</P>
        <UL>
          <li>Obtěžovat, vyhrožovat, zastrašovat nebo zneužívat jakéhokoliv jiného Uživatele.</li>
          <li>Zveřejňovat nenávistný nebo diskriminační obsah na základě rasy, pohlaví, sexuální orientace, náboženství nebo jiných chráněných charakteristik.</li>
          <li>Vydávat se za jinou osobu nebo subjekt.</li>
          <li>Používat Aplikaci k soliciting, spamu nebo komerční propagaci.</li>
          <li>Umožňovat nebo podporovat používání Aplikace osobami mladšími 18 let.</li>
        </UL>
        <SubTitle>6.2 Snímky obrazovky a sdílení</SubTitle>
        <P>Snímky obrazovky smějí být sdíleny za účelem nahlášení nebo doložení nevhodného chování. Nesmíte je používat k veřejnému zesměšňování, obtěžování, doxingu nebo identifikaci jiného Uživatele bez jeho souhlasu.</P>
        <Note>Právo sdílet důkazy o porušení pravidel je záměrnou součástí fungování naší platformy. Věříme, že naše komunita bude toto právo využívat zodpovědně.</Note>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s7" num="7">Ochrana před toxickým chováním</SectionTitle>
        <SubTitle>7.1 Žádné sexuální nátlaky ani tlak</SubTitle>
        <P>Nulová tolerance pro jakoukoliv formu sexuálního nátlaku, tlaku nebo manipulace. Porušení má za následek okamžité pozastavení Účtu.</P>
        <SubTitle>7.2 Žádný nevyžádaný explicitní obsah</SubTitle>
        <P>Je zakázáno zasílat nevyžádané explicitní obrázky, videa nebo zprávy. Explicitní obsah lze sdílet pouze tehdy, pokud obě strany jasně a aktivně souhlasily.</P>
        <SubTitle>7.3 Žádné catfishing ani zkreslování identity</SubTitle>
        <P>Záměrné zkreslování vaší totožnosti, věku, pohlaví nebo vzhledu s úmyslem oklamat jiného Uživatele je zakázáno. Toto ustanovení doplňuje požadavky na ověření uvedené v části 3.</P>
        <SubTitle>7.4 Žádné love bombing ani emoční manipulace</SubTitle>
        <P>Záměrná emoční manipulace, včetně love bombingu, je zakázána a může vést ke zrušení Účtu.</P>
        <SubTitle>7.5 Žádný kontakt po odmatchování nebo blokování</SubTitle>
        <P>Pokud vás Uživatel odmatchuje nebo zablokuje, veškerý kontakt musí přestat. Pokusy o obejití tohoto opatření prostřednictvím jiných Účtů jsou závažným porušením těchto Podmínek.</P>
        <SubTitle>7.6 Žádný doxing</SubTitle>
        <P>Je zakázáno vyhledávat, shromažďovat, sdílet nebo zveřejňovat osobní údaje jiného Uživatele bez jeho výslovného souhlasu.</P>
        <SubTitle>7.7 Ghosting — komunitní standard</SubTitle>
        <Note>Toto je komunitní standard, nikoli vymahatelné pravidlo.</Note>
        <P>Ghosting — ukončení komunikace bez jakéhokoli vysvětlení — může způsobit skutečnou emocionální újmu. Vyzýváme všechny uživatele k přímé a respektující komunikaci.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s8" num="8">Soukromí a data</SectionTitle>
        <P>Naše Zásady ochrany osobních údajů jsou k dispozici na <A href="/privacy">/privacy</A> a tvoří součást těchto Podmínek.</P>
        <SubTitle>8.1 Data, která shromažďujeme</SubTitle>
        <UL>
          <li>Identifikační a profilové údaje: datum narození, fotografie, pohlaví a preference.</li>
          <li>Kontaktní údaje: e-mailová adresa.</li>
          <li>Lokační údaje: přibližné město zadané při registraci.</li>
          <li>Behaviorální data: vzorce swipování, délka relace a používání funkcí.</li>
          <li>Komunikace: zprávy odeslané prostřednictvím Aplikace.</li>
        </UL>
        <SubTitle>8.2 Jak vaše data používáme</SubTitle>
        <P>Výhradně k provozování a zlepšování Aplikace, ověřování totožnosti, zákaznické podpoře a vyšetřování nahlášeného chování. Vaše data neprodáváme ani je nevyužíváme k reklamním účelům.</P>
        <SubTitle>8.3 Uchovávání konverzací</SubTitle>
        <P>Zprávy jsou uchovávány a spojeny s vaším Účtem za účelem bezpečnostních vyšetřování. Uchovávání může pokračovat i po smazání Účtu, pokud probíhá šetření nahlášeného incidentu.</P>
        <SubTitle>8.4 Vaše práva</SubTitle>
        <P>Podle GDPR máte právo na přístup, opravu, výmaz a přenositelnost svých dat. Kontaktujte nás na <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>. Odpoovíme do 30 dnů.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s9" num="9">Nahlašování a vymáhání</SectionTitle>
        <SubTitle>9.1 Nástroje pro nahlašování</SubTitle>
        <P>Každý profil a každá konverzace obsahuje nástroje pro nahlašování a blokování. Použijte je, pokud se domníváte, že někdo porušuje tyto Podmínky.</P>
        <SubTitle>9.2 Vyšetřování</SubTitle>
        <P>Veškerá nahlášení jsou prověřována Unsenem. Vyšetřování může zahrnovat kontrolu zpráv, historii Účtu a vzorce chování. Nahlášení jsou považována za důvěrná.</P>
        <SubTitle>9.3 Stupně postihu</SubTitle>
        <OL>
          <li>Formální varování.</li>
          <li>Dočasné pozastavení Účtu po dobu vyšetřování.</li>
          <li>Trvalý zákaz přístupu k platformě, včetně zákazu vytvářet nové Účty.</li>
          <li>Předání orgánům činným v trestním řízení v případě podezření z trestného činu.</li>
        </OL>
        <SubTitle>9.4 Právo odstranit obsah a uživatele</SubTitle>
        <P>Unseen si vyhrazuje právo odstranit Obsah nebo pozastavit Účty, které porušují literu nebo ducha těchto Podmínek.</P>
        <SubTitle>9.5 Žádná záruka za chování třetích stran</SubTitle>
        <P>Unseen nemůže zaručit chování ostatních Uživatelů. Interakce s ostatními probíhají na vaše vlastní uvážení.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s10" num="10">Duševní zdraví a zranitelní uživatelé</SectionTitle>
        <SubTitle>10.1 Žádné zneužívání zranitelnosti</SubTitle>
        <P>Je zakázáno cíleně manipulovat nebo zneužívat Uživatele, kteří projevují známky emočních potíží nebo psychologické zranitelnosti.</P>
        <SubTitle>10.2 Žádný škodlivý obsah</SubTitle>
        <P>Je zakázáno sdílet Obsah podporující sebepoškozování, sebevraždu nebo poruchy příjmu potravy.</P>
        <SubTitle>10.3 Krizové linky</SubTitle>
        <UL>
          <li><strong className="text-black">ČR — Linka bezpečí:</strong> 116 111 (nonstop, zdarma) · <A href="https://www.linkabezpeci.cz">linkabezpeci.cz</A></li>
          <li><strong className="text-black">ČR — Centrum krizové intervence:</strong> 284 016 666 (nonstop)</li>
          <li><strong className="text-black">SK — Linka dôvery Nezábudka:</strong> 0800 800 566 (nonstop, zdarma)</li>
          <li><strong className="text-black">EU:</strong> <A href="https://www.befrienders.org">befrienders.org</A></li>
        </UL>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s11" num="11">Omezení odpovědnosti</SectionTitle>
        <SubTitle>11.1 Aplikace poskytována „tak jak je"</SubTitle>
        <P>Aplikace je poskytována „tak jak je" a „dle dostupnosti" bez jakýchkoli záruk.</P>
        <SubTitle>11.2 Omezení odpovědnosti</SubTitle>
        <P>V rozsahu povoleném zákonem nenese Unseen odpovědnost za nepřímé, náhodné nebo následné škody. Tam, kde nelze odpovědnost vyloučit, je celková odpovědnost Unseen omezena na částku, kterou jste zaplatili v 12 měsících předcházejících vzniku nároku.</P>
        <SubTitle>11.3 Práva spotřebitelů</SubTitle>
        <P>Nic v těchto Podmínkách neomezuje práva, která máte jako spotřebitel podle platného práva EU nebo ČR.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s12" num="12">Řešení sporů</SectionTitle>
        <SubTitle>12.1 Neformální řešení</SubTitle>
        <P>Kontaktujte nás nejprve na <A href="mailto:unseen-support@randenibezfiltru.cz">unseen-support@randenibezfiltru.cz</A>. Snažíme se odpovědět do 10 pracovních dnů.</P>
        <SubTitle>12.2 Spotřebitelské spory</SubTitle>
        <P>Čeští spotřebitelé se mohou obrátit na Českou obchodní inspekci (<A href="https://www.coi.cz">coi.cz</A>). Spotřebitelé v EU mohou využít platformu pro online řešení sporů Evropské komise na <A href="https://ec.europa.eu/odr">ec.europa.eu/odr</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s13" num="13">Rozhodné právo</SectionTitle>
        <P>Tyto Podmínky se řídí právem České republiky. Spory podléhají příslušnosti českých soudů. Pokud povinné spotřebitelské předpisy vaší země poskytují vyšší ochranu, uplatní se v příslušném rozsahu tato pravidla.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="s14" num="14">Zrušení účtu</SectionTitle>
        <SubTitle>14.1 Zrušení z vaší strany</SubTitle>
        <P>Svůj Účet můžete kdykoli smazat v nastavení Aplikace. Váš profil bude odstraněn do 30 dnů. Určitá data mohou být uchována dle části 8.</P>
        <SubTitle>14.2 Zrušení ze strany Unseen</SubTitle>
        <P>Unseen může kdykoli pozastavit nebo zrušit váš Účet z důvodu porušení těchto Podmínek nebo chování škodlivého pro ostatní Uživatele nebo platformu.</P>
        <SubTitle>14.3 Důsledky zrušení</SubTitle>
        <P>Po zrušení váš přístup k Aplikaci okamžitě zaniká. Poplatky za zbývající část fakturačního období se nevrací, s výjimkou případů vyžadovaných zákonem. Ustanovení o duševním vlastnictví, datech, odpovědnosti a sporech zůstávají v platnosti i po zrušení.</P>
      </section>
    </>
  );
}

export default function TermsPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const isCS = locale === "cs";

  const tocEN = [
    ["s-intro", "Introduction"], ["s-definitions", "Definitions"],
    ["s1", "Eligibility & Acceptance"], ["s2", "Account Registration & Security"],
    ["s3", "Photo Verification"], ["s4", "Subscriptions & Billing"],
    ["s5", "Intellectual Property"], ["s6", "User Conduct"],
    ["s7", "Toxic Behaviour Protections"], ["s8", "Privacy & Data"],
    ["s9", "Reporting & Enforcement"], ["s10", "Mental Health & Vulnerable Users"],
    ["s11", "Limitation of Liability"], ["s12", "Dispute Resolution"],
    ["s13", "Governing Law"], ["s14", "Account Termination"],
  ];

  const tocCS = [
    ["s-intro", "Úvod"], ["s-definitions", "Definice"],
    ["s1", "Způsobilost a přijetí podmínek"], ["s2", "Registrace účtu a bezpečnost"],
    ["s3", "Ověření fotografií"], ["s4", "Předplatné a platby"],
    ["s5", "Duševní vlastnictví"], ["s6", "Chování uživatelů"],
    ["s7", "Ochrana před toxickým chováním"], ["s8", "Soukromí a data"],
    ["s9", "Nahlašování a vymáhání"], ["s10", "Duševní zdraví a zranitelní uživatelé"],
    ["s11", "Omezení odpovědnosti"], ["s12", "Řešení sporů"],
    ["s13", "Rozhodné právo"], ["s14", "Zrušení účtu"],
  ];

  const toc = isCS ? tocCS : tocEN;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-500 text-lg" aria-label={t("common.back")}>←</button>
        <img src="/brand/icononly_transparent_nobuffer.png" alt="Unseen" className="h-7 w-auto object-contain" />
        <h1 className="text-lg font-semibold flex-1">{t("terms.heading")}</h1>
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
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">
            {t("terms.effective_date")} 25. 5. 2026 · {t("terms.version")}
          </p>
          <p className="text-sm text-neutral-500">{t("terms.applicable")}</p>
        </div>

        <nav aria-label={t("terms.contents")} className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">{t("terms.contents")}</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-neutral-700">
            {toc.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="hover:text-[#E0175C]">{label}</a></li>
            ))}
          </ol>
        </nav>

        {isCS ? <TermsCS /> : <TermsEN />}

        <footer className="pt-8 pb-2 text-sm text-neutral-500 text-center border-t border-neutral-200">
          <p>{isCS ? "Dotazy?" : "Questions?"} <A href="mailto:unseen-legal@randenibezfiltru.cz">unseen-legal@randenibezfiltru.cz</A></p>
          <p className="mt-1">© 2026 Ing. Nikol Jaterková, IČO: 23702681, provozující Unseen (unseenapp.cz)</p>
        </footer>

        <div className="pt-2">
          <button onClick={() => router.back()} className="w-full py-4 rounded-full border font-medium">
            {t("common.back")}
          </button>
        </div>
      </div>
    </main>
  );
}
