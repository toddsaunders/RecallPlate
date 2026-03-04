/**
 * RecallPlate — Shared TypeScript Types
 *
 * These interfaces mirror the Prisma schema but are framework-agnostic
 * so they can be used in both server and client contexts without importing Prisma.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type RecallSource = "FDA" | "USDA";

export type RecallClassification = "I" | "II" | "III";

export type RecallStatus = "Ongoing" | "Completed" | "Terminated";

export type SyncSource = "FDA_FOOD" | "FDA_ANIMAL" | "USDA";

export type SyncStatus = "running" | "completed" | "failed";

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

/** Unified recall event — the normalized shape from both FDA and USDA sources. */
export interface RecallEvent {
  id: string;
  source: RecallSource;
  recallNumber: string;
  classification: RecallClassification;
  status: string;
  productDescription: string;
  productCategory: string;
  reason: string;
  reasonCategory: string;
  recallingFirm: string;
  distributionStates: string[];
  nationwide: boolean;
  reportDate: Date;
  recallInitiationDate: Date | null;
  city: string | null;
  state: string | null;
  quantity: string | null;
  url: string | null;
  aiSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Serialized version of RecallEvent for API responses (dates as ISO strings). */
export interface RecallEventSerialized {
  id: string;
  source: RecallSource;
  recallNumber: string;
  classification: RecallClassification;
  status: string;
  productDescription: string;
  productCategory: string;
  reason: string;
  reasonCategory: string;
  recallingFirm: string;
  distributionStates: string[];
  nationwide: boolean;
  reportDate: string;
  recallInitiationDate: string | null;
  city: string | null;
  state: string | null;
  quantity: string | null;
  url: string | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Alert subscriber — email capture for recall notifications. */
export interface AlertSubscriber {
  id: string;
  email: string;
  state: string;
  categories: string[];
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** ETL sync log entry. */
export interface SyncLog {
  id: string;
  source: string;
  startedAt: Date;
  completedAt: Date | null;
  recordsFetched: number;
  recordsUpserted: number;
  recordsSkipped: number;
  errors: number;
  errorDetails: unknown | null;
  status: string;
}

// ---------------------------------------------------------------------------
// API Request Types
// ---------------------------------------------------------------------------

/** Query parameters for GET /api/recalls */
export interface RecallSearchParams {
  q?: string;
  state?: string;
  category?: string;
  severity?: RecallClassification;
  source?: RecallSource;
  reasonCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: "date" | "severity";
  order?: "asc" | "desc";
}

/** Body for POST /api/alerts (subscriber signup) */
export interface AlertSignupRequest {
  email: string;
  state: string;
  categories?: string[];
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

/** Paginated list response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Dashboard summary statistics. */
export interface DashboardStats {
  totalActiveRecalls: number;
  fdaCount: number;
  usdaCount: number;
  topReasonCategory: string;
  lastUpdated: string;
}

/** State-level recall count for the choropleth map. */
export interface StateRecallCount {
  state: string;
  count: number;
  fdaCount: number;
  usdaCount: number;
}

/** Category breakdown for the bar chart. */
export interface CategoryBreakdown {
  category: string;
  count: number;
  color: string;
}

/** Severity distribution for the donut chart. */
export interface SeverityDistribution {
  classification: RecallClassification;
  label: string;
  count: number;
  percentage: number;
}

/** Timeline data point. */
export interface TimelineDataPoint {
  date: string;
  count: number;
  classI: number;
  classII: number;
  classIII: number;
}

/** Generic API error response. */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/** Successful alert signup response. */
export interface AlertSignupResponse {
  success: boolean;
  message: string;
  subscriberId: string;
}
