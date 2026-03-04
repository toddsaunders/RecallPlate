"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page-bg px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-severity-i-bg">
        <AlertTriangle className="h-8 w-8 text-severity-i" aria-hidden="true" />
      </div>

      <h1 className="font-display text-3xl text-text-primary">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        An unexpected error occurred. This might be a temporary issue. Please try
        again, or return to the dashboard.
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-xs text-text-secondary">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary",
            "shadow-sm transition-colors hover:bg-gray-50"
          )}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-canvas-dark px-5 py-2.5 text-sm font-medium text-text-on-dark transition-colors hover:bg-canvas-dark/90"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
