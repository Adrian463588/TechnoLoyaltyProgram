import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const fontSyne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontDmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const fontJetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Berijalan Employee Loyalty Program Portal",
  description: "Internal loyalty portal for Optel and Techno divisions",
  icons: {
    icon: "/LoyaltyProgram_Icon.png",
    apple: "/LoyaltyProgram_Icon.png",
  },
  openGraph: {
    title: "Berijalan Loyalty",
    description: "Employee Loyalty Program Portal",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSyne.variable} ${fontDmSans.variable} ${fontJetBrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col hide-scrollbar" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
