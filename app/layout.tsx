import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "You Can Write It Down — FPL Rivalry",
  description: "Mike vs Jack's Fantasy Premier League head-to-head, season by season.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
