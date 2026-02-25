import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import { GovernanceProvider } from "@/contexts/GovernanceContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dao-radar.vercel.app"),
  title: {
    default: "DAO Radar — Solana Governance Dashboard",
    template: "%s | DAO Radar",
  },
  description:
    "Your governance command center. See all your DAOs, AI-summarized proposals, and vote in one click.",
  keywords: [
    "Solana",
    "DAO",
    "governance",
    "voting",
    "proposals",
    "SPL Governance",
    "Realms",
    "decentralized",
    "Web3",
    "crypto",
  ],
  authors: [{ name: "DAO Radar" }],
  creator: "DAO Radar",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "DAO Radar — Solana Governance Dashboard",
    description:
      "Scan every DAO you belong to. AI-powered proposal intelligence. One-click voting across all your Solana DAOs.",
    type: "website",
    siteName: "DAO Radar",
    url: "https://dao-radar.vercel.app",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DAO Radar — Solana Governance Dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DAO Radar — Solana Governance Dashboard",
    description:
      "Scan every DAO you belong to. AI-powered proposal intelligence. One-click voting across all your Solana DAOs.",
    images: ["/og-image.png"],
  },
  other: {
    "theme-color": "#ef4444",
    "msapplication-TileColor": "#0A0A0A",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head />
      <body
        className={`${plusJakarta.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <WalletProvider>
          <GovernanceProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 animate-page-fade-in">
              {children}
            </main>
            <Footer />
          </GovernanceProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
