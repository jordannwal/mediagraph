import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg text-zinc-400">
        That page doesn&apos;t exist.
      </p>
      <Link
        href="/search"
        className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        Go to Search
      </Link>
    </div>
  );
}
