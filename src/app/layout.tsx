import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";

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
  title: "Pradip's Homoe — Personal Digital Homoeopathy Library",
  description:
    "A secure, private collection of homoeopathic materia medica, repertories, therapeutics, and predictive homeopathy — accessible only to authorized users.",
  keywords: [
    "homoeopathy",
    "homeopathy",
    "materia medica",
    "repertory",
    "therapeutics",
    "predictive homeopathy",
    "organon",
    "Pradip's Homoe",
  ],
  authors: [{ name: "Pradip's Homoe" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Pradip's Homoe",
    description:
      "Personal Digital Homoeopathy Library — Materia Medica, Repertory, Therapeutics, Predictive & more.",
    siteName: "Pradip's Homoe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pradip's Homoe",
    description:
      "Personal Digital Homoeopathy Library — Materia Medica, Repertory, Therapeutics, Predictive & more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        {/* Global Sidebar — visible on all pages (desktop fixed + mobile drawer) */}
        <Sidebar />

        {/* Main content — offset for desktop sidebar (w-64 = 16rem = pl-64) */}
        <div className="lg:pl-64 min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>

        <Toaster />
      </body>
    </html>
  );
}
