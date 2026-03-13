import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        MediaGraph
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-400">
        Track books you&apos;ve read and films you&apos;ve watched. Discover the
        adaptations that connect them.
      </p>
      <Link
        href="/search"
        className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        Start Searching
      </Link>
    </div>
  );
}
