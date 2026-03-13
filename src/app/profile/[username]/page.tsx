import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // Get user's recent logs with book/screen info
  const { data: logs } = await supabase
    .from("user_logs")
    .select("*")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  // Fetch titles for each log
  const bookIds = (logs ?? [])
    .filter((l) => l.media_type === "book")
    .map((l) => l.media_id);
  const screenIds = (logs ?? [])
    .filter((l) => l.media_type === "screen")
    .map((l) => l.media_id);

  const [booksResult, screenResult] = await Promise.all([
    bookIds.length > 0
      ? supabase
          .from("books")
          .select("id, title, cover_image_url, author")
          .in("id", bookIds)
      : { data: [] },
    screenIds.length > 0
      ? supabase
          .from("screen_media")
          .select("id, title, poster_url, type, director")
          .in("id", screenIds)
      : { data: [] },
  ]);

  const booksMap = new Map(
    (booksResult.data ?? []).map((b) => [b.id, b])
  );
  const screenMap = new Map(
    (screenResult.data ?? []).map((s) => [s.id, s])
  );

  // Stats
  const totalLogs = logs?.length ?? 0;
  const completedLogs = logs?.filter((l) => l.status === "completed") ?? [];
  const ratedLogs = logs?.filter((l) => l.rating) ?? [];
  const avgRating =
    ratedLogs.length > 0
      ? (
          ratedLogs.reduce((sum, l) => sum + (l.rating ?? 0), 0) /
          ratedLogs.length
        ).toFixed(1)
      : null;

  const statusLabel = (status: string, mediaType: string) => {
    const isBook = mediaType === "book";
    switch (status) {
      case "want":
        return isBook ? "Wants to read" : "Wants to watch";
      case "in_progress":
        return isBook ? "Reading" : "Watching";
      case "completed":
        return isBook ? "Read" : "Watched";
      default:
        return status;
    }
  };

  return (
    <div>
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-zinc-400">
          {profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-zinc-500">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 text-sm text-zinc-400">{profile.bio}</p>
      )}

      {/* Stats */}
      <div className="mt-6 flex gap-6">
        <div>
          <p className="text-2xl font-bold text-white">{totalLogs}</p>
          <p className="text-xs text-zinc-500">Logged</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{completedLogs.length}</p>
          <p className="text-xs text-zinc-500">Completed</p>
        </div>
        {avgRating && (
          <div>
            <p className="text-2xl font-bold text-white">{avgRating}</p>
            <p className="text-xs text-zinc-500">Avg Rating</p>
          </div>
        )}
      </div>

      {/* Recent activity */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Recent Activity
        </h2>

        {(!logs || logs.length === 0) && (
          <p className="text-sm text-zinc-600">No activity yet.</p>
        )}

        <div className="space-y-3">
          {(logs ?? []).map((log) => {
            const isBook = log.media_type === "book";
            const media = isBook
              ? booksMap.get(log.media_id)
              : screenMap.get(log.media_id);

            if (!media) return null;

            const imageUrl = isBook
              ? (media as { cover_image_url?: string }).cover_image_url
              : (media as { poster_url?: string }).poster_url;

            const href = isBook
              ? `/book/${log.media_id}`
              : `/screen/${log.media_id}`;

            return (
              <Link
                key={log.id}
                href={href}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-zinc-800">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={media.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                      ?
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {media.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {statusLabel(log.status, log.media_type)}
                    {log.rating && (
                      <span className="ml-2 text-yellow-400">
                        {"★".repeat(log.rating)}
                        <span className="text-zinc-700">
                          {"★".repeat(5 - log.rating)}
                        </span>
                      </span>
                    )}
                  </p>
                  {log.review_text && (
                    <p className="mt-1 text-xs text-zinc-600 line-clamp-1">
                      {log.review_text}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
