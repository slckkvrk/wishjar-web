import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ConfettiListener from "@/components/ConfettiListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WishJar — Collect Wishes, Make Them Real",
  description: "Create wishlists for life's big moments. Share your jar, get support from friends and family.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ConfettiListener />
      </body>
    </html>
  );
}
