import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import",
  description: "Import your Letterboxd or Goodreads data into MediaGraph.",
};

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
