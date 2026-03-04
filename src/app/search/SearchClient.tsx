"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PRODUCT_CATEGORIES,
  REASON_CATEGORIES,
  US_STATES,
  SEVERITY_LABELS,
} from "@/lib/constants";
import type {
  RecallEventSerialized,
  RecallClassification,
  RecallSource,
  RecallSearchParams,
} from "@/lib/types";
import { RecallCard, RecallCardSkeleton } from "@/components/cards/RecallCard";
// Badge components available if needed for filter chips
// import { SeverityBadge, SourceBadge, CategoryBadge, ReasonBadge } from "@/components/ui/Badge";
import { AlertCTA } from "@/components/forms/AlertCTA";
import { searchRecalls } from "@/lib/api";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse initial state from URL
  const initialQuery = searchParams.get("q") || "";
  const initialStates = searchParams.get("state")?.split(",").filter(Boolean) || [];
  const initialCategories = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const initialSeverities = searchParams.get("severity")?.split(",").filter(Boolean) || [];
  const initialSource = (searchParams.get("source") as RecallSource | null) || null;
  const initialReasons = searchParams.get("reason")?.split(",").filter(Boolean) || [];
  const initialDateFrom = searchParams.get("dateFrom") || "";
  const initialDateTo = searchParams.get("dateTo") || "";

  // State
  const [query, setQuery] = useState(initialQuery);
  const [selectedStates, setSelectedStates] = useState<string[]>(initialStates);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(initialSeverities);
  const [selectedSource, setSelectedSource] = useState<RecallSource | null>(initialSource);
  const [selectedReasons, setSelectedReasons] = useState<string[]>(initialReasons);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [showFilters, setShowFilters] = useState(false);
  const [stateSearch, setStateSearch] = useState("");

  // Results state
  const [results, setResults] = useState<RecallEventSerialized[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce timer
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Build search params object
  const buildParams = useCallback(
    (pageNum: number): RecallSearchParams => {
      const params: RecallSearchParams = {
        page: pageNum,
        limit: 12,
        sort: "date",
        order: "desc",
      };
      if (query.length >= 2) params.q = query;
      if (selectedStates.length === 1) params.state = selectedStates[0];
      if (selectedCategories.length === 1) params.category = selectedCategories[0];
      if (selectedSeverities.length === 1)
        params.severity = selectedSeverities[0] as RecallClassification;
      if (selectedSource) params.source = selectedSource;
      if (selectedReasons.length === 1) params.reasonCategory = selectedReasons[0];
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      return params;
    },
    [query, selectedStates, selectedCategories, selectedSeverities, selectedSource, selectedReasons, dateFrom, dateTo]
  );

  // Update URL to reflect current search state
  const syncURL = useCallback(() => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (selectedStates.length) sp.set("state", selectedStates.join(","));
    if (selectedCategories.length) sp.set("category", selectedCategories.join(","));
    if (selectedSeverities.length) sp.set("severity", selectedSeverities.join(","));
    if (selectedSource) sp.set("source", selectedSource);
    if (selectedReasons.length) sp.set("reason", selectedReasons.join(","));
    if (dateFrom) sp.set("dateFrom", dateFrom);
    if (dateTo) sp.set("dateTo", dateTo);

    const qs = sp.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, query, selectedStates, selectedCategories, selectedSeverities, selectedSource, selectedReasons, dateFrom, dateTo]);

  // Execute search
  const executeSearch = useCallback(async () => {
    const needsQuery = query.length >= 2;
    const hasFilters =
      selectedStates.length > 0 ||
      selectedCategories.length > 0 ||
      selectedSeverities.length > 0 ||
      selectedSource !== null ||
      selectedReasons.length > 0 ||
      dateFrom ||
      dateTo;

    if (!needsQuery && !hasFilters) {
      setResults([]);
      setTotalResults(0);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setPage(1);
    setHasSearched(true);
    syncURL();

    try {
      const data = await searchRecalls(buildParams(1));
      setResults(data.data);
      setTotalResults(data.total);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedStates, selectedCategories, selectedSeverities, selectedSource, selectedReasons, dateFrom, dateTo, buildParams, syncURL]);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      executeSearch();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [executeSearch]);

  // Load more
  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await searchRecalls(buildParams(nextPage));
      setResults((prev) => [...prev, ...data.data]);
      setPage(nextPage);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, buildParams]);

  // Toggle helpers
  const toggleState = (abbr: string) => {
    setSelectedStates((prev) =>
      prev.includes(abbr) ? prev.filter((s) => s !== abbr) : [...prev, abbr]
    );
  };
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const toggleSeverity = (sev: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };
  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  // Clear all filters
  const clearAll = () => {
    setQuery("");
    setSelectedStates([]);
    setSelectedCategories([]);
    setSelectedSeverities([]);
    setSelectedSource(null);
    setSelectedReasons([]);
    setDateFrom("");
    setDateTo("");
    setResults([]);
    setTotalResults(0);
    setHasSearched(false);
    router.replace("/search", { scroll: false });
    inputRef.current?.focus();
  };

  // Count active filters (excluding query)
  const activeFilterCount =
    selectedStates.length +
    selectedCategories.length +
    selectedSeverities.length +
    (selectedSource ? 1 : 0) +
    selectedReasons.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  // Filtered state list for typeahead
  const filteredStates = useMemo(() => {
    if (!stateSearch) return US_STATES;
    const q = stateSearch.toLowerCase();
    return US_STATES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.abbreviation.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  const hasMore = results.length < totalResults;

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // If URL had search params, run initial search
  useEffect(() => {
    if (initialQuery || initialStates.length || initialCategories.length || initialSeverities.length) {
      // The debounced effect will handle this
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-page-bg">
      <main className="mx-auto max-w-7xl px-[var(--spacing-page-x-mobile)] py-6 sm:px-[var(--spacing-page-x)]">
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, or companies..."
            className={cn(
              "w-full rounded-[var(--radius-lg)] border border-border bg-surface py-3.5 pl-12 pr-10 text-base text-text-primary",
              "shadow-[var(--shadow-card)] placeholder:text-text-secondary/60",
              "transition-shadow duration-[var(--duration-micro)]",
              "focus:shadow-[var(--shadow-card-hover)] focus:outline-none focus:ring-2 focus:ring-folder-blue/30"
            )}
            aria-label="Search recalls"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter toggle + active chips */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium",
              "transition-colors duration-[var(--duration-micro)]",
              showFilters
                ? "border-canvas-dark bg-canvas-dark text-text-on-dark"
                : "border-border bg-surface text-text-primary hover:bg-gray-50"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-folder-blue text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          {selectedStates.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => toggleState(st)}
              className="inline-flex items-center gap-1 rounded-full bg-folder-orange/10 px-2.5 py-1 text-xs font-medium text-folder-orange"
            >
              {st}
              <X className="h-3 w-3" />
            </button>
          ))}
          {selectedCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="inline-flex items-center gap-1 rounded-full bg-folder-teal/10 px-2.5 py-1 text-xs font-medium text-folder-teal"
            >
              {cat}
              <X className="h-3 w-3" />
            </button>
          ))}
          {selectedSeverities.map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => toggleSeverity(sev)}
              className="inline-flex items-center gap-1 rounded-full bg-severity-i-bg px-2.5 py-1 text-xs font-medium text-severity-i"
            >
              Class {sev}: {SEVERITY_LABELS[sev]}
              <X className="h-3 w-3" />
            </button>
          ))}
          {selectedSource && (
            <button
              type="button"
              onClick={() => setSelectedSource(null)}
              className="inline-flex items-center gap-1 rounded-full bg-folder-blue/10 px-2.5 py-1 text-xs font-medium text-folder-blue"
            >
              {selectedSource}
              <X className="h-3 w-3" />
            </button>
          )}
          {selectedReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => toggleReason(reason)}
              className="inline-flex items-center gap-1 rounded-full bg-folder-purple/10 px-2.5 py-1 text-xs font-medium text-folder-purple"
            >
              {reason}
              <X className="h-3 w-3" />
            </button>
          ))}
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-text-secondary"
            >
              {dateFrom || "..."} - {dateTo || "..."}
              <X className="h-3 w-3" />
            </button>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-text-secondary underline hover:text-text-primary"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* State typeahead */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                  State
                </label>
                <input
                  type="text"
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  placeholder="Type to search states..."
                  className="mb-2 w-full rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-folder-blue/40"
                />
                <div className="max-h-36 overflow-y-auto rounded-md border border-border bg-page-bg">
                  {filteredStates.slice(0, 20).map((st) => (
                    <label
                      key={st.abbreviation}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                        "hover:bg-gray-100",
                        selectedStates.includes(st.abbreviation) && "bg-folder-blue/5"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(st.abbreviation)}
                        onChange={() => toggleState(st.abbreviation)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      <span>{st.name}</span>
                      <span className="text-text-secondary">({st.abbreviation})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Product Category */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Product Category
                </label>
                <div className="max-h-52 overflow-y-auto rounded-md border border-border bg-page-bg">
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                        "hover:bg-gray-100",
                        selectedCategories.includes(cat) && "bg-folder-teal/5"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Severity
                </label>
                <div className="space-y-2">
                  {(["I", "II", "III"] as const).map((sev) => (
                    <label
                      key={sev}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                        "transition-colors duration-[var(--duration-micro)]",
                        selectedSeverities.includes(sev)
                          ? "border-severity-i bg-severity-i-bg/50"
                          : "border-border hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSeverities.includes(sev)}
                        onChange={() => toggleSeverity(sev)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      <span className="font-medium">Class {sev}</span>
                      <span className="text-text-secondary">- {SEVERITY_LABELS[sev]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-folder-blue/40"
                    aria-label="Start date"
                  />
                  <span className="text-text-secondary">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-folder-blue/40"
                    aria-label="End date"
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Source
                </label>
                <div className="flex gap-2">
                  {(["FDA", "USDA"] as const).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() =>
                        setSelectedSource(selectedSource === src ? null : src)
                      }
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm font-medium",
                        "transition-colors duration-[var(--duration-micro)]",
                        selectedSource === src
                          ? src === "FDA"
                            ? "border-source-fda bg-source-fda-bg text-source-fda"
                            : "border-source-usda bg-source-usda-bg text-source-usda"
                          : "border-border text-text-secondary hover:bg-gray-50"
                      )}
                    >
                      {src}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedSource(null)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium",
                      "transition-colors duration-[var(--duration-micro)]",
                      selectedSource === null
                        ? "border-canvas-dark bg-canvas-dark text-text-on-dark"
                        : "border-border text-text-secondary hover:bg-gray-50"
                    )}
                  >
                    Both
                  </button>
                </div>
              </div>

              {/* Reason Category */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Reason Category
                </label>
                <div className="max-h-52 overflow-y-auto rounded-md border border-border bg-page-bg">
                  {REASON_CATEGORIES.map((reason) => (
                    <label
                      key={reason}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                        "hover:bg-gray-100",
                        selectedReasons.includes(reason) && "bg-folder-purple/5"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(reason)}
                        onChange={() => toggleReason(reason)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div>
            <div className="mb-4">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <RecallCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : hasSearched ? (
          <div>
            <p className="mb-4 text-sm text-text-secondary" aria-live="polite" role="status">
              Showing {results.length} of {totalResults} result{totalResults !== 1 ? "s" : ""}
            </p>

            {results.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-12 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-text-secondary/40" />
                <p className="mb-1 text-lg font-medium text-text-primary">
                  No recalls found
                </p>
                <p className="text-sm text-text-secondary">
                  Try adjusting your search terms or filters. You can also browse
                  all recalls from the{" "}
                  <Link href="/" className="text-folder-blue underline">
                    dashboard
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((recall) => (
                    <RecallCard key={recall.id} recall={recall} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-2.5 text-sm font-medium text-text-primary",
                        "shadow-[var(--shadow-card)] transition-all duration-[var(--duration-micro)]",
                        "hover:shadow-[var(--shadow-card-hover)]",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      {loadingMore ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-text-primary" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Load More
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Alert CTA at bottom */}
            <div className="mt-8">
              <AlertCTA />
            </div>
          </div>
        ) : (
          /* Initial state: no search yet */
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-text-secondary/40" />
            <p className="mb-1 text-lg font-medium text-text-primary">
              Search FDA & USDA food recalls
            </p>
            <p className="text-sm text-text-secondary">
              Enter a product name, brand, or company to find relevant recalls.
              Use filters to narrow your results.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
