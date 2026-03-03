import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-sans">{children}</body>
    </html>
  );
}
