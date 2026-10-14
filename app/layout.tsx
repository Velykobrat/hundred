import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { preferenceScript } from "../src/lib/preference-script";
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
  title: "Hundred — побач свої ресурси",
  description: "Hundred — універсальна система роботи з обмеженими величинами. Побач бюджет, час, площу та інші ресурси як ціле, його частини й доступний залишок.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><script id="hundred-preferences" dangerouslySetInnerHTML={{ __html: preferenceScript }} /></head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}


