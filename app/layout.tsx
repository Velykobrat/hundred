import type { Metadata, Viewport } from "next";
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
  icons: { apple: "/pwa-192.png" },
  title: "Hundred — ціле та частини",
  description: "Hundred — система опису Цілого через Частини, де кожна Частина може стати новим Цілим.",
};

export const viewport: Viewport = { themeColor: "#111317" };

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


