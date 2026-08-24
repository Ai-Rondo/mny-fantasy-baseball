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
  title: "Maybe Next Year Fantasy Baseball League History",
  description: "Trades, roasts, voting, and league history for Maybe Next Year Fantasy Baseball.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Maybe Next Year Fantasy Baseball League History",
    description: "Trades, roasts, voting, and league history",
    images: [{ url: "/og-history.png", width: 1731, height: 909, alt: "Maybe Next Year Fantasy Baseball League History" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maybe Next Year Fantasy Baseball League History",
    description: "Trades, roasts, voting, and league history",
    images: ["/og-history.png"],
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
