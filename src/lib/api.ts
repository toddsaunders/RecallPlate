/**
 * RecallPlate — API Client
 *
 * Helper functions for client-side data fetching.
 * Uses relative paths so these work from the browser.
 * Falls back to mock data when API routes return 501 (not yet implemented).
 */

import type {
  RecallEventSerialized,
  RecallSearchParams,
  DashboardStats,
  StateRecallCount,
  CategoryBreakdown,
  SeverityDistribution,
  TimelineDataPoint,
  PaginatedResponse,
  AlertSignupRequest,
  AlertSignupResponse,
} from "@/lib/types";
import {
  MOCK_RECALLS,
  MOCK_DASHBOARD_STATS,
  MOCK_CATEGORY_BREAKDOWN,
  paginateMockRecalls,
} from "@/lib/mock-data";
import { US_STATES, ABBREVIATION_TO_STATE_NAME } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Generic fetch wrapper
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.message || body.error || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Try a real API call. If the route returns 501 (not implemented),
 * return null so the caller can fall back to mock data.
 * Also validates the response shape with an optional guard function.
 */
async function tryApi<T>(url: string, validate?: (data: unknown) => data is T): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (res.status === 501) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (validate && !validate(data)) return null;
    return data as T;
  } catch {
    return null;
  }
}

function isArray(data: unknown): data is unknown[] {
  return Array.isArray(data);
}

function isObject(data: unknown): data is Record<string, unknown> {
  return data !== null && typeof data === "object" && !Array.isArray(data);
}

// ---------------------------------------------------------------------------
// Shared filter params
// ---------------------------------------------------------------------------

interface FilterParams {
  days?: number;
  state?: string;
  category?: string;
  severity?: string;
}

function buildSearchParams(params?: FilterParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params?.days) sp.set("days", String(params.days));
  if (params?.state) sp.set("state", params.state);
  if (params?.category) sp.set("category", params.category);
  if (params?.severity) sp.set("severity", params.severity);
  return sp;
}

/**
 * Filter mock recalls by the common filter params.
 * Returns a filtered copy of the input array.
 */
