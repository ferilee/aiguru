import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Akademi Inovasi Guru",
  description:
    "LMS untuk pelatihan guru berbasis proyek dan inovasi pembelajaran.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
