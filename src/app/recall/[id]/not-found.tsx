import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

export default function RecallNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page-bg px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-severity-i-bg">
        <Search className="h-8 w-8 text-severity-i" />
      </div>

      <h1 className="font-display text-3xl text-text-primary">
        Recall Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        The recall you are looking for does not exist or may have been removed.
        Try searching for it or browse the latest recalls on the dashboard.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-lg bg-canvas-dark px-5 py-2.5 text-sm font-medium text-text-on-dark transition-colors hover:bg-canvas-dark/90"
        >
          <Search className="h-4 w-4" />
          Search Recalls
        </Link>
      </div>
    </div>
  );
}