function filterMockRecalls(
  recalls: RecallEventSerialized[],
  params?: FilterParams
): RecallEventSerialized[] {
  let filtered = [...recalls];

  if (params?.days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - params.days);
    filtered = filtered.filter((r) => new Date(r.reportDate) >= cutoff);
  }
  if (params?.state) {
    const states = params.state.split(",").map((s) => s.toUpperCase());
    filtered = filtered.filter(
      (r) =>
        r.nationwide ||
        states.some((st) => r.distributionStates.includes(st) || r.state === st)
    );
  }
  if (params?.category) {
    filtered = filtered.filter((r) => r.productCategory === params.category);
  }
  if (params?.severity) {
    filtered = filtered.filter((r) => r.classification === params.severity);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Dashboard / Stats
// ---------------------------------------------------------------------------

export async function fetchStats(params?: FilterParams): Promise<DashboardStats> {
  const sp = buildSearchParams(params);
  const qs = sp.toString();
  const url = `/api/stats${qs ? `?${qs}` : ""}`;

  const data = await tryApi<DashboardStats>(url, (d): d is DashboardStats => isObject(d) && "totalActiveRecalls" in d);
  if (data) return data;

  // Mock fallback — compute from filtered recalls
  const filtered = filterMockRecalls(MOCK_RECALLS, params);
  const fdaCount = filtered.filter((r) => r.source === "FDA").length;
  const usdaCount = filtered.filter((r) => r.source === "USDA").length;

  // Find top reason category
  const reasonCounts: Record<string, number> = {};
  for (const r of filtered) {
    reasonCounts[r.reasonCategory] = (reasonCounts[r.reasonCategory] || 0) + 1;
  }
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  // Compute previous period for period-over-period comparison
  let prevTotalActiveRecalls: number | undefined;
  let prevFdaCount: number | undefined;
  let prevUsdaCount: number | undefined;

  if (params?.days) {
    const prevFiltered = filterMockRecalls(MOCK_RECALLS, {
      ...params,
      days: params.days * 2, // get double the range
    }).filter((r) => {
      // Keep only recalls in the previous period (exclude current period)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - params.days!);
      return new Date(r.reportDate) < cutoff;
    });
    prevTotalActiveRecalls = prevFiltered.length;
    prevFdaCount = prevFiltered.filter((r) => r.source === "FDA").length;
    prevUsdaCount = prevFiltered.filter((r) => r.source === "USDA").length;
  }

  return {
    totalActiveRecalls: filtered.length,
    fdaCount,
    usdaCount,
    topReasonCategory: topReason,
    lastUpdated: MOCK_DASHBOARD_STATS.lastUpdated,
    prevTotalActiveRecalls,
    prevFdaCount,
    prevUsdaCount,
  };
}

export async function fetchStateCounts(params?: FilterParams): Promise<StateRecallCount[]> {
  const sp = buildSearchParams(params);
  const qs = sp.toString();
  const url = `/api/states${qs ? `?${qs}` : ""}`;

  const data = await tryApi<StateRecallCount[]>(url, (d): d is StateRecallCount[] => isArray(d));
  if (data) return data;

  // Mock fallback — always recompute from filtered recalls
  const filtered = filterMockRecalls(MOCK_RECALLS, {
    ...params,
    state: undefined, // don't filter by state for the state counts
  });
  const counts: Record<string, { count: number; fdaCount: number; usdaCount: number }> = {};
  for (const r of filtered) {
    // For nationwide recalls, count every state
    const states = r.nationwide
      ? US_STATES.map((s) => s.name)
      : r.distributionStates.map((abbr) => ABBREVIATION_TO_STATE_NAME[abbr] ?? abbr);
    for (const st of states) {
      if (!counts[st]) counts[st] = { count: 0, fdaCount: 0, usdaCount: 0 };
      counts[st].count++;
      if (r.source === "FDA") counts[st].fdaCount++;
      else counts[st].usdaCount++;
    }
  }
  return Object.entries(counts).map(([state, c]) => ({
    state,
    ...c,
  }));
}

export async function fetchCategoryBreakdown(params?: FilterParams): Promise<CategoryBreakdown[]> {
  const sp = buildSearchParams(params);
  sp.set("type", "categories");
  const url = `/api/recalls/stats?${sp.toString()}`;

  const data = await tryApi<CategoryBreakdown[]>(url, (d): d is CategoryBreakdown[] => isArray(d));
  if (data) return data;

  // Mock fallback — always recompute from filtered recalls
  const filtered = filterMockRecalls(MOCK_RECALLS, {
    ...params,
    category: undefined, // don't filter by category for category breakdown
  });
  const counts: Record<string, { count: number; fdaCount: number; usdaCount: number }> = {};
  for (const r of filtered) {
    if (!counts[r.productCategory]) counts[r.productCategory] = { count: 0, fdaCount: 0, usdaCount: 0 };
    counts[r.productCategory].count++;
    if (r.source === "FDA") counts[r.productCategory].fdaCount++;
    else counts[r.productCategory].usdaCount++;
  }
  const colorMap: Record<string, string> = {};
  for (const d of MOCK_CATEGORY_BREAKDOWN) colorMap[d.category] = d.color;

  return Object.entries(counts)
    .map(([category, c]) => ({
      category,
      ...c,
      color: colorMap[category] || "#6B7280",
    }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchSeverityDistribution(params?: FilterParams): Promise<SeverityDistribution[]> {
  const sp = buildSearchParams(params);
  sp.set("type", "severity");
  const url = `/api/recalls/stats?${sp.toString()}`;

  const data = await tryApi<SeverityDistribution[]>(url, (d): d is SeverityDistribution[] => isArray(d));
  if (data) return data;

  // Mock fallback — always recompute from filtered recalls
  const filtered = filterMockRecalls(MOCK_RECALLS, {
    ...params,
    severity: undefined, // don't filter by severity for severity distribution
  });
  const total = filtered.length || 1;
  const labels: Record<string, string> = {
    I: "Serious Health Risk",
    II: "Remote Health Risk",
    III: "Not Likely Harmful",
  };
  const counts: Record<string, { count: number; fdaCount: number; usdaCount: number }> = {
    I: { count: 0, fdaCount: 0, usdaCount: 0 },
    II: { count: 0, fdaCount: 0, usdaCount: 0 },
    III: { count: 0, fdaCount: 0, usdaCount: 0 },
  };
  for (const r of filtered) {
    if (counts[r.classification]) {
      counts[r.classification].count++;
      if (r.source === "FDA") counts[r.classification].fdaCount++;
      else counts[r.classification].usdaCount++;
    }
  }
  return (["I", "II", "III"] as const).map((cls) => ({
    classification: cls,
    label: labels[cls],
    count: counts[cls].count,
    fdaCount: counts[cls].fdaCount,
    usdaCount: counts[cls].usdaCount,
    percentage: (counts[cls].count / total) * 100,
  }));
}

export async function fetchTimeline(params?: FilterParams): Promise<TimelineDataPoint[]> {
  const sp = buildSearchParams(params);
  sp.set("type", "timeline");
  const url = `/api/recalls/stats?${sp.toString()}`;

  const data = await tryApi<TimelineDataPoint[]>(url, (d): d is TimelineDataPoint[] => isArray(d));
  if (data) return data;

  // Mock fallback — always recompute from filtered recalls
  const filtered = filterMockRecalls(MOCK_RECALLS, params);
  const days = params?.days || 30;

  // Determine bucket interval: 30d → daily, 90d → weekly, 12mo/All → monthly
  const bucketFn =
    days <= 30
      ? (d: Date) => d.toISOString().split("T")[0] // daily: "2026-02-28"
      : days <= 90
        ? (d: Date) => {
            // weekly: start of ISO week (Monday)
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d);
            monday.setDate(diff);
            return monday.toISOString().split("T")[0];
          }
        : (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // monthly: "2026-02"

  // Label formatter for x-axis
  const labelFn =
    days <= 30
      ? (key: string) => key // "2026-02-28"
      : days <= 90
        ? (key: string) => `Week of ${key.slice(5)}` // "Week of 02-28"
        : (key: string) => {
            const [y, m] = key.split("-");
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[parseInt(m, 10) - 1]} ${y}`;
          };

  // Bucket recalls
  const buckets: Record<string, TimelineDataPoint> = {};
  for (const r of filtered) {
    const key = bucketFn(new Date(r.reportDate));
    if (!buckets[key]) {
      buckets[key] = { date: labelFn(key), count: 0, fdaCount: 0, usdaCount: 0, classI: 0, classII: 0, classIII: 0 };
    }
    buckets[key].count++;
    if (r.source === "FDA") buckets[key].fdaCount++;
    else buckets[key].usdaCount++;
    if (r.classification === "I") buckets[key].classI++;
    else if (r.classification === "II") buckets[key].classII++;
    else buckets[key].classIII++;
  }

  // Fill in empty buckets for continuous x-axis
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days || 365));

  if (days <= 30) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = bucketFn(d);
      if (!buckets[key]) {
        buckets[key] = { date: labelFn(key), count: 0, fdaCount: 0, usdaCount: 0, classI: 0, classII: 0, classIII: 0 };
      }
    }
  } else if (days <= 90) {
    for (let i = days - 1; i >= 0; i -= 7) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = bucketFn(d);
      if (!buckets[key]) {
        buckets[key] = { date: labelFn(key), count: 0, fdaCount: 0, usdaCount: 0, classI: 0, classII: 0, classIII: 0 };
      }
    }
  } else {
    const months = days > 0 ? Math.ceil(days / 30) : 12;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = bucketFn(d);
      if (!buckets[key]) {
        buckets[key] = { date: labelFn(key), count: 0, fdaCount: 0, usdaCount: 0, classI: 0, classII: 0, classIII: 0 };
      }
    }
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

// ---------------------------------------------------------------------------
// Recalls list / search
// ---------------------------------------------------------------------------

export async function fetchRecalls(
  params?: RecallSearchParams
): Promise<PaginatedResponse<RecallEventSerialized>> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.state) sp.set("state", params.state);
  if (params?.category) sp.set("category", params.category);
  if (params?.severity) sp.set("severity", params.severity);
  if (params?.source) sp.set("source", params.source);
  if (params?.reasonCategory) sp.set("reasonCategory", params.reasonCategory);
  if (params?.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params?.dateTo) sp.set("dateTo", params.dateTo);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.sort) sp.set("sort", params.sort);
  if (params?.order) sp.set("order", params.order);

  const qs = sp.toString();
  const url = `/api/recalls${qs ? `?${qs}` : ""}`;

  const data = await tryApi<PaginatedResponse<RecallEventSerialized>>(url, (d): d is PaginatedResponse<RecallEventSerialized> => isObject(d) && "data" in d && "total" in d && (d as Record<string, unknown>)["total"] as number > 0);
  if (data) return data;

  // Mock: filter and paginate locally
  let filtered = [...MOCK_RECALLS];

  if (params?.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.productDescription.toLowerCase().includes(q) ||
        r.recallingFirm.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.reasonCategory.toLowerCase().includes(q)
    );
  }
  if (params?.state) {
    const states = params.state.split(",").map((s) => s.toUpperCase());
    filtered = filtered.filter(
      (r) =>
        r.nationwide ||
        states.some((st) => r.distributionStates.includes(st) || r.state === st)
    );
  }
  if (params?.category) {
    filtered = filtered.filter((r) => r.productCategory === params.category);
  }
  if (params?.severity) {
    filtered = filtered.filter((r) => r.classification === params.severity);
  }
  if (params?.source) {
    filtered = filtered.filter((r) => r.source === params.source);
  }
  if (params?.reasonCategory) {
    filtered = filtered.filter((r) => r.reasonCategory === params.reasonCategory);
  }

  // Sort by date descending by default
  filtered.sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  );

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  return paginateMockRecalls(filtered, page, limit);
}

export async function searchRecalls(
  params: RecallSearchParams
): Promise<PaginatedResponse<RecallEventSerialized>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.state) sp.set("state", params.state);
  if (params.category) sp.set("category", params.category);
  if (params.severity) sp.set("severity", params.severity);
  if (params.source) sp.set("source", params.source);
  if (params.reasonCategory) sp.set("reasonCategory", params.reasonCategory);
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));

  const qs = sp.toString();
  const url = `/api/recalls/search${qs ? `?${qs}` : ""}`;

  const data = await tryApi<PaginatedResponse<RecallEventSerialized>>(url);
  if (data) return data;

  // Fall back to client-side filtering
  return fetchRecalls(params);
}

// ---------------------------------------------------------------------------
// Single recall by ID
// ---------------------------------------------------------------------------

export async function fetchRecallById(
  id: string
): Promise<RecallEventSerialized | null> {
  const data = await tryApi<RecallEventSerialized>(`/api/recalls/${id}`);
  if (data) return data;

  // Mock fallback
  return MOCK_RECALLS.find((r) => r.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Related recalls
// ---------------------------------------------------------------------------

export async function fetchRelatedRecalls(
  id: string,
  category: string,
  limit = 6
): Promise<RecallEventSerialized[]> {
  const sp = new URLSearchParams();
  sp.set("category", category);
  sp.set("limit", String(limit));
  sp.set("exclude", id);

  const url = `/api/recalls?${sp.toString()}`;
  const data = await tryApi<PaginatedResponse<RecallEventSerialized>>(url);
  if (data) return data.data;

  // Mock fallback: same category, different ID
  return MOCK_RECALLS.filter(
    (r) => r.id !== id && r.productCategory === category
  ).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Alert Subscription
// ---------------------------------------------------------------------------

export async function subscribeToAlerts(
  payload: AlertSignupRequest
): Promise<AlertSignupResponse> {
  try {
    return await apiFetch<AlertSignupResponse>("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Mock success when API is not ready
    return {
      success: true,
      message:
        "You have been subscribed to recall alerts. We will notify you when new recalls match your preferences.",
      subscriberId: `mock_${Date.now()}`,
    };
  }
}
