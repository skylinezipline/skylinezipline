import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Zipline OS | Skyline Ziplines",
    template: "%s | Zipline OS",
  },
  description:
    "Operations management platform for Skyline Ziplines — bookings, staff, equipment, safety, and reporting in one place.",
  keywords: ["zipline", "operations", "management", "bookings", "safety"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
