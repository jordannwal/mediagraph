import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for books, films, and TV series on MediaGraph.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
