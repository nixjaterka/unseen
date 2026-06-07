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

function PrivacyEN() {
  return (
    <>
      <section className="space-y-3">
        <SectionTitle id="p-intro">Introduction</SectionTitle>
        <P>This Privacy Policy explains how Unseen collects, uses, stores, shares, and protects your personal data when you use the Unseen mobile application and related services (the "App").</P>
        <P>We are committed to handling your data with care, transparency, and respect. By creating an Account or using the App, you confirm that you have read and understood how we process your personal data.</P>
        <P>This Policy should be read alongside our Terms and Conditions at <A href="/terms">/terms</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p1" num="1">Who We Are</SectionTitle>
        <P>The data controller responsible for your personal data is Ing. Nikol Jaterková, IČO: 23702681, operating the Unseen app at unseenapp.cz. For any privacy-related questions, contact us at <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
        <Note>As a small independent operator, we do not have a formally appointed Data Protection Officer. All privacy queries go directly to the operator via the email above.</Note>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p2" num="2">Data We Collect</SectionTitle>
        <SubTitle>2.1 Data You Provide Directly</SubTitle>
        <UL>
          <li>Identity data: date of birth, gender, and preferences.</li>
          <li>Contact data: email address.</li>
          <li>Profile data: photos and any other information you add to your profile.</li>
          <li>Verification data: photos submitted for identity verification.</li>
          <li>Communications: messages, reports, and other content sent through the App.</li>
          <li>Payment data: billing information processed via Stripe (we do not store card details directly).</li>
        </UL>
        <SubTitle>2.2 Data Collected Automatically</SubTitle>
        <UL>
          <li>Location data: approximate city, where provided during onboarding.</li>
          <li>Behavioural data: swipe patterns, feature interactions, session duration, and match activity.</li>
          <li>Device data: device type, OS version, app version, and unique device identifiers.</li>
          <li>Log data: IP address, access timestamps, and error logs.</li>
        </UL>
        <SubTitle>2.3 Data We Do Not Collect</SubTitle>
        <P>We do not intentionally collect sensitive categories of personal data beyond what is inherent to a dating app (such as gender preferences). We encourage you not to share health, political, or religious information unless you are comfortable with it being stored.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p3" num="3">How We Use Your Data</SectionTitle>
        <P>We use your personal data only for the purposes below. We do not sell it or use it for advertising.</P>
        <SubTitle>3.1 To Provide and Improve the App</SubTitle>
        <UL>
          <li>Creating and managing your Account.</li>
          <li>Enabling matching, messaging, and other core features.</li>
          <li>Photo verification to protect the community from impersonation.</li>
          <li>Analysing usage patterns to improve features and performance.</li>
        </UL>
        <SubTitle>3.2 For Safety and Enforcement</SubTitle>
        <UL>
          <li>Investigating reports of abusive or prohibited conduct.</li>
          <li>Detecting and preventing fraud and misuse.</li>
          <li>Retaining conversation data to support safety investigations (see Section 6).</li>
          <li>Cooperating with law enforcement where required by law.</li>
        </UL>
        <SubTitle>3.3 For Communications</SubTitle>
        <UL>
          <li>Transactional emails: account confirmations, safety alerts, match notifications, and policy updates.</li>
          <li>Marketing communications, but only if you have opted in (see Section 9).</li>
        </UL>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p4" num="4">Legal Bases for Processing (EU Users)</SectionTitle>
        <UL>
          <li><strong className="text-black">Performance of a contract:</strong> account creation, matching, messaging, and billing.</li>
          <li><strong className="text-black">Legitimate interests:</strong> safety investigations, fraud prevention, and App improvement — where these do not override your fundamental rights.</li>
          <li><strong className="text-black">Legal obligation:</strong> retaining data to comply with applicable Czech and EU law.</li>
          <li><strong className="text-black">Consent:</strong> marketing emails and any processing you voluntarily enable. Consent may be withdrawn at any time.</li>
        </UL>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p5" num="5">Data Sharing and Third Parties</SectionTitle>
        <P>We do not sell your personal data. We share it only as described below.</P>
        <SubTitle>5.1 Service Providers (Data Processors)</SubTitle>
        <UL>
          <li><strong className="text-black">Supabase:</strong> database and authentication infrastructure.</li>
          <li><strong className="text-black">Vercel:</strong> application hosting and deployment.</li>
          <li><strong className="text-black">Stripe:</strong> payment processing for Subscriptions.</li>
          <li><strong className="text-black">Resend:</strong> transactional and notification email delivery.</li>
        </UL>
        <P>A current list of sub-processors is available on request at <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
        <SubTitle>5.2 Legal Disclosure</SubTitle>
        <P>We may disclose personal data to law enforcement or courts where required by law or to protect the safety of any person.</P>
        <SubTitle>5.3 Business Transfers</SubTitle>
        <P>If Unseen is sold or its assets transferred, your personal data may pass to the acquiring party. We will notify you and explain your options.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p6" num="6">Data Retention</SectionTitle>
        <SubTitle>6.1 General Retention</SubTitle>
        <P>We retain your personal data for as long as your Account is active. When you delete your Account, your profile is removed within 30 days.</P>
        <SubTitle>6.2 Conversation Data</SubTitle>
        <P>Messages are stored and linked to your Account to enable safety investigations. Retention may continue after Account deletion where an investigation is pending or we have a legal obligation.</P>
        <Note>GDPR Note: We retain conversation data under legitimate interests (community safety) and legal obligation. Retained data is accessed only for safety investigation purposes.</Note>
        <SubTitle>6.3 Financial Records</SubTitle>
        <P>Billing and transaction records are retained for a minimum of five years to comply with Czech financial and tax law.</P>
        <SubTitle>6.4 Safety Records</SubTitle>
        <P>Records relating to serious conduct violations and bans may be retained indefinitely to prevent circumvention.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p7" num="7">International Data Transfers</SectionTitle>
        <P>Your data may be processed outside the EEA by our service providers (including Supabase and Vercel, which operate infrastructure in the USA and EU). Where we transfer data outside the EEA, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission.</P>
        <P>Details of transfer safeguards are available on request: <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p8" num="8">Your Rights</SectionTitle>
        <UL>
          <li><strong className="text-black">Access:</strong> request a copy of the personal data we hold about you.</li>
          <li><strong className="text-black">Rectification:</strong> request correction of inaccurate data.</li>
          <li><strong className="text-black">Erasure:</strong> request deletion, subject to retention obligations in Section 6.</li>
          <li><strong className="text-black">Restriction:</strong> request that we limit how we use your data.</li>
          <li><strong className="text-black">Portability:</strong> receive your data in a structured, machine-readable format.</li>
          <li><strong className="text-black">Object:</strong> object to processing based on legitimate interests.</li>
        </UL>
        <P>Contact <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A> to exercise your rights. We will respond within 30 days. You also have the right to complain to the Czech data protection authority:</P>
        <P>Úřad pro ochranu osobních údajů (ÚOOÚ) · <A href="https://www.uoou.cz">uoou.cz</A> · posta@uoou.cz · +420 234 514 111</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p9" num="9">Marketing Communications</SectionTitle>
        <P>We only send marketing emails if you have explicitly opted in. You may unsubscribe at any time via the link in any marketing email or through your Account settings. Transactional and safety emails (match notifications, account confirmations) are always sent regardless of marketing preferences.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p10" num="10">Cookies and Tracking</SectionTitle>
        <P>The App uses cookies for authentication (to keep you logged in) and performance monitoring (to detect errors). We do not use cookies for advertising or cross-site tracking. You can manage cookie preferences through the cookie banner in the App.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p11" num="11">Children&apos;s Privacy</SectionTitle>
        <P>The App is not intended for persons under 18. If we become aware we have collected data from a minor, we will delete it promptly. To report a suspected minor&apos;s Account: <A href="mailto:unseen-safety@randenibezfiltru.cz">unseen-safety@randenibezfiltru.cz</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p12" num="12">Data Security</SectionTitle>
        <P>We implement technical and organisational measures to protect your data, including encryption in transit and at rest, access controls, and Row Level Security on our database. In the event of a data breach, we will notify you and the relevant authorities as required by law.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p13" num="13">Changes to This Policy</SectionTitle>
        <P>We may update this Policy from time to time. Where changes are material, we will notify you by email at least 30 days before they take effect. Continued use constitutes acknowledgement of the revised Policy.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p14" num="14">Contact Us</SectionTitle>
        <UL>
          <li><strong className="text-black">Email:</strong> <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A></li>
          <li><strong className="text-black">Operator:</strong> Ing. Nikol Jaterková, IČO: 23702681</li>
        </UL>
        <p className="text-xs text-neutral-400">Registered address is on file in the Czech business register and available on request.</p>
      </section>
    </>
  );
}

