import type { Metadata } from "next";
import "./globals.css";
import "./support.css";
import "./library.css";
import "./admin.css";
import { getCurrentUser } from "@/lib/auth";
import { Shell } from "@/components/shell";
import { MediaProvider } from "@/components/media-provider";
export const metadata: Metadata = {
  title: {
    default: "Breslov Torah | Wisdom for everyday life",
    template: "%s | Breslov Torah",
  },
  description:
    "Discover the teachings of Rebbe Nachman through the Breslov Torah lesson library.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <MediaProvider signedIn={!!user}>
          <Shell>{children}</Shell>
        </MediaProvider>
      </body>
    </html>
  );
}
