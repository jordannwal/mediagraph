import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import NavAuth from "@/components/NavAuth";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MediaGraph",
    template: "%s | MediaGraph",
  },
  description: "Track books, films, and their adaptations in one place.",
  metadataBase: new URL("https://mediagraph2.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "MediaGraph",
    title: "MediaGraph",
    description: "Track books, films, and their adaptations in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaGraph",
    description: "Track books, films, and their adaptations in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              MediaGraph
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/search" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Search
              </Link>
              <NavAuth />
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
