import type { Metadata } from "next";
import { Barlow_Condensed, Nunito } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Buttercup's Big Leap",
  description:
    "Help Buttercup soar over the ranch and earn a place on the shared leaderboard.",
  icons: {
    icon: "/buttercup.png",
    shortcut: "/buttercup.png",
  },
  openGraph: {
    title: "Buttercup's Big Leap",
    description: "Leap. Dodge. Gallop to glory.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
