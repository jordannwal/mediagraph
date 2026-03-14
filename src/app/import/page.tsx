"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import { useEffect } from "react";
import Link from "next/link";

type ImportSource = "letterboxd" | "goodreads";

interface ParsedEntry {
  title: string;
  rating: number | null;
  date: string | null;
  status: "completed" | "want";
}

function parseLetterboxdCSV(text: string): ParsedEntry[] {
  const lines = text.split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const cols = header.split(",").map((c) => c.trim().replace(/"/g, ""));

  const nameIdx = cols.findIndex((c) => c === "name" || c === "title");
  const ratingIdx = cols.findIndex((c) => c === "rating");
  const dateIdx = cols.findIndex((c) => c === "date" || c === "watched date");

  const entries: ParsedEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parse (handles quoted fields)
    const fields = parseCSVLine(line);
    const title = fields[nameIdx]?.replace(/"/g, "").trim();
    if (!title) continue;

    const ratingStr = fields[ratingIdx]?.trim();
    const rating = ratingStr ? Math.round(parseFloat(ratingStr)) : null;
    const date = fields[dateIdx]?.trim() || null;

    entries.push({ title, rating: rating && rating >= 1 && rating <= 5 ? rating : null, date, status: "completed" });
  }
  return entries;
}

function parseGoodreadsCSV(text: string): ParsedEntry[] {
  const lines = text.split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const cols = header.split(",").map((c) => c.trim().replace(/"/g, ""));

  const titleIdx = cols.findIndex((c) => c === "title");
  const ratingIdx = cols.findIndex((c) => c === "my rating");
  const shelfIdx = cols.findIndex((c) => c === "exclusive shelf" || c === "bookshelves");
  const dateIdx = cols.findIndex((c) => c === "date read");

  const entries: ParsedEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    const title = fields[titleIdx]?.replace(/"/g, "").trim();
    if (!title) continue;

    const ratingStr = fields[ratingIdx]?.trim();
    const rating = ratingStr ? parseInt(ratingStr) : null;
    const shelf = fields[shelfIdx]?.replace(/"/g, "").trim().toLowerCase();
    const date = fields[dateIdx]?.trim() || null;

    const status: "completed" | "want" =
      shelf === "to-read" || shelf === "want-to-read" ? "want" : "completed";

    entries.push({ title, rating: rating && rating >= 1 && rating <= 5 ? rating : null, date, status });
  }
  return entries;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export default function ImportPage() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<ImportSource>("letterboxd");
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [matched, setMatched] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed =
        source === "letterboxd"
          ? parseLetterboxdCSV(text)
          : parseGoodreadsCSV(text);
      setEntries(parsed);
      setDone(false);
      setImported(0);
      setMatched(0);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!user || entries.length === 0) return;
    setImporting(true);
    setImported(0);
    setMatched(0);

    let matchCount = 0;
    let importCount = 0;

    for (const entry of entries) {
      const searchTerm = `%${entry.title}%`;

      if (source === "letterboxd") {
        // Match against screen_media
        const { data } = await supabase
          .from("screen_media")
          .select("id")
          .ilike("title", searchTerm)
          .limit(1)
          .maybeSingle();

        if (data) {
          matchCount++;
          const { error } = await supabase.from("user_logs").upsert(
            {
              user_id: user.id,
              media_type: "screen" as const,
              media_id: data.id,
              status: entry.status,
              rating: entry.rating,
            },
            { onConflict: "user_id,media_type,media_id" }
          );
          if (!error) importCount++;
        }
      } else {
        // Match against books
        const { data } = await supabase
          .from("books")
          .select("id")
          .ilike("title", searchTerm)
          .limit(1)
          .maybeSingle();

        if (data) {
          matchCount++;
          const { error } = await supabase.from("user_logs").upsert(
            {
              user_id: user.id,
              media_type: "book" as const,
              media_id: data.id,
              status: entry.status,
              rating: entry.rating,
            },
            { onConflict: "user_id,media_type,media_id" }
          );
          if (!error) importCount++;
        }
      }

      setImported((prev) => prev + 1);
    }

    setMatched(matchCount);
    setImported(importCount);
    setImporting(false);
    setDone(true);
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-zinc-800/50" />;
  }

  if (!user) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Import</h1>
        <p className="mt-2 text-zinc-400">
          <Link href="/auth/login" className="text-white hover:underline">Log in</Link>{" "}
          to import your data.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Import Data</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Import your ratings and watchlist from Letterboxd or Goodreads via CSV export.
      </p>

      {/* Source selector */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => { setSource("letterboxd"); setEntries([]); setDone(false); }}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            source === "letterboxd"
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Letterboxd
        </button>
        <button
          onClick={() => { setSource("goodreads"); setEntries([]); setDone(false); }}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            source === "goodreads"
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Goodreads
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 rounded-lg border border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-white">
          How to export from {source === "letterboxd" ? "Letterboxd" : "Goodreads"}
        </h3>
        {source === "letterboxd" ? (
          <ol className="mt-2 space-y-1 text-sm text-zinc-400">
            <li>1. Go to letterboxd.com/settings/data</li>
            <li>2. Click &quot;Export Your Data&quot;</li>
            <li>3. Upload the <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">watched.csv</code> file below</li>
          </ol>
        ) : (
          <ol className="mt-2 space-y-1 text-sm text-zinc-400">
            <li>1. Go to goodreads.com/review/import</li>
            <li>2. Click &quot;Export Library&quot;</li>
            <li>3. Upload the <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">goodreads_library_export.csv</code> file below</li>
          </ol>
        )}
      </div>

      {/* File upload */}
      <div className="mt-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-zinc-700"
        />
      </div>

      {/* Preview */}
      {entries.length > 0 && !done && (
        <div className="mt-6">
          <p className="text-sm text-zinc-400">
            Found <span className="font-medium text-white">{entries.length}</span> entries.
            Preview:
          </p>
          <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Rating</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 20).map((entry, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="px-4 py-2 text-white">{entry.title}</td>
                    <td className="px-4 py-2 text-yellow-400">
                      {entry.rating ? "★".repeat(entry.rating) : "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{entry.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length > 20 && (
              <p className="px-4 py-2 text-xs text-zinc-600">
                ...and {entries.length - 20} more
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-4 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {importing
              ? `Importing... (${imported}/${entries.length})`
              : `Import ${entries.length} entries`}
          </button>
        </div>
      )}

      {/* Results */}
      {done && (
        <div className="mt-6 rounded-lg border border-zinc-800 p-6 text-center">
          <p className="text-lg font-medium text-white">Import Complete</p>
          <p className="mt-2 text-sm text-zinc-400">
            Matched <span className="text-white">{matched}</span> of{" "}
            <span className="text-white">{entries.length}</span> entries in our database.
          </p>
          <p className="text-sm text-zinc-400">
            Successfully imported <span className="text-white">{imported}</span> logs.
          </p>
          <p className="mt-3 text-xs text-zinc-600">
            Entries that didn&apos;t match are titles not yet in our catalogue.
          </p>
          <Link
            href={`/profile/${user.user_metadata?.username || user.id}`}
            className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            View Profile
          </Link>
        </div>
      )}
    </div>
  );
}
