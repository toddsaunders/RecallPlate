export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header skeleton */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {/* Search input skeleton */}
        <div className="mb-4 h-12 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />

        {/* Filters skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
        </div>

        {/* Results skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-[var(--radius-md)] border border-border bg-surface"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
