import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ScreenMediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: media } = await supabase
    .from("screen_media")
    .select("*")
    .eq("id", id)
    .single();

  if (!media) notFound();

  const { data: adaptations } = await supabase
    .from("adaptations")
    .select("*, books(*)")
    .eq("screen_media_id", id);

  const sourceBook = adaptations?.[0]?.books ?? null;
  const adaptation = adaptations?.[0] ?? null;

  return (
    <div>
      <Link
        href="/search"
        className="text-sm text-zinc-500 hover:text-white transition-colors"
      >
        &larr; Back to search
      </Link>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        {/* Poster */}
        <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-48">
          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
            {media.poster_url ? (
              <img
                src={media.poster_url}
                alt={media.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No poster
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{media.title}</h1>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
              {media.type === "film" ? "Film" : "Series"}
            </span>
          </div>

          {media.director && (
            <p className="mt-1 text-lg text-zinc-400">
              Directed by {media.director}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-500">
            {media.release_date && (
              <span>
                {new Date(media.release_date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {media.runtime_minutes && <span>{media.runtime_minutes} min</span>}
            {media.seasons_count && (
              <span>
                {media.seasons_count} season{media.seasons_count > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {media.synopsis && (
            <p className="mt-4 leading-relaxed text-zinc-300">
              {media.synopsis}
            </p>
          )}
        </div>
      </div>

      {/* Source Material panel */}
      {sourceBook && (
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Source Material
          </h2>
          <Link
            href={`/book/${sourceBook.id}`}
            className="group flex gap-4 rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="w-20 shrink-0">
              <div className="aspect-[2/3] overflow-hidden rounded bg-zinc-800">
                {sourceBook.cover_image_url ? (
                  <img
                    src={sourceBook.cover_image_url}
                    alt={sourceBook.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                    No cover
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">
                {sourceBook.title}
              </h3>
              <p className="text-sm text-zinc-400">by {sourceBook.author}</p>
              {adaptation?.notes && (
                <p className="mt-2 text-sm text-zinc-500">
                  {adaptation.notes}
                </p>
              )}
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}
