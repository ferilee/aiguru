import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";

const logoFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: "AIGURU",
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
      <body className={logoFont.variable}>{children}</body>
    </html>
  );
}
