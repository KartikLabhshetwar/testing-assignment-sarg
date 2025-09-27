import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Intelligence Dashboard - Server",
  description: "Server-side API and report generation for BI Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
