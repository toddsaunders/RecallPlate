/**
 * RecallPlate -- Shared API Utilities
 *
 * Helper functions used across all API route handlers:
 * - Serialization (Prisma Date objects -> ISO strings)
 * - Common Prisma where-clause builders
 * - Input validation helpers
 * - Error response builders
 */

import { NextResponse } from "next/server";
import type { RecallEvent as PrismaRecallEvent } from "@/generated/prisma/client/client";
import type { RecallEventSerialized } from "@/lib/types";
import {
  STATE_ABBREVIATIONS,
  PRODUCT_CATEGORIES,
  REASON_CATEGORIES,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Convert a Prisma RecallEvent (with Date objects) to a serialized version
 * (with ISO strings) suitable for JSON responses.
 */
export function serializeRecallEvent(
  event: PrismaRecallEvent
): RecallEventSerialized {
  return {
    id: event.id,
    source: event.source as RecallEventSerialized["source"],
    recallNumber: event.recallNumber,
    classification:
      event.classification as RecallEventSerialized["classification"],
    status: event.status,
    productDescription: event.productDescription,
    productCategory: event.productCategory,
    reason: event.reason,
    reasonCategory: event.reasonCategory,
    recallingFirm: event.recallingFirm,
    distributionStates: event.distributionStates,
    nationwide: event.nationwide,
    reportDate: event.reportDate.toISOString(),
    recallInitiationDate: event.recallInitiationDate?.toISOString() ?? null,
    city: event.city,
    state: event.state,
    quantity: event.quantity,
    url: event.url,
    aiSummary: event.aiSummary,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parse and validate page/limit query params.
 * Returns null + error response if invalid.
 */
export function parsePagination(
  searchParams: URLSearchParams
): { ok: true; value: ParsedPagination } | { ok: false; error: NextResponse } {
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");

  const page = rawPage ? parseInt(rawPage, 10) : 1;
  const limit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_PAGE_SIZE;

  if (isNaN(page) || page < 1) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Invalid parameter", message: "`page` must be a positive integer." },
        { status: 400 }
      ),
    };
  }

  if (isNaN(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: `\`limit\` must be between 1 and ${MAX_PAGE_SIZE}.`,
        },
        { status: 400 }
      ),
    };
  }

  return {
    ok: true,
    value: { page, limit, skip: (page - 1) * limit },
  };
}

// ---------------------------------------------------------------------------
// Filter where-clause builder
// ---------------------------------------------------------------------------

/**
 * All optional filter params accepted by the list and search endpoints.
 */
export interface RecallFilters {
  state?: string;
  category?: string;
  severity?: string;
  source?: string;
  reason?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Parse common filter query params from the URL search params.
 * Returns either the valid parsed filters or a 400 NextResponse.
 */
export function parseFilters(
  searchParams: URLSearchParams
): { ok: true; value: RecallFilters } | { ok: false; error: NextResponse } {
  const state = searchParams.get("state") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  const reason = searchParams.get("reason") ?? undefined;
  const start_date = searchParams.get("start_date") ?? undefined;
  const end_date = searchParams.get("end_date") ?? undefined;

  // Validate state
  if (state && !(STATE_ABBREVIATIONS as readonly string[]).includes(state)) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: `\`state\` must be a valid two-letter US state abbreviation. Received: "${state}".`,
        },
        { status: 400 }
      ),
    };
  }

  // Validate category
  if (
    category &&
    !(PRODUCT_CATEGORIES as readonly string[]).includes(category)
  ) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: `\`category\` must be one of: ${PRODUCT_CATEGORIES.join(", ")}. Received: "${category}".`,
        },
        { status: 400 }
      ),
    };
  }

  // Validate severity
  if (severity && !["I", "II", "III"].includes(severity)) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: '`severity` must be one of: "I", "II", "III".',
        },
        { status: 400 }
      ),
    };
  }

  // Validate source
  if (source && !["FDA", "USDA"].includes(source)) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: '`source` must be one of: "FDA", "USDA".',
        },
        { status: 400 }
      ),
    };
  }

  // Validate reason
  if (reason && !(REASON_CATEGORIES as readonly string[]).includes(reason)) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: `\`reason\` must be one of: ${REASON_CATEGORIES.join(", ")}. Received: "${reason}".`,
        },
        { status: 400 }
      ),
    };
  }

  // Validate date formats
  if (start_date && isNaN(Date.parse(start_date))) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: "`start_date` must be a valid ISO date string (e.g., 2026-01-01).",
        },
        { status: 400 }
      ),
    };
  }

  if (end_date && isNaN(Date.parse(end_date))) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: "`end_date` must be a valid ISO date string (e.g., 2026-12-31).",
        },
        { status: 400 }
      ),
    };
  }

  return {
    ok: true,
    value: { state, category, severity, source, reason, start_date, end_date },
  };
}

// Prisma where clauses are deeply nested dynamic objects.
type PrismaWhere = Record<string, any>;

/**
 * Build a Prisma `where` clause from the parsed filters.
 *
 * State filter logic: distribution_states array contains the state OR nationwide = true.
 */
export function buildWhereClause(filters: RecallFilters): PrismaWhere {
  const where: PrismaWhere = {};

  // State: distributionStates has state OR nationwide
  if (filters.state) {
    where.OR = [
      { distributionStates: { has: filters.state } },
      { nationwide: true },
    ];
  }

  if (filters.category) {
    where.productCategory = filters.category;
  }

  if (filters.severity) {
    where.classification = filters.severity;
  }

  if (filters.source) {
    where.source = filters.source;
  }

  if (filters.reason) {
    where.reasonCategory = filters.reason;
  }

  // Date range
  if (filters.start_date || filters.end_date) {
    where.reportDate = {};
    if (filters.start_date) {
      where.reportDate.gte = new Date(filters.start_date);
    }
    if (filters.end_date) {
      where.reportDate.lte = new Date(filters.end_date);
    }
  }

  return where;
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  report_date: "reportDate",
  reportDate: "reportDate",
  date: "reportDate",
  classification: "classification",
  severity: "classification",
  source: "source",
  productCategory: "productCategory",
  category: "productCategory",
  recallingFirm: "recallingFirm",
  createdAt: "createdAt",
};

export function parseSortOrder(
  searchParams: URLSearchParams
): { ok: true; value: { orderBy: Record<string, string> } } | { ok: false; error: NextResponse } {
  const rawSort = searchParams.get("sort") ?? "report_date";
  const rawOrder = searchParams.get("order") ?? "desc";

  const prismaField = ALLOWED_SORT_FIELDS[rawSort];
  if (!prismaField) {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: `\`sort\` must be one of: ${Object.keys(ALLOWED_SORT_FIELDS).join(", ")}.`,
        },
        { status: 400 }
      ),
    };
  }

  if (rawOrder !== "asc" && rawOrder !== "desc") {
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: "Invalid parameter",
          message: '`order` must be "asc" or "desc".',
        },
        { status: 400 }
      ),
    };
  }

  return {
    ok: true,
    value: { orderBy: { [prismaField]: rawOrder } },
  };
}

// ---------------------------------------------------------------------------
// Error response helpers
// ---------------------------------------------------------------------------

export function errorResponse(
  message: string,
  statusCode: number = 500
): NextResponse {
  return NextResponse.json(
    {
      error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
      message,
      statusCode,
    },
    { status: statusCode }
  );
}
