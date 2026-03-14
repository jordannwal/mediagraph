"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function FriendButton({ profileId }: { profileId: string }) {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"none" | "pending_sent" | "pending_received" | "accepted">("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user || user.id === profileId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("friendships")
        .select("*")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${user.id})`
        )
        .maybeSingle();

      if (data) {
        setFriendshipId(data.id);
        if (data.status === "accepted") setStatus("accepted");
        else if (data.requester_id === user.id) setStatus("pending_sent");
        else setStatus("pending_received");
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  if (loading || !user || user.id === profileId) return null;

  async function sendRequest() {
    if (!user) return;
    setActionLoading(true);
    const { data } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: profileId })
      .select()
      .single();
    if (data) {
      setFriendshipId(data.id);
      setStatus("pending_sent");
    }
    setActionLoading(false);
  }

  async function acceptRequest() {
    if (!friendshipId) return;
    setActionLoading(true);
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    setStatus("accepted");
    setActionLoading(false);
  }

  async function removeFriendship() {
    if (!friendshipId) return;
    setActionLoading(true);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    setFriendshipId(null);
    setStatus("none");
    setActionLoading(false);
  }

  if (status === "none") {
    return (
      <button
        onClick={sendRequest}
        disabled={actionLoading}
        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        Add Friend
      </button>
    );
  }

  if (status === "pending_sent") {
    return (
      <button
        onClick={removeFriendship}
        disabled={actionLoading}
        className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-50"
      >
        Cancel Request
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2">
        <button
          onClick={acceptRequest}
          disabled={actionLoading}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          onClick={removeFriendship}
          disabled={actionLoading}
          className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    );
  }

  // accepted
  return (
    <button
      onClick={removeFriendship}
      disabled={actionLoading}
      className="group rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-50"
    >
      <span className="group-hover:hidden">Friends</span>
      <span className="hidden group-hover:inline">Remove</span>
    </button>
  );
}
