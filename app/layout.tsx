import type { Metadata } from "next";
// @ts-ignore - Next.js handles global CSS imports
import "./globals.css";

export const metadata: Metadata = {
  title: "Ratna Enterprises",
  description: "Track client payments and follow up on overdue bills.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
