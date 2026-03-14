"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

interface FeedItem {
  id: string;
  user_id: string;
  action_type: string;
  media_type: string;
  media_id: string;
  metadata: { status?: string; rating?: number; shelf_id?: string };
  created_at: string;
}

interface MediaInfo {
  id: string;
  title: string;
  cover_image_url?: string;
  poster_url?: string;
  author?: string;
  director?: string;
  type?: string;
}

interface UserInfo {
  id: string;
  username: string;
  display_name: string | null;
}

export default function Home() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [users, setUsers] = useState<Map<string, UserInfo>>(new Map());
  const [media, setMedia] = useState<Map<string, MediaInfo>>(new Map());

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadFeed(user.id);
      }
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFeed(userId: string) {
    // Get accepted friend IDs
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    const friendIds = (friendships ?? []).map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    // Include own activity too
    const allIds = [userId, ...friendIds];

    const { data: feedData } = await supabase
      .from("activity_feed")
      .select("*")
      .in("user_id", allIds)
      .order("created_at", { ascending: false })
      .limit(30);

    const items = (feedData ?? []) as FeedItem[];
    setFeed(items);

    // Fetch user profiles
    const userIds = [...new Set(items.map((i) => i.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("users")
        .select("id, username, display_name")
        .in("id", userIds);
      setUsers(new Map((profiles ?? []).map((p) => [p.id, p as UserInfo])));
    }

    // Fetch media info
    const bookIds = [...new Set(items.filter((i) => i.media_type === "book").map((i) => i.media_id))];
    const screenIds = [...new Set(items.filter((i) => i.media_type === "screen").map((i) => i.media_id))];

    const mediaMap = new Map<string, MediaInfo>();

    if (bookIds.length > 0) {
      const { data: books } = await supabase
        .from("books")
        .select("id, title, cover_image_url, author")
        .in("id", bookIds);
      (books ?? []).forEach((b) => mediaMap.set(b.id, b as MediaInfo));
    }
    if (screenIds.length > 0) {
      const { data: screens } = await supabase
        .from("screen_media")
        .select("id, title, poster_url, type, director")
        .in("id", screenIds);
      (screens ?? []).forEach((s) => mediaMap.set(s.id, s as MediaInfo));
    }
    setMedia(mediaMap);
  }

  function actionLabel(item: FeedItem): string {
    const isBook = item.media_type === "book";
    switch (item.action_type) {
      case "reviewed":
        return isBook ? "reviewed a book" : "reviewed a film";
      case "rated":
        return isBook ? "rated a book" : "rated a film";
      case "shelved":
        return isBook ? "shelved a book" : "shelved a film";
      case "logged": {
        const status = item.metadata?.status;
        if (status === "completed") return isBook ? "finished reading" : "watched";
        if (status === "in_progress") return isBook ? "started reading" : "started watching";
        if (status === "want") return isBook ? "wants to read" : "wants to watch";
        return "logged";
      }
      default:
        return "logged";
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  // Logged-out landing page
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          MediaGraph
        </h1>
        <p className="mt-4 max-w-md text-lg text-zinc-400">
          Track books you&apos;ve read and films you&apos;ve watched. Discover the
          adaptations that connect them.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/auth/signup"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Get Started
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-zinc-500"
          >
            Browse
          </Link>
        </div>
      </div>
    );
  }

  // Logged-in feed
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Home</h1>
        <Link
          href="/friends"
          className="text-sm text-zinc-400 transition-colors hover:text-white"
        >
          Friends
        </Link>
      </div>

      {feed.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-zinc-400">Your feed is empty.</p>
          <p className="mt-2 text-sm text-zinc-600">
            <Link href="/search" className="text-white hover:underline">Log some media</Link>{" "}
            or{" "}
            <Link href="/friends" className="text-white hover:underline">add friends</Link>{" "}
            to see activity here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {feed.map((item) => {
            const profile = users.get(item.user_id);
            const m = media.get(item.media_id);
            if (!profile || !m) return null;

            const imageUrl = item.media_type === "book" ? m.cover_image_url : m.poster_url;
            const href = item.media_type === "book" ? `/book/${item.media_id}` : `/screen/${item.media_id}`;

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-700"
              >
                <Link href={href} className="h-16 w-11 shrink-0 overflow-hidden rounded bg-zinc-800">
                  {imageUrl ? (
                    <img src={imageUrl} alt={m.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-600">?</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">
                    <Link
                      href={`/profile/${profile.username}`}
                      className="font-medium text-white hover:underline"
                    >
                      {profile.display_name || profile.username}
                    </Link>{" "}
                    {actionLabel(item)}
                  </p>
                  <Link href={href} className="mt-0.5 block text-sm font-medium text-white hover:underline truncate">
                    {m.title}
                  </Link>
                  {item.metadata?.rating && (
                    <p className="mt-1 text-sm">
                      <span className="text-yellow-400">
                        {"★".repeat(item.metadata.rating)}
                      </span>
                      <span className="text-zinc-700">
                        {"★".repeat(5 - item.metadata.rating)}
                      </span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-600">{timeAgo(item.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
