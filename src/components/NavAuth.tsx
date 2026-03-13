"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function NavAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-5 w-16 animate-pulse rounded bg-zinc-800" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/auth/login"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href={`/profile/${user.user_metadata?.username || user.id}`}
        className="text-sm text-zinc-400 hover:text-white transition-colors"
      >
        {user.user_metadata?.username || "Profile"}
      </Link>
      <button
        onClick={handleLogout}
        className="text-sm text-zinc-500 hover:text-white transition-colors"
      >
        Log out
      </button>
    </div>
  );
}
