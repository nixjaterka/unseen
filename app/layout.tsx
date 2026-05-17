import "./globals.css";
import { Nunito, Nunito_Sans } from "next/font/google";
import { I18nProvider } from "../lib/i18n/I18nProvider";
import CookieBanner from "./components/CookieBanner";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600"],
  variable: "--font-nunito-sans",
  display: "swap",
});

export const metadata = {
  title: "Unseen",
  description: "Match on photos. Talk without seeing who. Meet to find out.",
  metadataBase: new URL("https://unseenapp.cz"),
  openGraph: {
    title: "Unseen",
    description: "Match on photos. Talk without seeing who. Meet to find out.",
    url: "https://unseenapp.cz",
    siteName: "Unseen",
    images: [{ url: "/brand/icononly_transparent_nobuffer.png", width: 1280, height: 1280, alt: "Unseen" }],
    type: "website",
  },
  twitter: {
    card: "summary" as const,
    title: "Unseen",
    description: "Match on photos. Talk without seeing who. Meet to find out.",
    images: ["/brand/icononly_transparent_nobuffer.png"],
  },
  manifest: "/manifest.json",
  themeColor: "#E0175C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${nunitoSans.variable}`}>
      <body className="bg-[#FAF3EE] text-[#1C1410] antialiased">
        {/* Centred container — mobile fills screen, desktop shows cream gutters */}
        <div className="mx-auto w-full max-w-[480px] min-h-screen relative">
          <I18nProvider>
            {children}
            <CookieBanner />
          </I18nProvider>
        </div>
      </body>
    </html>
  );
}