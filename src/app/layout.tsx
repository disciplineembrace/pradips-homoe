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
  title: "Pradip's Homoe — Personal Digital Homeopathy Library",
  description: "A premium digital homeopathy library with materia medica, repertory, therapeutics, organon, predictive homeopathy, and more.",
  keywords: ["homeopathy", "materia medica", "repertory", "therapeutics", "organon", "homoeopathy", "pradip"],
  authors: [{ name: "Pradip Sagathiya" }],
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
