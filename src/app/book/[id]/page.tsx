import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (!book) notFound();

  const { data: adaptations } = await supabase
    .from("adaptations")
    .select("*, screen_media(*)")
    .eq("book_id", id)
    .order("release_year", { ascending: true });

  return (
    <div>
      <Link
        href="/search"
        className="text-sm text-zinc-500 hover:text-white transition-colors"
      >
        &larr; Back to search
      </Link>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        {/* Cover */}
        <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-48">
          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No cover
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{book.title}</h1>
          <p className="mt-1 text-lg text-zinc-400">by {book.author}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-500">
            {book.page_count && <span>{book.page_count} pages</span>}
            {book.published_date && (
              <span>
                Published{" "}
                {new Date(book.published_date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {book.isbn && <span>ISBN: {book.isbn}</span>}
          </div>

          {book.series_name && (
            <p className="mt-3 text-sm text-zinc-400">
              {book.series_name}
              {book.series_position && ` #${book.series_position}`}
            </p>
          )}

          {book.description && (
            <p className="mt-4 leading-relaxed text-zinc-300">
              {book.description}
            </p>
          )}
        </div>
      </div>

      {/* Adaptations panel */}
      {adaptations && adaptations.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Adaptations ({adaptations.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {adaptations.map((adaptation) => {
              const media = adaptation.screen_media;
              if (!media) return null;
              return (
                <Link
                  key={adaptation.id}
                  href={`/screen/${media.id}`}
                  className="group"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
                    {media.poster_url ? (
                      <img
                        src={media.poster_url}
                        alt={media.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
                        {media.title}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-white line-clamp-2">
                    {media.title}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {adaptation.adaptation_type === "film"
                      ? "Film"
                      : adaptation.adaptation_type === "series"
                        ? "Series"
                        : "Miniseries"}
                    {adaptation.release_year && ` · ${adaptation.release_year}`}
                  </p>
                  {adaptation.notes && (
                    <p className="mt-1 text-xs text-zinc-600 line-clamp-2">
                      {adaptation.notes}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
