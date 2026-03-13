export default function BookLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-28 rounded bg-zinc-800" />
      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-48">
          <div className="aspect-[2/3] rounded-lg bg-zinc-800" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-3/4 rounded bg-zinc-800" />
          <div className="h-5 w-1/2 rounded bg-zinc-800" />
          <div className="h-4 w-2/3 rounded bg-zinc-800" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-800" />
            <div className="h-4 w-3/4 rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
