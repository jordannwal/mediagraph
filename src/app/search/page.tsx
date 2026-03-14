"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Book, ScreenMedia } from "@/types/database";

type MediaFilter = "all" | "books" | "screen";
type DecadeFilter = "" | "2020" | "2010" | "2000" | "1990" | "1980" | "older";
type AdaptationFilter = "" | "has_adaptation";

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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-white text-black"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
      }`}
    >
      {label}
    </button>
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

  // Filters
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [decadeFilter, setDecadeFilter] = useState<DecadeFilter>("");
  const [adaptationFilter, setAdaptationFilter] = useState<AdaptationFilter>("");
  const [showFilters, setShowFilters] = useState(false);

  // Book IDs that have adaptations (for filtering)
  const [booksWithAdaptations, setBooksWithAdaptations] = useState<Set<string>>(new Set());
  const [screenWithAdaptations, setScreenWithAdaptations] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadBrowse() {
      const [b, s, adaptBook, adaptScreen] = await Promise.all([
        supabase.from("books").select("*").order("title").limit(10),
        supabase.from("screen_media").select("*").order("title").limit(10),
        supabase.from("adaptations").select("book_id"),
        supabase.from("adaptations").select("screen_media_id"),
      ]);
      setBrowseBooks(b.data ?? []);
      setBrowseScreen(s.data ?? []);
      setBooksWithAdaptations(new Set((adaptBook.data ?? []).map((a) => a.book_id)));
      setScreenWithAdaptations(new Set((adaptScreen.data ?? []).map((a) => a.screen_media_id)));
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
      mediaFilter !== "screen"
        ? supabase
            .from("books")
            .select("*")
            .or(`title.ilike.${searchTerm},author.ilike.${searchTerm}`)
            .limit(20)
        : { data: [] },
      mediaFilter !== "books"
        ? supabase
            .from("screen_media")
            .select("*")
            .or(`title.ilike.${searchTerm},director.ilike.${searchTerm}`)
            .limit(20)
        : { data: [] },
    ]);

    setBooks(booksResult.data ?? []);
    setScreenMedia(screenResult.data ?? []);
    setLoading(false);
  }

  // Apply client-side filters
  function filterByDecade<T extends { published_date?: string | null; release_date?: string | null }>(
    items: T[]
  ): T[] {
    if (!decadeFilter) return items;
    return items.filter((item) => {
      const dateStr = "published_date" in item ? item.published_date : item.release_date;
      if (!dateStr) return false;
      const year = new Date(dateStr).getFullYear();
      if (decadeFilter === "older") return year < 1980;
      const decade = parseInt(decadeFilter);
      return year >= decade && year < decade + 10;
    });
  }

  function filterByAdaptation<T extends { id: string }>(
    items: T[],
    adaptationSet: Set<string>
  ): T[] {
    if (!adaptationFilter) return items;
    return items.filter((item) => adaptationSet.has(item.id));
  }

  const filteredBooks = filterByAdaptation(filterByDecade(books), booksWithAdaptations);
  const filteredScreen = filterByAdaptation(filterByDecade(screenMedia), screenWithAdaptations);
  const filteredBrowseBooks = filterByAdaptation(filterByDecade(browseBooks), booksWithAdaptations);
  const filteredBrowseScreen = filterByAdaptation(filterByDecade(browseScreen), screenWithAdaptations);

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

      {/* Filter toggle */}
      <div className="mt-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          {showFilters ? "Hide filters" : "Show filters"}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-3 space-y-3 rounded-lg border border-zinc-800 p-4">
          {/* Media type */}
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Type</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip label="All" active={mediaFilter === "all"} onClick={() => setMediaFilter("all")} />
              <FilterChip label="Books" active={mediaFilter === "books"} onClick={() => setMediaFilter("books")} />
              <FilterChip label="Films & TV" active={mediaFilter === "screen"} onClick={() => setMediaFilter("screen")} />
            </div>
          </div>

          {/* Decade */}
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Decade</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip label="Any" active={decadeFilter === ""} onClick={() => setDecadeFilter("")} />
              <FilterChip label="2020s" active={decadeFilter === "2020"} onClick={() => setDecadeFilter("2020")} />
              <FilterChip label="2010s" active={decadeFilter === "2010"} onClick={() => setDecadeFilter("2010")} />
              <FilterChip label="2000s" active={decadeFilter === "2000"} onClick={() => setDecadeFilter("2000")} />
              <FilterChip label="1990s" active={decadeFilter === "1990"} onClick={() => setDecadeFilter("1990")} />
              <FilterChip label="1980s" active={decadeFilter === "1980"} onClick={() => setDecadeFilter("1980")} />
              <FilterChip label="Older" active={decadeFilter === "older"} onClick={() => setDecadeFilter("older")} />
            </div>
          </div>

          {/* Adaptation status */}
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Adaptation</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip label="Any" active={adaptationFilter === ""} onClick={() => setAdaptationFilter("")} />
              <FilterChip label="Has adaptation" active={adaptationFilter === "has_adaptation"} onClick={() => setAdaptationFilter("has_adaptation")} />
            </div>
          </div>
        </div>
      )}

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
          {mediaFilter !== "screen" && filteredBooks.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Books ({filteredBooks.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredBooks.map((book) => (
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

          {mediaFilter !== "books" && filteredScreen.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Films & TV ({filteredScreen.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredScreen.map((media) => (
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

          {filteredBooks.length === 0 && filteredScreen.length === 0 && (
            <p className="text-center text-zinc-500">
              No results found for &quot;{query}&quot;
              {(decadeFilter || adaptationFilter) && " with current filters"}
            </p>
          )}
        </div>
      )}

      {showBrowse && (
        <div className="mt-8 space-y-10">
          {mediaFilter !== "screen" && filteredBrowseBooks.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Browse Books
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredBrowseBooks.map((book) => (
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

          {mediaFilter !== "books" && filteredBrowseScreen.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Browse Films & TV
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredBrowseScreen.map((media) => (
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
