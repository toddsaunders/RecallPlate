"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  MapPin,
  X,
  ChevronDown,
  BarChart3,
  Table2,
  Egg,
  Beef,
  Fish,
  Apple,
  Wheat,
  Candy,
  CupSoda,
  Nut,
  UtensilsCrossed,
  Droplets,
  Baby,
  Pill,
  PawPrint,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  RecallEventSerialized,
  DashboardStats,
  CategoryBreakdown as CategoryBreakdownData,
  SeverityDistribution,
  TimelineDataPoint,
  StateRecallCount,
  RecallClassification,
} from "@/lib/types";

import dynamic from "next/dynamic";

import { SummaryCards, type SummaryCardData } from "@/components/cards/SummaryCards";
import { DataTable, type ColumnDef, type SortState } from "@/components/ui/DataTable";
import { FilterDropdown, type FilterOption } from "@/components/ui/FilterDropdown";
import { SeverityBadge } from "@/components/ui/Badge";
import { AlertCTA } from "@/components/forms/AlertCTA";
import { ChartErrorBoundary } from "@/components/ui/ChartErrorBoundary";

// Lazy-loaded heavy components
const USMap = dynamic(
  () => import("@/components/map/USMap").then((m) => m.USMap),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded bg-gray-100" /> }
);
const TimelineChart = dynamic(
  () => import("@/components/charts/TimelineChart").then((m) => m.TimelineChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded bg-gray-100" /> }
);
const CategoryBreakdownChart = dynamic(
  () => import("@/components/charts/CategoryBreakdown").then((m) => m.CategoryBreakdown),
  { ssr: false, loading: () => <div className="h-80 animate-pulse rounded bg-gray-100" /> }
);
const SeverityDonut = dynamic(
  () => import("@/components/charts/SeverityDonut").then((m) => m.SeverityDonut),
  { ssr: false, loading: () => <div className="h-80 animate-pulse rounded bg-gray-100" /> }
);

import {
  fetchStats,
  fetchStateCounts,
  fetchCategoryBreakdown,
  fetchSeverityDistribution,
  fetchTimeline,
  fetchRecalls,
} from "@/lib/api";
import { stateCountsToMap } from "@/lib/mock-data";
import { formatDate, truncate } from "@/lib/utils";
import { US_STATES, PRODUCT_CATEGORIES, SEVERITY_LABELS, ABBREVIATION_TO_STATE_NAME } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_RANGES = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12mo", days: 365 },
  { label: "All", days: 0 },
] as const;

type TimeRange = (typeof TIME_RANGES)[number];
type ViewMode = "dashboard" | "table";

const STATE_OPTIONS: FilterOption[] = US_STATES.map((s) => ({
  value: s.abbreviation,
  label: s.name,
}));

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Dairy & Eggs": Egg,
  "Meat & Poultry": Beef,
  "Seafood & Fish": Fish,
  "Fruits & Vegetables": Apple,
  "Grains & Bakery": Wheat,
  "Snacks & Candy": Candy,
  "Beverages": CupSoda,
  "Nuts & Seeds": Nut,
  "Prepared/Frozen Meals": UtensilsCrossed,
  "Condiments & Sauces": Droplets,
  "Baby Food & Formula": Baby,
  "Supplements & Vitamins": Pill,
  "Pet Food": PawPrint,
  "Other": Package,
};

const CATEGORY_OPTIONS: FilterOption[] = PRODUCT_CATEGORIES.map((cat) => {
  const Icon = CATEGORY_ICONS[cat];
  return {
    value: cat,
    label: cat,
    icon: Icon ? <Icon className="h-4 w-4" /> : undefined,
  };
});

const SEVERITY_ICON_MAP: Record<string, { Icon: LucideIcon; color: string }> = {
  I: { Icon: ShieldAlert, color: "text-red-500" },
  II: { Icon: ShieldOff, color: "text-amber-500" },
  III: { Icon: ShieldCheck, color: "text-emerald-500" },
};

const SEVERITY_OPTIONS: FilterOption[] = Object.entries(SEVERITY_LABELS).map(
  ([key, label]) => {
    const entry = SEVERITY_ICON_MAP[key];
    return {
      value: key,
      label: `Class ${key} — ${label}`,
      icon: entry ? <entry.Icon className={cn("h-4 w-4", entry.color)} /> : undefined,
    };
  }
);

