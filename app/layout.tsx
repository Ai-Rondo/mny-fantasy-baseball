import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mny-fantasy-baseball.pages.dev"),
  title: "MNY Fantasy Baseball Trade Ledger",
  description: "Search and filter the trade history of Maybe Next Year Fantasy Baseball.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MNY Fantasy Baseball Trade Ledger",
    description: "League trade history",
    images: [{ url: "/og-v2.png", width: 1731, height: 909, alt: "Trade Ledger" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MNY Fantasy Baseball Trade Ledger",
    description: "League trade history",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
