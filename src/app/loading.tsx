export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header skeleton */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
          <div className="flex items-center gap-3">
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </header>

      {/* Controls bar skeleton */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Content skeleton */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[var(--radius-md)] border border-border bg-surface"
            />
          ))}
        </div>

        {/* Chart row */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
          <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
        </div>

        {/* Cards row */}
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
