/**
 * Wikidata Adaptation Import Script
 *
 * Fetches book-to-film/series adaptation relationships from Wikidata
 * and generates SQL insert statements for the MediaGraph database.
 *
 * Usage: npx tsx scripts/import-wikidata.ts > supabase/seed_wikidata.sql
 */

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

// SPARQL query: find films based on novels (simplified for performance)
const SPARQL_QUERY = `
SELECT DISTINCT
  ?book ?bookLabel ?authorLabel
  ?film ?filmLabel ?directorLabel ?filmDate
WHERE {
  ?film wdt:P144 ?book .
  ?book wdt:P31 wd:Q7725634 .
  ?film wdt:P31 wd:Q11424 .
  OPTIONAL { ?book wdt:P50 ?author . }
  OPTIONAL { ?film wdt:P57 ?director . }
  OPTIONAL { ?film wdt:P577 ?filmDate . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 300
`;

interface WikidataResult {
  book: { value: string };
  bookLabel: { value: string };
  authorLabel?: { value: string };
  film: { value: string };
  filmLabel: { value: string };
  directorLabel?: { value: string };
  filmDate?: { value: string };
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function extractYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

function generateUUID(prefix: string, index: number): string {
  const hex = index.toString(16).padStart(12, "0");
  return `${prefix}-0000-0000-0000-${hex}`;
}

async function main() {
  console.log("-- Wikidata adaptation import");
  console.log(`-- Generated: ${new Date().toISOString()}`);
  console.log("-- Run the genre migration (00003_phase4_genres.sql) before this file\n");

  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(SPARQL_QUERY)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "MediaGraph/1.0 (https://mediagraph2.vercel.app; educational project)",
    },
  });

  if (!response.ok) {
    console.error(`Wikidata query failed: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json();
  const results: WikidataResult[] = data.results.bindings;

  console.error(`Fetched ${results.length} results from Wikidata`);

  // Deduplicate books and films by Wikidata ID
  const books = new Map<string, { label: string; author: string; isbn: string | null; wikidataId: string }>();
  const films = new Map<string, { label: string; director: string | null; date: string | null; type: string; wikidataId: string }>();
  const adaptations: { bookWd: string; filmWd: string; year: number | null; type: string }[] = [];

  for (const r of results) {
    const bookWd = r.book.value;
    const filmWd = r.film.value;

    if (!books.has(bookWd)) {
      books.set(bookWd, {
        label: r.bookLabel.value,
        author: r.authorLabel?.value || "Unknown",
        isbn: null,
        wikidataId: bookWd.split("/").pop()!,
      });
    }

    if (!films.has(filmWd)) {
      films.set(filmWd, {
        label: r.filmLabel.value,
        director: r.directorLabel?.value || null,
        date: r.filmDate?.value || null,
        type: "film",
        wikidataId: filmWd.split("/").pop()!,
      });
    }

    // Avoid duplicate adaptation links
    const key = `${bookWd}-${filmWd}`;
    if (!adaptations.find((a) => `${a.bookWd}-${a.filmWd}` === key)) {
      adaptations.push({
        bookWd,
        filmWd,
        year: extractYear(r.filmDate?.value),
        type: "film",
      });
    }
  }

  // Filter out entries that look like Wikidata IDs (not resolved labels)
  const validBooks = new Map(
    [...books.entries()].filter(([, b]) => !b.label.startsWith("Q") && b.label.length > 1)
  );
  const validFilms = new Map(
    [...films.entries()].filter(([, f]) => !f.label.startsWith("Q") && f.label.length > 1)
  );

  console.error(`Valid books: ${validBooks.size}, films: ${validFilms.size}`);

  // Assign UUIDs — use "b2" prefix to avoid collision with existing seed data
  let bookIdx = 1;
  const bookUUIDs = new Map<string, string>();
  for (const [wd] of validBooks) {
    bookUUIDs.set(wd, generateUUID("b2000001", bookIdx++));
  }

  let filmIdx = 1;
  const filmUUIDs = new Map<string, string>();
  for (const [wd] of validFilms) {
    filmUUIDs.set(wd, generateUUID("d2000001", filmIdx++));
  }

  // Generate SQL - Books
  console.log("-- ============================================================");
  console.log("-- BOOKS (from Wikidata)");
  console.log("-- ============================================================");

  for (const [wd, book] of validBooks) {
    const uuid = bookUUIDs.get(wd)!;
    const isbn = book.isbn ? `'${escapeSQL(book.isbn)}'` : "null";
    const coverUrl = book.isbn
      ? `'https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg'`
      : "null";

    console.log(
      `INSERT INTO books (id, title, author, isbn, cover_image_url) VALUES ('${uuid}', '${escapeSQL(book.label)}', '${escapeSQL(book.author)}', ${isbn}, ${coverUrl}) ON CONFLICT DO NOTHING;`
    );
  }

  // Generate SQL - Screen Media
  console.log("\n-- ============================================================");
  console.log("-- SCREEN MEDIA (from Wikidata)");
  console.log("-- ============================================================");

  for (const [wd, film] of validFilms) {
    const uuid = filmUUIDs.get(wd)!;
    const director = film.director ? `'${escapeSQL(film.director)}'` : "null";
    const releaseDate = film.date ? `'${film.date.split("T")[0]}'` : "null";
    const type = film.type === "series" ? "series" : "film";

    console.log(
      `INSERT INTO screen_media (id, title, type, director, release_date) VALUES ('${uuid}', '${escapeSQL(film.label)}', '${type}', ${director}, ${releaseDate}) ON CONFLICT DO NOTHING;`
    );
  }

  // Generate SQL - Adaptations
  console.log("\n-- ============================================================");
  console.log("-- ADAPTATIONS (from Wikidata)");
  console.log("-- ============================================================");

  for (const a of adaptations) {
    const bookUUID = bookUUIDs.get(a.bookWd);
    const filmUUID = filmUUIDs.get(a.filmWd);
    if (!bookUUID || !filmUUID) continue;

    const year = a.year ? a.year.toString() : "null";
    const type = a.type === "series" ? "series" : "film";

    console.log(
      `INSERT INTO adaptations (book_id, screen_media_id, adaptation_type, release_year) VALUES ('${bookUUID}', '${filmUUID}', '${type}', ${year}) ON CONFLICT DO NOTHING;`
    );
  }

  console.error(`\nGenerated SQL for ${validBooks.size} books, ${validFilms.size} films, ${adaptations.length} adaptations`);
}

main().catch(console.error);
