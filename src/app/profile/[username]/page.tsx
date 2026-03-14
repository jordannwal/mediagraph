import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import FriendButton from "@/components/FriendButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const { data: profile } = await supabase
    .from("users")
    .select("username, display_name, bio")
    .eq("username", username)
    .single();

  if (!profile) return { title: "User Not Found" };

  const name = profile.display_name || profile.username;
  const description = profile.bio || `${name}'s profile on MediaGraph`;

  return {
    title: `${name} (@${profile.username})`,
    description,
    openGraph: { title: `${name} (@${profile.username})`, description },
  };
}

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

  // Get user's recent logs, shelves, and friend count in parallel
  const [logsResult, shelvesResult, friendsResult] = await Promise.all([
    supabase
      .from("user_logs")
      .select("*")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("shelves")
      .select("*, shelf_items(count)")
      .eq("user_id", profile.id)
      .order("is_default", { ascending: false }),
    supabase
      .from("friendships")
      .select("id", { count: "exact" })
      .eq("status", "accepted")
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`),
  ]);

  const logs = logsResult.data ?? [];
  const shelves = shelvesResult.data ?? [];
  const friendCount = friendsResult.count ?? 0;

  // Fetch titles for each log
  const bookIds = logs
    .filter((l) => l.media_type === "book")
    .map((l) => l.media_id);
  const screenIds = logs
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
  const totalLogs = logs.length;
  const completedLogs = logs.filter((l) => l.status === "completed");
  const ratedLogs = logs.filter((l) => l.rating);
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
      <div className="flex items-center justify-between">
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
        <FriendButton profileId={profile.id} />
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
        <div>
          <p className="text-2xl font-bold text-white">{friendCount}</p>
          <p className="text-xs text-zinc-500">Friends</p>
        </div>
      </div>

      {/* Shelves */}
      {shelves.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Shelves
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shelves.map((shelf) => {
              const itemCount = Array.isArray(shelf.shelf_items)
                ? shelf.shelf_items[0]?.count ?? 0
                : 0;
              return (
                <div
                  key={shelf.id}
                  className="rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-700"
                >
                  <p className="text-sm font-medium text-white">{shelf.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Recent Activity
        </h2>

        {logs.length === 0 && (
          <p className="text-sm text-zinc-600">No activity yet.</p>
        )}

        <div className="space-y-3">
          {logs.map((log) => {
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
