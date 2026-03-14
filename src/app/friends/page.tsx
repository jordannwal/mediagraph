"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  requester: UserProfile;
  addressee: UserProfile;
}

export default function FriendsPage() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendshipRow[]>([]);
  const [incoming, setIncoming] = useState<FriendshipRow[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFriendships = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select("*, requester:users!friendships_requester_id_fkey(*), addressee:users!friendships_addressee_id_fkey(*)")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    const rows = (data ?? []) as unknown as FriendshipRow[];
    setFriends(rows.filter((f) => f.status === "accepted"));
    setIncoming(rows.filter((f) => f.status === "pending" && f.addressee_id === userId));
    setOutgoing(rows.filter((f) => f.status === "pending" && f.requester_id === userId));
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await loadFriendships(user.id);
      setLoading(false);
    }
    init();
  }, [supabase, loadFriendships]);

  async function searchUsers() {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .ilike("username", `%${searchQuery.trim()}%`)
      .neq("id", user.id)
      .limit(10);
    setSearchResults((data ?? []) as UserProfile[]);
    setSearching(false);
  }

  async function sendRequest(targetId: string) {
    if (!user) return;
    setActionLoading(targetId);
    await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: targetId,
    });
    await loadFriendships(user.id);
    setSearchResults((prev) => prev.filter((u) => u.id !== targetId));
    setActionLoading(null);
  }

  async function acceptRequest(friendshipId: string) {
    setActionLoading(friendshipId);
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    if (user) await loadFriendships(user.id);
    setActionLoading(null);
  }

  async function rejectRequest(friendshipId: string) {
    setActionLoading(friendshipId);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    if (user) await loadFriendships(user.id);
    setActionLoading(null);
  }

  async function removeFriend(friendshipId: string) {
    setActionLoading(friendshipId);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    if (user) await loadFriendships(user.id);
    setActionLoading(null);
  }

  function getFriend(row: FriendshipRow): UserProfile {
    return row.requester_id === user?.id ? row.addressee : row.requester;
  }

  function Avatar({ profile }: { profile: UserProfile }) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
        {profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
      </div>
    );
  }

  // Check if a user already has a friendship with us
  function existingRelation(userId: string): string | null {
    const all = [...friends, ...incoming, ...outgoing];
    const match = all.find(
      (f) => f.requester_id === userId || f.addressee_id === userId
    );
    if (!match) return null;
    if (match.status === "accepted") return "Friends";
    if (match.requester_id === user?.id) return "Request sent";
    return "Pending";
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-lg bg-zinc-800/50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Friends</h1>
        <p className="mt-2 text-zinc-400">
          <Link href="/auth/login" className="text-white hover:underline">Log in</Link>{" "}
          to connect with friends.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Friends</h1>

      {/* Search for users */}
      <div className="mt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchUsers();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((profile) => {
              const relation = existingRelation(profile.id);
              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                >
                  <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 min-w-0">
                    <Avatar profile={profile} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profile.display_name || profile.username}
                      </p>
                      <p className="text-xs text-zinc-500">@{profile.username}</p>
                    </div>
                  </Link>
                  {relation ? (
                    <span className="text-xs text-zinc-500">{relation}</span>
                  ) : (
                    <button
                      onClick={() => sendRequest(profile.id)}
                      disabled={actionLoading === profile.id}
                      className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Friend Requests ({incoming.length})
          </h2>
          <div className="space-y-2">
            {incoming.map((row) => {
              const profile = row.requester;
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                >
                  <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 min-w-0">
                    <Avatar profile={profile} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profile.display_name || profile.username}
                      </p>
                      <p className="text-xs text-zinc-500">@{profile.username}</p>
                    </div>
                  </Link>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => acceptRequest(row.id)}
                      disabled={actionLoading === row.id}
                      className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(row.id)}
                      disabled={actionLoading === row.id}
                      className="rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Outgoing requests */}
      {outgoing.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Sent Requests ({outgoing.length})
          </h2>
          <div className="space-y-2">
            {outgoing.map((row) => {
              const profile = row.addressee;
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                >
                  <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 min-w-0">
                    <Avatar profile={profile} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profile.display_name || profile.username}
                      </p>
                      <p className="text-xs text-zinc-500">@{profile.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => rejectRequest(row.id)}
                    disabled={actionLoading === row.id}
                    className="shrink-0 rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No friends yet. Search for users above to add friends.
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((row) => {
              const profile = getFriend(row);
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 transition-colors hover:border-zinc-700"
                >
                  <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 min-w-0">
                    <Avatar profile={profile} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profile.display_name || profile.username}
                      </p>
                      <p className="text-xs text-zinc-500">@{profile.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFriend(row.id)}
                    disabled={actionLoading === row.id}
                    className="shrink-0 text-xs text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
