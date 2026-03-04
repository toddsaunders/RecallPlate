export default function RecallDetailLoading() {
  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header skeleton */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {/* Badges skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-32 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
        </div>

        {/* Title skeleton */}
        <div className="mb-2 h-8 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mb-6 h-8 w-1/2 animate-pulse rounded bg-gray-200" />

        {/* Details grid skeleton */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
          <div className="flex flex-col gap-6">
            <div className="h-36 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
            <div className="h-36 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface" />
          </div>
        </div>
      </main>
    </div>
  );
}
