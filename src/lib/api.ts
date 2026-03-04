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
  MOCK_STATE_COUNTS,
  MOCK_CATEGORY_BREAKDOWN,
  MOCK_SEVERITY_DISTRIBUTION,
  MOCK_TIMELINE_DATA,
  paginateMockRecalls,
} from "@/lib/mock-data";

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
 */
async function tryApi<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (res.status === 501) return null;
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
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

  const data = await tryApi<DashboardStats>(url);
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

  return {
    totalActiveRecalls: filtered.length,
    fdaCount,
    usdaCount,
    topReasonCategory: topReason,
    lastUpdated: MOCK_DASHBOARD_STATS.lastUpdated,
  };
}

export async function fetchStateCounts(params?: FilterParams): Promise<StateRecallCount[]> {
  const sp = buildSearchParams(params);
  const qs = sp.toString();
  const url = `/api/states${qs ? `?${qs}` : ""}`;

  const data = await tryApi<StateRecallCount[]>(url);
  if (data) return data;

  // Mock fallback — always recompute from filtered recalls
  const filtered = filterMockRecalls(MOCK_RECALLS, {
    ...params,
    state: undefined, // don't filter by state for the state counts
  });
  const counts: Record<string, { count: number; fdaCount: number; usdaCount: number }> = {};
  for (const r of filtered) {
    for (const st of r.distributionStates) {
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

  const data = await tryApi<CategoryBreakdown[]>(url);
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

  const data = await tryApi<SeverityDistribution[]>(url);
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

  const data = await tryApi<TimelineDataPoint[]>(url);
  if (data) return data;

  // Mock fallback — always recompute from filtered recalls
  const filtered = filterMockRecalls(MOCK_RECALLS, params);
  const byDate: Record<string, TimelineDataPoint> = {};

  for (const r of filtered) {
    const date = r.reportDate.split("T")[0];
    if (!byDate[date]) {
      byDate[date] = { date, count: 0, fdaCount: 0, usdaCount: 0, classI: 0, classII: 0, classIII: 0 };
    }
    byDate[date].count++;
    if (r.source === "FDA") byDate[date].fdaCount++;
    else byDate[date].usdaCount++;
    if (r.classification === "I") byDate[date].classI++;
    else if (r.classification === "II") byDate[date].classII++;
    else byDate[date].classIII++;
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
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

  const data = await tryApi<PaginatedResponse<RecallEventSerialized>>(url);
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
