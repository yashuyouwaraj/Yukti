import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yukti — Intelligence that gets things done",
  description: "Plan, approve, and run browser workflows with Yukti.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
