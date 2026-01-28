import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuickBite Kiosk",
  description: "Self-ordering restaurant kiosk",
  icons: {
    icon: "/favicon.svg",
  },
};

import IdleScreensaver from "@/components/kiosk/IdleScreensaver";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <IdleScreensaver />
          {children}
        </Providers>
      </body>
    </html>
  );
}
