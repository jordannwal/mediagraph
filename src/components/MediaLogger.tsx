"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { LogStatus, MediaType } from "@/types/database";
import Link from "next/link";

const STATUS_OPTIONS: { value: LogStatus; label: string; bookLabel: string }[] = [
  { value: "want", label: "Want to Watch", bookLabel: "Want to Read" },
  { value: "in_progress", label: "Watching", bookLabel: "Reading" },
  { value: "completed", label: "Watched", bookLabel: "Read" },
];

function StarRating({
  rating,
  onRate,
}: {
  rating: number | null;
  onRate: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-colors"
        >
          <span
            className={
              star <= (hover || rating || 0)
                ? "text-yellow-400"
                : "text-zinc-700"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export default function MediaLogger({
  mediaType,
  mediaId,
}: {
  mediaType: MediaType;
  mediaId: string;
}) {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<LogStatus | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isBook = mediaType === "book";

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("user_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("media_type", mediaType)
          .eq("media_id", mediaId)
          .maybeSingle();

        if (data) {
          setStatus(data.status);
          setRating(data.rating);
          setReviewText(data.review_text || "");
        }
      }
      setLoaded(true);
    }
    load();
  }, [supabase, mediaType, mediaId]);

  async function saveLog(newStatus: LogStatus) {
    if (!user) return;
    setSaving(true);
    setStatus(newStatus);

    await supabase.from("user_logs").upsert(
      {
        user_id: user.id,
        media_type: mediaType,
        media_id: mediaId,
        status: newStatus,
        rating,
        review_text: reviewText || null,
      },
      { onConflict: "user_id,media_type,media_id" }
    );
    setSaving(false);
  }

  async function saveRating(newRating: number) {
    if (!user) return;
    setSaving(true);
    setRating(newRating);

    // Auto-set to completed when rating
    const newStatus = status || "completed";
    setStatus(newStatus);

    await supabase.from("user_logs").upsert(
      {
        user_id: user.id,
        media_type: mediaType,
        media_id: mediaId,
        status: newStatus,
        rating: newRating,
        review_text: reviewText || null,
      },
      { onConflict: "user_id,media_type,media_id" }
    );
    setSaving(false);
  }

  async function saveReview() {
    if (!user) return;
    setSaving(true);

    const newStatus = status || "completed";
    setStatus(newStatus);

    await supabase.from("user_logs").upsert(
      {
        user_id: user.id,
        media_type: mediaType,
        media_id: mediaId,
        status: newStatus,
        rating,
        review_text: reviewText || null,
      },
      { onConflict: "user_id,media_type,media_id" }
    );
    setSaving(false);
    setShowReview(false);
  }

  if (!loaded) {
    return (
      <div className="mt-8 animate-pulse rounded-lg border border-zinc-800 p-6">
        <div className="h-10 w-full rounded bg-zinc-800" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-8 rounded-lg border border-zinc-800 p-6 text-center">
        <p className="text-sm text-zinc-400">
          <Link href="/auth/login" className="text-white hover:underline">
            Log in
          </Link>{" "}
          to track, rate, and review.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-zinc-800 p-6">
      {/* Status buttons */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => saveLog(opt.value)}
            disabled={saving}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              status === opt.value
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {isBook ? opt.bookLabel : opt.label}
          </button>
        ))}
      </div>

      {/* Rating */}
      {status && (
        <div className="mt-4 flex items-center gap-4">
          <StarRating rating={rating} onRate={saveRating} />
          {rating && (
            <span className="text-sm text-zinc-500">{rating}/5</span>
          )}
        </div>
      )}

      {/* Review */}
      {status && (
        <div className="mt-4">
          {!showReview && !reviewText && (
            <button
              onClick={() => setShowReview(true)}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Write a review...
            </button>
          )}

          {(showReview || reviewText) && (
            <div className="space-y-3">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think?"
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveReview}
                  disabled={saving}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Review"}
                </button>
                <button
                  onClick={() => {
                    setShowReview(false);
                    if (!reviewText) setReviewText("");
                  }}
                  className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {saving && (
        <p className="mt-2 text-xs text-zinc-600">Saving...</p>
      )}
    </div>
  );
}