function PrivacyCS() {
  return (
    <>
      <section className="space-y-3">
        <SectionTitle id="p-intro">Úvod</SectionTitle>
        <P>Tyto Zásady ochrany osobních údajů vysvětlují, jak Unseen shromažďuje, používá, ukládá, sdílí a chrání vaše osobní údaje při používání mobilní aplikace Unseen a souvisejících služeb ("Aplikace").</P>
        <P>Zavazujeme se nakládat s vašimi údaji s péčí, transparentností a respektem. Vytvořením Účtu nebo používáním Aplikace potvrzujete, že jste si přečetli a pochopili způsob, jakým zpracováváme vaše osobní údaje.</P>
        <P>Tyto Zásady je třeba číst společně s Obchodními podmínkami dostupnými na <A href="/terms">/terms</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p1" num="1">Kdo jsme</SectionTitle>
        <P>Správcem osobních údajů je Ing. Nikol Jaterková, IČO: 23702681, provozující aplikaci Unseen na unseenapp.cz. V případě jakýchkoli dotazů ohledně ochrany osobních údajů nás kontaktujte na <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
        <Note>Jako malý nezávislý provozovatel nemáme formálně jmenovaného pověřence pro ochranu osobních údajů. Veškeré dotazy týkající se soukromí zasílejte přímo provozovatelce prostřednictvím výše uvedeného e-mailu.</Note>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p2" num="2">Jaké údaje shromažďujeme</SectionTitle>
        <SubTitle>2.1 Údaje, které nám poskytnete přímo</SubTitle>
        <UL>
          <li>Identifikační údaje: datum narození, pohlaví a preference.</li>
          <li>Kontaktní údaje: e-mailová adresa.</li>
          <li>Profilové údaje: fotografie a další informace přidané do profilu.</li>
          <li>Ověřovací údaje: fotografie předložené pro účely ověření totožnosti.</li>
          <li>Komunikace: zprávy, nahlášení a další obsah zaslaný prostřednictvím Aplikace.</li>
          <li>Platební údaje: fakturační informace zpracované přes Stripe (čísla karet neukládáme přímo).</li>
        </UL>
        <SubTitle>2.2 Automaticky shromažďované údaje</SubTitle>
        <UL>
          <li>Lokační údaje: přibližné město zadané při registraci.</li>
          <li>Behaviorální data: vzorce swipování, interakce s funkcemi, délka relace a aktivita shod.</li>
          <li>Data o zařízení: typ zařízení, verze OS, verze aplikace a identifikátory zařízení.</li>
          <li>Protokolové záznamy: IP adresa, časová razítka přístupu a záznamy chyb.</li>
        </UL>
        <SubTitle>2.3 Data, která záměrně neshromažďujeme</SubTitle>
        <P>Záměrně neshromažďujeme zvláštní kategorie osobních údajů nad rámec toho, co je součástí fungování zoznamovací aplikace (jako jsou genderové preference). Doporučujeme vám nesdílet zdravotní, politické nebo náboženské informace, pokud s jejich uchováváním nesouhlasíte.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p3" num="3">Jak vaše údaje používáme</SectionTitle>
        <P>Vaše osobní údaje používáme výhradně pro níže uvedené účely. Neprodáváme je ani je nevyužíváme k reklamním účelům.</P>
        <SubTitle>3.1 K poskytování a zlepšování Aplikace</SubTitle>
        <UL>
          <li>Vytváření a správa vašeho Účtu.</li>
          <li>Funkce párování, zasílání zpráv a další základní funkce.</li>
          <li>Ověření fotografií za účelem ochrany komunity před vydáváním se za jinou osobu.</li>
          <li>Analýza vzorců používání za účelem zlepšování funkcí a výkonu.</li>
        </UL>
        <SubTitle>3.2 Pro bezpečnost a vymáhání pravidel</SubTitle>
        <UL>
          <li>Vyšetřování nahlášeného nevhodného nebo zakázaného chování.</li>
          <li>Odhalování a prevence podvodů a zneužití.</li>
          <li>Uchovávání dat konverzací pro bezpečnostní vyšetřování (viz část 6).</li>
          <li>Spolupráce s orgány činnými v trestním řízení, pokud to vyžaduje zákon.</li>
        </UL>
        <SubTitle>3.3 Pro komunikaci</SubTitle>
        <UL>
          <li>Transakční e-maily: potvrzení účtu, bezpečnostní upozornění, notifikace o shodách a aktualizace zásad.</li>
          <li>Marketingová sdělení, pouze pokud jste k jejich odběru udělili souhlas (viz část 9).</li>
        </UL>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p4" num="4">Právní základy zpracování (uživatelé v EU)</SectionTitle>
        <UL>
          <li><strong className="text-black">Plnění smlouvy:</strong> vytvoření Účtu, párování, zasílání zpráv a fakturace.</li>
          <li><strong className="text-black">Oprávněné zájmy:</strong> bezpečnostní vyšetřování, prevence podvodů a zlepšování Aplikace — tam, kde tyto zájmy nepřevažují nad vašimi základními právy.</li>
          <li><strong className="text-black">Právní povinnost:</strong> uchovávání dat v souladu s platným českým a unijním právem.</li>
          <li><strong className="text-black">Souhlas:</strong> marketingové e-maily a veškeré zpracování, které dobrovolně povolíte. Souhlas lze kdykoli odvolat.</li>
        </UL>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p5" num="5">Sdílení dat a třetí strany</SectionTitle>
        <P>Vaše osobní údaje neprodáváme. Sdílíme je pouze v níže popsaných případech.</P>
        <SubTitle>5.1 Poskytovatelé služeb (zpracovatelé dat)</SubTitle>
        <UL>
          <li><strong className="text-black">Supabase:</strong> databázová a autentizační infrastruktura.</li>
          <li><strong className="text-black">Vercel:</strong> hostování a nasazování aplikace.</li>
          <li><strong className="text-black">Stripe:</strong> zpracování plateb za Předplatné.</li>
          <li><strong className="text-black">Resend:</strong> doručování transakčních a notifikačních e-mailů.</li>
        </UL>
        <P>Aktuální seznam zpracovatelů je dostupný na vyžádání: <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
        <SubTitle>5.2 Zákonné zpřístupnění</SubTitle>
        <P>Osobní údaje můžeme zpřístupnit orgánům činným v trestním řízení nebo soudům, pokud to vyžaduje zákon nebo je to nezbytné pro ochranu bezpečnosti osob.</P>
        <SubTitle>5.3 Obchodní převody</SubTitle>
        <P>V případě prodeje Unseen nebo převodu jeho aktiv mohou být vaše osobní údaje předány nabyvateli. O takovém převodu vás budeme informovat a sdělíme vám vaše možnosti.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p6" num="6">Uchovávání dat</SectionTitle>
        <SubTitle>6.1 Obecná doba uchovávání</SubTitle>
        <P>Vaše osobní údaje uchováváme po dobu, kdy je váš Účet aktivní. Po smazání Účtu bude váš profil odstraněn do 30 dnů.</P>
        <SubTitle>6.2 Data konverzací</SubTitle>
        <P>Zprávy jsou uchovávány a spojeny s vaším Účtem za účelem bezpečnostních vyšetřování. Uchovávání může pokračovat i po smazání Účtu, pokud probíhá vyšetřování nebo existuje zákonná povinnost.</P>
        <Note>GDPR: Data konverzací uchováváme na základě oprávněných zájmů (bezpečnost komunity) a zákonné povinnosti. K uchovávaným datům se přistupuje výhradně pro účely bezpečnostních vyšetřování.</Note>
        <SubTitle>6.3 Finanční záznamy</SubTitle>
        <P>Fakturační a transakční záznamy jsou uchovávány minimálně pět let v souladu s českým finančním a daňovým právem.</P>
        <SubTitle>6.4 Bezpečnostní záznamy</SubTitle>
        <P>Záznamy o závažných porušeních pravidel chování a zákazech mohou být uchovávány na dobu neurčitou, aby bylo zabráněno obcházení opatření.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p7" num="7">Mezinárodní přenosy dat</SectionTitle>
        <P>Vaše data mohou být zpracovávána mimo Evropský hospodářský prostor (EHP) poskytovateli služeb (včetně Supabase a Vercel, kteří provozují infrastrukturu v USA a EU). Při přenosu dat mimo EHP se opíráme o standardní smluvní doložky (SCC) schválené Evropskou komisí.</P>
        <P>Podrobnosti o zárukách přenosu jsou dostupné na vyžádání: <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p8" num="8">Vaše práva</SectionTitle>
        <UL>
          <li><strong className="text-black">Přístup:</strong> vyžádat si kopii osobních údajů, které o vás uchováváme.</li>
          <li><strong className="text-black">Oprava:</strong> požádat o opravu nepřesných údajů.</li>
          <li><strong className="text-black">Výmaz:</strong> požádat o smazání dat, s výhradou povinností uchovávání v části 6.</li>
          <li><strong className="text-black">Omezení:</strong> požádat o omezení způsobu, jakým vaše data používáme.</li>
          <li><strong className="text-black">Přenositelnost:</strong> obdržet vaše data ve strukturovaném, strojově čitelném formátu.</li>
          <li><strong className="text-black">Námitka:</strong> vznést námitku proti zpracování na základě oprávněných zájmů.</li>
        </UL>
        <P>Kontaktujte nás na <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>. Odpovíme do 30 dnů. Máte také právo podat stížnost u českého dozorového úřadu:</P>
        <P>Úřad pro ochranu osobních údajů (ÚOOÚ) · <A href="https://www.uoou.cz">uoou.cz</A> · posta@uoou.cz · +420 234 514 111</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p9" num="9">Marketingová sdělení</SectionTitle>
        <P>Marketingové e-maily zasíláme pouze v případě, že jste k jejich odběru výslovně udělili souhlas. Odhlásit se můžete kdykoli kliknutím na odkaz v e-mailu nebo v nastavení Účtu. Transakční a bezpečnostní e-maily (notifikace o shodách, potvrzení účtu) zasíláme vždy bez ohledu na marketingové preference.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p10" num="10">Cookies a sledovací technologie</SectionTitle>
        <P>Aplikace používá cookies pro autentizaci (pro udržení přihlášení) a sledování výkonu (pro detekci chyb). Cookies pro reklamní účely ani cross-site sledování nepoužíváme. Nastavení cookies lze spravovat prostřednictvím lišty cookies v Aplikaci.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p11" num="11">Soukromí dětí</SectionTitle>
        <P>Aplikace není určena osobám mladším 18 let. Pokud zjistíme, že jsme shromáždili údaje od nezletilého, okamžitě je smažeme. Podezřelé účty nezletilých nahlaste na <A href="mailto:unseen-safety@randenibezfiltru.cz">unseen-safety@randenibezfiltru.cz</A>.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p12" num="12">Bezpečnost dat</SectionTitle>
        <P>Implementujeme technická a organizační opatření k ochraně vašich dat, včetně šifrování při přenosu i v klidovém stavu, řízení přístupu a zabezpečení na úrovni řádků databáze. V případě narušení bezpečnosti dat vás a příslušné úřady informujeme v souladu se zákonem.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p13" num="13">Změny těchto zásad</SectionTitle>
        <P>Tyto Zásady mohou být čas od času aktualizovány. O podstatných změnách vás budeme informovat e-mailem nejméně 30 dnů před jejich účinností. Další používání Aplikace po nabytí účinnosti změn představuje jejich přijetí.</P>
      </section>

      <section className="space-y-3">
        <SectionTitle id="p14" num="14">Kontaktujte nás</SectionTitle>
        <UL>
          <li><strong className="text-black">E-mail:</strong> <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A></li>
          <li><strong className="text-black">Provozovatel:</strong> Ing. Nikol Jaterková, IČO: 23702681</li>
        </UL>
        <p className="text-xs text-neutral-400">Adresa sídla je evidována v živnostenském rejstříku a je dostupná na vyžádání.</p>
        <P>Pokud nebudete spokojeni s naší odpovědí, máte právo podat stížnost u ÚOOÚ (viz část 8).</P>
      </section>
    </>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const isCS = locale === "cs";

  const tocEN = [
    ["p-intro", "Introduction"], ["p1", "Who We Are"], ["p2", "Data We Collect"],
    ["p3", "How We Use Your Data"], ["p4", "Legal Bases for Processing"],
    ["p5", "Data Sharing & Third Parties"], ["p6", "Data Retention"],
    ["p7", "International Data Transfers"], ["p8", "Your Rights"],
    ["p9", "Marketing Communications"], ["p10", "Cookies & Tracking"],
    ["p11", "Children's Privacy"], ["p12", "Data Security"],
    ["p13", "Changes to This Policy"], ["p14", "Contact Us"],
  ];

  const tocCS = [
    ["p-intro", "Úvod"], ["p1", "Kdo jsme"], ["p2", "Jaké údaje shromažďujeme"],
    ["p3", "Jak vaše údaje používáme"], ["p4", "Právní základy zpracování"],
    ["p5", "Sdílení dat a třetí strany"], ["p6", "Uchovávání dat"],
    ["p7", "Mezinárodní přenosy dat"], ["p8", "Vaše práva"],
    ["p9", "Marketingová sdělení"], ["p10", "Cookies a sledovací technologie"],
    ["p11", "Soukromí dětí"], ["p12", "Bezpečnost dat"],
    ["p13", "Změny těchto zásad"], ["p14", "Kontaktujte nás"],
  ];

  const toc = isCS ? tocCS : tocEN;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-500 text-lg" aria-label={t("common.back")}>←</button>
        <img src="/brand/icononly_transparent_nobuffer.png" alt="Unseen" className="h-7 w-auto object-contain" />
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
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">
            {t("privacy.effective_date")} 25. 5. 2026 · {t("privacy.version")}
          </p>
          <p className="text-sm text-neutral-500">{t("privacy.applicable")}</p>
          <p className="text-sm text-neutral-500">
            {isCS ? "Správce údajů" : "Data controller"}: Ing. Nikol Jaterková, IČO: 23702681 · <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A>
          </p>
        </div>

        <nav aria-label={t("privacy.contents")} className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">{t("privacy.contents")}</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-neutral-700">
            {toc.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="hover:text-[#E0175C]">{label}</a></li>
            ))}
          </ol>
        </nav>

        {isCS ? <PrivacyCS /> : <PrivacyEN />}

        <footer className="pt-8 pb-2 text-sm text-neutral-500 text-center border-t border-neutral-200">
          <p>{isCS ? "Dotazy?" : "Questions?"} <A href="mailto:unseen-privacy@randenibezfiltru.cz">unseen-privacy@randenibezfiltru.cz</A></p>
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
