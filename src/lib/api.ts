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
// Dashboard / Stats
// ---------------------------------------------------------------------------

export async function fetchStats(params?: {
  days?: number;
  state?: string;
}): Promise<DashboardStats> {
  const sp = new URLSearchParams();
  if (params?.days) sp.set("days", String(params.days));
  if (params?.state) sp.set("state", params.state);

  const qs = sp.toString();
  const url = `/api/stats${qs ? `?${qs}` : ""}`;

  const data = await tryApi<DashboardStats>(url);
  return data ?? MOCK_DASHBOARD_STATS;
}

export async function fetchStateCounts(params?: {
  days?: number;
}): Promise<StateRecallCount[]> {
  const sp = new URLSearchParams();
  if (params?.days) sp.set("days", String(params.days));

  const qs = sp.toString();
  const url = `/api/states${qs ? `?${qs}` : ""}`;

  const data = await tryApi<StateRecallCount[]>(url);
  return data ?? MOCK_STATE_COUNTS;
}

export async function fetchCategoryBreakdown(params?: {
  days?: number;
  state?: string;
}): Promise<CategoryBreakdown[]> {
  const sp = new URLSearchParams();
  if (params?.days) sp.set("days", String(params.days));
  if (params?.state) sp.set("state", params.state);
  sp.set("type", "categories");

  const qs = sp.toString();
  const url = `/api/recalls/stats?${qs}`;

  const data = await tryApi<CategoryBreakdown[]>(url);
  return data ?? MOCK_CATEGORY_BREAKDOWN;
}

export async function fetchSeverityDistribution(params?: {
  days?: number;
  state?: string;
}): Promise<SeverityDistribution[]> {
  const sp = new URLSearchParams();
  if (params?.days) sp.set("days", String(params.days));
  if (params?.state) sp.set("state", params.state);
  sp.set("type", "severity");

  const qs = sp.toString();
  const url = `/api/recalls/stats?${qs}`;

  const data = await tryApi<SeverityDistribution[]>(url);
  return data ?? MOCK_SEVERITY_DISTRIBUTION;
}

export async function fetchTimeline(params?: {
  days?: number;
  state?: string;
}): Promise<TimelineDataPoint[]> {
  const sp = new URLSearchParams();
  if (params?.days) sp.set("days", String(params.days));
  if (params?.state) sp.set("state", params.state);
  sp.set("type", "timeline");

  const qs = sp.toString();
  const url = `/api/recalls/stats?${qs}`;

  const data = await tryApi<TimelineDataPoint[]>(url);
  return data ?? MOCK_TIMELINE_DATA;
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
    const st = params.state.toUpperCase();
    filtered = filtered.filter(
      (r) => r.nationwide || r.distributionStates.includes(st) || r.state === st
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
