import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel_Decorative, Lora, Fira_Sans } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "5E Portal - D&D 5e Campaign Manager",
  description: "Character creation, tactical combat, and encounter management built on official 5e SRD rules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzelDecorative.variable} ${lora.variable} ${firaSans.variable} antialiased bg-[#0c0d12] text-slate-100 min-h-screen flex flex-col selection:bg-[#c5a059]/30 selection:text-white`}
      >
        <main className="flex-1">{children}</main>
        <Toaster />
        <Footer />
      </body>
    </html>
  );
}
