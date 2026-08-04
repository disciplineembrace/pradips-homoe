import type { Metadata, Viewport } from "next";
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
  title: "Pradip's Homoe - Personal Digital Homoeopathy Library",
  description: "A secure, private collection of homoeopathic materia medica, repertories, therapeutics, and predictive homeopathy — accessible only to authorized users.",
  keywords: ["homeopathy", "homoeopathy", "materia medica", "repertory", "therapeutics", "Pradip's Homoe", "Hahnemann", "organon"],
  authors: [{ name: "Pradip's Homoe" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pradip's Homoe",
  },
  openGraph: {
    title: "Pradip's Homoe - Personal Digital Homoeopathy Library",
    description: "A secure, private collection of homoeopathic materia medica, repertories, therapeutics, and predictive homeopathy.",
    url: "https://pradips-homoe.vercel.app",
    siteName: "Pradip's Homoe",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pradip's Homoe",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pradip's Homoe",
    description: "Personal Digital Homoeopathy Library",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#173B2D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <Sidebar />
        {/* Main content area — offset for desktop sidebar (w-64 = 16rem = 256px) */}
        <div className="lg:ml-64 min-h-screen flex flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
