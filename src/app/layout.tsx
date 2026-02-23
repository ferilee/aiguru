import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";

const logoFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-logo",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "AIGURU",
    template: "%s | AIGURU",
  },
  description:
    "LMS untuk pelatihan guru berbasis proyek dan inovasi pembelajaran.",
  keywords: [
    "AIGURU",
    "LMS",
    "Pelatihan Guru",
    "E-Learning",
    "Pembelajaran Digital",
  ],
  icons: {
    icon: [
      { url: "/favicon-AIGuru.png", type: "image/png", sizes: "2048x2048" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: appUrl,
    siteName: "AIGURU",
    title: "AIGURU - LMS Pelatihan Guru Berbasis Proyek",
    description:
      "Platform pelatihan guru modern: kursus interaktif, project-based learning, dan tracking progres belajar.",
    images: [
      {
        url: "/og-aiguru.png",
        width: 1200,
        height: 630,
        alt: "AIGURU Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIGURU - LMS Pelatihan Guru Berbasis Proyek",
    description:
      "Kursus interaktif untuk guru dengan pengalaman belajar modern dan terstruktur.",
    images: ["/og-aiguru.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={logoFont.variable}>{children}</body>
    </html>
  );
}
