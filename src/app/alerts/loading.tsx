export default function AlertsLoading() {
  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header skeleton */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        {/* Icon + title skeleton */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-gray-200" />
          <div className="mx-auto mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-4 w-80 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Form skeleton */}
        <div className="animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <div className="mb-5 space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-md bg-gray-100" />
          </div>
          <div className="mb-5 space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-md bg-gray-100" />
          </div>
          <div className="h-11 w-full rounded-lg bg-gray-200" />
        </div>
      </main>
    </div>
  );
}
