import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pradip's Homeo — Personal Digital Homeopathy Library",
  description: "A premium digital homeopathy library with materia medica, repertory, therapeutics, organon, predictive homeopathy, and more.",
  keywords: ["homeopathy", "materia medica", "repertory", "therapeutics", "organon", "homoeopathy", "pradip", "homeo"],
  authors: [{ name: "Pradip Sagathiya" }],
  openGraph: {
    title: "Pradip's Homeo — Personal Digital Homeopathy Library",
    description: "A premium digital homeopathy library with materia medica, repertory, therapeutics, organon, predictive homeopathy, and more.",
    type: "website",
    siteName: "Pradip's Homeo",
  },
  twitter: {
    card: "summary",
    title: "Pradip's Homeo — Personal Digital Homeopathy Library",
    description: "A premium digital homeopathy library with materia medica, repertory, therapeutics, organon, predictive homeopathy, and more.",
  },
};

export const viewport = {
  themeColor: "#173B2D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon-v2.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-v2-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Pradip's Homeo" />
        <meta name="apple-mobile-web-app-title" content="Pradip's Homeo" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Unregister any old service workers from the previous static site */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              registrations.forEach(function(reg) { reg.unregister(); });
            });
            caches.keys().then(function(keys) {
              keys.forEach(function(k) { caches.delete(k); });
            });
          }
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-[#F5EFE0] text-[#2B2420]`}
      >
        <AnalyticsTracker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
