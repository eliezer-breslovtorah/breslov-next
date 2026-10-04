import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: {
    default: "Breslov Torah | Wisdom for everyday life",
    template: "%s | Breslov Torah",
  },
  description:
    "Discover the teachings of Rebbe Nachman through the Breslov Torah lesson library.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
