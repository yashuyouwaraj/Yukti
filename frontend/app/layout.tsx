
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yukti — Intelligence that gets things done",
  description:
    "Plan, review, and approve browser workflows with Yukti before execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