// ---------------------------------------------------------------------------
// Table columns — clean, minimal
// ---------------------------------------------------------------------------

const recallTableColumns: ColumnDef<RecallEventSerialized>[] = [
  {
    id: "product",
    header: "Product",
    accessor: (row) => (
      <div className="min-w-0">
        <Link
          href={`/recall/${row.id}`}
          className="block truncate font-medium text-text-primary hover:underline"
        >
          {truncate(row.productDescription, 70)}
        </Link>
        <span className="block truncate text-xs text-text-secondary">
          {row.recallingFirm}
        </span>
      </div>
    ),
    sortValue: (row) => row.productDescription,
    width: "45%",
  },
  {
    id: "severity",
    header: "Severity",
    accessor: (row) => (
      <SeverityBadge classification={row.classification as RecallClassification} />
    ),
    sortValue: (row) => row.classification,
  },
  {
    id: "category",
    header: "Category",
    accessor: (row) => (
      <span className="whitespace-nowrap text-sm text-text-secondary">
        {row.productCategory}
      </span>
    ),
    sortValue: (row) => row.productCategory,
    hideOnMobile: true,
  },
  {
    id: "date",
    header: "Date",
    accessor: (row) => (
      <span className="whitespace-nowrap text-sm tabular-nums text-text-secondary">
        {formatDate(row.reportDate)}
      </span>
    ),
    sortValue: (row) => new Date(row.reportDate).getTime(),
    align: "right",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardClient() {
  // View & filters
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[0]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stateCounts, setStateCounts] = useState<StateRecallCount[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdownData[]>([]);
  const [severity, setSeverity] = useState<SeverityDistribution[]>([]);
  const [timeline, setTimeline] = useState<TimelineDataPoint[]>([]);
  const [recalls, setRecalls] = useState<RecallEventSerialized[]>([]);
  const [totalRecalls, setTotalRecalls] = useState(0);
  const [recallPage, setRecallPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Table sort
  const [sortState, setSortState] = useState<SortState | null>({
    columnId: "date",
    direction: "desc",
  });

  // Fetch data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setRecallPage(1);

    const stateParam = selectedStates.length > 0 ? selectedStates.join(",") : undefined;
    const params = {
      days: timeRange.days || undefined,
      state: stateParam,
      category: selectedCategory ?? undefined,
      severity: selectedSeverity ?? undefined,
    };

    try {
      const [statsData, stateData, catData, sevData, timeData, recallData] =
        await Promise.all([
          fetchStats(params),
          fetchStateCounts({ days: timeRange.days || undefined }),
          fetchCategoryBreakdown(params),
          fetchSeverityDistribution(params),
          fetchTimeline(params),
          fetchRecalls({
            state: stateParam,
            category: selectedCategory ?? undefined,
            severity: (selectedSeverity as RecallClassification) ?? undefined,
            page: 1,
            limit: 20,
            sort: "date",
            order: "desc",
          }),
        ]);

      setStats(statsData);
      setStateCounts(stateData);
      setCategories(catData);
      setSeverity(sevData);
      setTimeline(timeData);
      setRecalls(recallData.data);
      setTotalRecalls(recallData.total);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedStates, selectedCategory, selectedSeverity]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Load more
  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    const nextPage = recallPage + 1;
    const stateParam = selectedStates.length > 0 ? selectedStates.join(",") : undefined;
    try {
      const data = await fetchRecalls({
        state: stateParam,
        category: selectedCategory ?? undefined,
        severity: (selectedSeverity as RecallClassification) ?? undefined,
        page: nextPage,
        limit: 20,
        sort: "date",
        order: "desc",
      });
      setRecalls((prev) => [...prev, ...data.data]);
      setRecallPage(nextPage);
    } catch (err) {
      console.error("Failed to load more recalls:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [recallPage, selectedStates, selectedCategory, selectedSeverity]);

  // Derived
  const mapData = useMemo(() => stateCountsToMap(stateCounts), [stateCounts]);
  const hasActiveFilters = selectedStates.length > 0 || selectedCategory || selectedSeverity;
  const hasMore = recalls.length < totalRecalls;

  const sortedRecalls = useMemo(() => {
    if (!sortState) return recalls;
    const col = recallTableColumns.find((c) => c.id === sortState.columnId);
    if (!col?.sortValue) return recalls;
    return [...recalls].sort((a, b) => {
      const aVal = col.sortValue!(a);
      const bVal = col.sortValue!(b);
      if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [recalls, sortState]);

  // Handlers
  const handleCategoryClick = useCallback(
    (category: string) => {
      setSelectedCategory(selectedCategory === category ? null : category);
    },
    [selectedCategory]
  );

  const handleSeverityClick = useCallback(
    (classification: string) => {
      setSelectedSeverity(selectedSeverity === classification ? null : classification);
    },
    [selectedSeverity]
  );

  const clearFilters = useCallback(() => {
    setSelectedStates([]);
    setSelectedCategory(null);
    setSelectedSeverity(null);
  }, []);

  // Summary cards
  const summaryCards: SummaryCardData[] = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Active Recalls",
        value: stats.totalActiveRecalls.toLocaleString(),
        change: 12,
        sparklineData: timeline.map((t) => t.count),
        accentColor: "var(--color-danger)",
      },
      {
        label: "FDA Recalls",
        value: stats.fdaCount.toLocaleString(),
        change: 8,
        sparklineData: timeline.map((t) => t.classI + t.classII),
        accentColor: "var(--color-source-fda)",
      },
      {
        label: "USDA Recalls",
        value: stats.usdaCount.toLocaleString(),
        change: -3,
        sparklineData: timeline.map((t) => t.classIII),
        accentColor: "var(--color-source-usda)",
      },
      {
        label: "Top Reason",
        value: stats.topReasonCategory,
      },
    ];
  }, [stats, timeline]);

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Controls bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-[var(--spacing-page-x-mobile)] py-3 sm:px-[var(--spacing-page-x)]">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("dashboard")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-[var(--duration-micro)]",
                viewMode === "dashboard"
                  ? "bg-canvas-dark text-text-on-dark shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-[var(--duration-micro)]",
                viewMode === "table"
                  ? "bg-canvas-dark text-text-on-dark shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-border" />

          {/* Time range */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <Clock className="ml-2 h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
            {TIME_RANGES.map((range) => (
              <button
                key={range.label}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-[var(--duration-micro)]",
                  timeRange.label === range.label
                    ? "bg-canvas-dark text-text-on-dark shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Filter dropdowns */}
          <FilterDropdown
            multiple
            values={selectedStates}
            onValuesChange={setSelectedStates}
            options={STATE_OPTIONS}
            placeholder="All States"
            ariaLabel="Filter by state"
          />
          <FilterDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={CATEGORY_OPTIONS}
            placeholder="All Categories"
            ariaLabel="Filter by category"
          />
          <FilterDropdown
            value={selectedSeverity}
            onChange={setSelectedSeverity}
            options={SEVERITY_OPTIONS}
            placeholder="All Severities"
            ariaLabel="Filter by severity"
          />

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2" aria-live="polite" role="status">
              {selectedStates.map((st) => (
                <span key={st} className="inline-flex items-center gap-1 rounded-full bg-folder-orange/10 px-2.5 py-1 text-xs font-medium text-folder-orange">
                  <MapPin className="h-3 w-3" />
                  {ABBREVIATION_TO_STATE_NAME[st] ?? st}
                  <button type="button" onClick={() => setSelectedStates(selectedStates.filter((s) => s !== st))} className="ml-0.5 hover:text-folder-orange/70" aria-label={`Remove ${ABBREVIATION_TO_STATE_NAME[st] ?? st} filter`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-folder-teal/10 px-2.5 py-1 text-xs font-medium text-folder-teal">
                  {selectedCategory}
                  <button type="button" onClick={() => setSelectedCategory(null)} className="ml-0.5 hover:text-folder-teal/70" aria-label={`Remove ${selectedCategory} filter`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedSeverity && (
                <span className="inline-flex items-center gap-1 rounded-full bg-severity-i-bg px-2.5 py-1 text-xs font-medium text-severity-i">
                  Class {selectedSeverity}
                  <button type="button" onClick={() => setSelectedSeverity(null)} className="ml-0.5 hover:text-severity-i/70" aria-label={`Remove Class ${selectedSeverity} filter`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button type="button" onClick={clearFilters} className="text-xs text-text-secondary underline hover:text-text-primary">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* DASHBOARD VIEW                                                     */}
      {/* ================================================================== */}
      {viewMode === "dashboard" && (
        <main className="mx-auto max-w-7xl px-[var(--spacing-page-x-mobile)] py-6 sm:px-[var(--spacing-page-x)]">
          {/* Summary cards */}
          {loading ? (
            <div className="mb-6 grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-[var(--radius-md)] border border-border bg-surface" />
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <SummaryCards cards={summaryCards} />
            </div>
          )}

          {/* Map + Timeline */}
          <div className="mb-6 grid grid-cols-1 gap-[var(--spacing-card-gap)] lg:grid-cols-2">
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">Recalls by State</h2>
              {loading ? (
                <div className="h-64 animate-pulse rounded bg-gray-100" />
              ) : (
                <ChartErrorBoundary fallbackHeight="256px">
                  <USMap data={mapData} highlightedStates={selectedStates.length > 0 ? selectedStates.map((abbr) => ABBREVIATION_TO_STATE_NAME[abbr] ?? abbr) : undefined} size="full" />
                </ChartErrorBoundary>
              )}
            </section>

            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">Recall Timeline</h2>
              {loading ? (
                <div className="h-64 animate-pulse rounded bg-gray-100" />
              ) : (
                <ChartErrorBoundary fallbackHeight="256px">
                  <TimelineChart data={timeline} />
                </ChartErrorBoundary>
              )}
            </section>
          </div>

          {/* Categories + Severity */}
          <div className="mb-6 grid grid-cols-1 gap-[var(--spacing-card-gap)] lg:grid-cols-3">
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:col-span-2">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">By Category</h2>
              {loading ? (
                <div className="h-80 animate-pulse rounded bg-gray-100" />
              ) : (
                <ChartErrorBoundary fallbackHeight="320px">
                  <CategoryBreakdownChart data={categories} onCategoryClick={handleCategoryClick} />
                </ChartErrorBoundary>
              )}
            </section>

            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">By Severity</h2>
              {loading ? (
                <div className="h-80 animate-pulse rounded bg-gray-100" />
              ) : (
                <ChartErrorBoundary fallbackHeight="320px">
                  <SeverityDonut data={severity} onSegmentClick={handleSeverityClick} />
                </ChartErrorBoundary>
              )}
            </section>
          </div>

          <AlertCTA />
        </main>
      )}

      {/* ================================================================== */}
      {/* TABLE VIEW                                                         */}
      {/* ================================================================== */}
      {viewMode === "table" && (
        <main className="mx-auto max-w-7xl px-[var(--spacing-page-x-mobile)] py-6 sm:px-[var(--spacing-page-x)]">
          {/* Summary row — compact */}
          {!loading && stats && (
            <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-text-primary">
                {totalRecalls.toLocaleString()} recalls
              </span>
              <span className="text-text-secondary">
                FDA {stats.fdaCount.toLocaleString()} · USDA {stats.usdaCount.toLocaleString()}
              </span>
              <span className="text-text-secondary">
                Top reason: {stats.topReasonCategory}
              </span>
            </div>
          )}

          {/* Table card */}
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-xs text-text-secondary">
                {loading
                  ? "Loading..."
                  : `Showing ${recalls.length.toLocaleString()} of ${totalRecalls.toLocaleString()}`}
              </p>
              <Link
                href="/search"
                className="text-xs font-medium text-text-secondary hover:text-text-primary hover:underline"
              >
                Advanced Search →
              </Link>
            </div>

            <DataTable
              columns={recallTableColumns}
              data={sortedRecalls}
              getRowId={(row) => row.id}
              sort={sortState}
              onSort={setSortState}
              loading={loading}
            />

            {/* Load more */}
            {hasMore && !loading && (
              <div className="border-t border-border px-5 py-3 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium text-text-secondary",
                    "transition-colors duration-[var(--duration-micro)]",
                    "hover:bg-gray-50 hover:text-text-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {loadingMore ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-text-primary" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      Load more
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && recalls.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-text-secondary">No recalls match the current filters.</p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="mt-3 text-sm text-folder-blue underline hover:text-folder-blue/80">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
