import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/navbar";
import AmbientBackdrop from "@/components/ui/ambient-backdrop";
import NavigationProgressBar from "@/components/ui/navigation-progress-bar";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Tapak — Personal Watch Journal",
    template: "%s | Tapak",
  },
  description:
    "Catat progress tontonan anime, series, dan film. Track episode, status, rating, dan catatan pribadi dalam satu platform.",
  metadataBase: new URL("https://tapak-seven.vercel.app"),
  openGraph: {
    title: "Tapak — Personal Watch Journal",
    description:
      "Catat progress tontonan anime, series, dan film. Track episode, status, rating, dan catatan pribadi dalam satu platform.",
    url: "https://tapak-seven.vercel.app",
    siteName: "Tapak",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tapak — Personal Watch Journal",
    description:
      "Catat progress tontonan anime, series, dan film. Track episode, status, rating, dan catatan pribadi dalam satu platform.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${jakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans relative">
        <NavigationProgressBar />
        <AmbientBackdrop />
        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
      </body>
    </html>
  );
}