import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Bodoni_Moda, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

// Neutral geometric grotesk (a free Söhne / Neue Haas Grotesk stand-in) - the
// professional-finance body voice that doesn't compete with the display serif.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

// High-contrast Didone display serif that echoes the AKΨ crest lettering.
const bodoni = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

// Cinematic hero serif (Instrument Serif ships regular + italic only).
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});


const SITE_TITLE = "Alpha Kappa Psi - Omicron Tau Chapter | Rutgers University";
const SITE_DESC =
  "The Omicron Tau chapter of Alpha Kappa Psi at Rutgers University - a co-ed professional business fraternity balancing professional development and lifelong brotherhood.";

export const metadata: Metadata = {
  metadataBase: new URL("https://rutgersakpsi.com"),
  title: {
    default: SITE_TITLE,
    template: "%s | AKΨ Omicron Tau",
  },
  description: SITE_DESC,
  alternates: { canonical: "/" },
  keywords: [
    "Alpha Kappa Psi",
    "AKPsi",
    "Omicron Tau",
    "Rutgers University",
    "business fraternity",
    "professional fraternity",
    "rush",
    "recruitment",
  ],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    type: "website",
    siteName: "AKΨ Omicron Tau",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AKΨ Omicron Tau",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a2744",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${bodoni.variable} ${instrument.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink">
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
