import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-[var(--spacing-page-x-mobile)] py-6 text-center sm:flex-row sm:justify-between sm:px-[var(--spacing-page-x)] sm:text-left">
        <p className="text-xs text-text-secondary">
          Data sourced from{" "}
          <a
            href="https://open.fda.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text-primary"
          >
            FDA
          </a>{" "}
          and{" "}
          <a
            href="https://www.fsis.usda.gov/recalls"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text-primary"
          >
            USDA FSIS
          </a>
        </p>

        <nav className="flex items-center gap-4" aria-label="Footer navigation">
          <Link
            href="/"
            className="text-xs text-text-secondary hover:text-text-primary hover:underline"
          >
            Dashboard
          </Link>
          <Link
            href="/search"
            className="text-xs text-text-secondary hover:text-text-primary hover:underline"
          >
            Search
          </Link>
          <Link
            href="/alerts"
            className="text-xs text-text-secondary hover:text-text-primary hover:underline"
          >
            Alerts
          </Link>
        </nav>
      </div>
    </footer>
  );
}
