"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Book, ScreenMedia } from "@/types/database";

function MediaCard({
  href,
  imageUrl,
  title,
  subtitle,
}: {
  href: string;
  imageUrl: string | null;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
            {title}
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium text-white line-clamp-2">
        {title}
      </h3>
      <p className="text-xs text-zinc-500">{subtitle}</p>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-3/4 rounded bg-zinc-800" />
          <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [screenMedia, setScreenMedia] = useState<ScreenMedia[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browseBooks, setBrowseBooks] = useState<Book[]>([]);
  const [browseScreen, setBrowseScreen] = useState<ScreenMedia[]>([]);

  useEffect(() => {
    async function loadBrowse() {
      const [b, s] = await Promise.all([
        supabase.from("books").select("*").order("title").limit(10),
        supabase.from("screen_media").select("*").order("title").limit(10),
      ]);
      setBrowseBooks(b.data ?? []);
      setBrowseScreen(s.data ?? []);
    }
    loadBrowse();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    const searchTerm = `%${query.trim()}%`;

    const [booksResult, screenResult] = await Promise.all([
      supabase
        .from("books")
        .select("*")
        .or(`title.ilike.${searchTerm},author.ilike.${searchTerm}`)
        .limit(20),
      supabase
        .from("screen_media")
        .select("*")
        .or(`title.ilike.${searchTerm},director.ilike.${searchTerm}`)
        .limit(20),
    ]);

    setBooks(booksResult.data ?? []);
    setScreenMedia(screenResult.data ?? []);
    setLoading(false);
  }

  const showBrowse = !hasSearched && !loading;

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, films, and TV shows..."
          autoFocus
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {loading && (
        <div className="mt-8 space-y-10">
          <section>
            <div className="mb-4 h-4 w-20 animate-pulse rounded bg-zinc-800" />
            <SkeletonGrid />
          </section>
        </div>
      )}

      {hasSearched && !loading && (
        <div className="mt-8 space-y-10">
          {books.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Books ({books.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {books.map((book) => (
                  <MediaCard
                    key={book.id}
                    href={`/book/${book.id}`}
                    imageUrl={book.cover_image_url}
                    title={book.title}
                    subtitle={book.author}
                  />
                ))}
              </div>
            </section>
          )}

          {screenMedia.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Films & TV ({screenMedia.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {screenMedia.map((media) => (
                  <MediaCard
                    key={media.id}
                    href={`/screen/${media.id}`}
                    imageUrl={media.poster_url}
                    title={media.title}
                    subtitle={`${media.type === "film" ? "Film" : "Series"}${media.director ? ` · ${media.director}` : ""}`}
                  />
                ))}
              </div>
            </section>
          )}

          {books.length === 0 && screenMedia.length === 0 && (
            <p className="text-center text-zinc-500">
              No results found for &quot;{query}&quot;
            </p>
          )}
        </div>
      )}

      {showBrowse && (
        <div className="mt-8 space-y-10">
          {browseBooks.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Browse Books
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {browseBooks.map((book) => (
                  <MediaCard
                    key={book.id}
                    href={`/book/${book.id}`}
                    imageUrl={book.cover_image_url}
                    title={book.title}
                    subtitle={book.author}
                  />
                ))}
              </div>
            </section>
          )}

          {browseScreen.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Browse Films & TV
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {browseScreen.map((media) => (
                  <MediaCard
                    key={media.id}
                    href={`/screen/${media.id}`}
                    imageUrl={media.poster_url}
                    title={media.title}
                    subtitle={`${media.type === "film" ? "Film" : "Series"}${media.director ? ` · ${media.director}` : ""}`}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
