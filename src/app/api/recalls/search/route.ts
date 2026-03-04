/**
 * GET /api/recalls/search -- Full-text search with PostgreSQL ts_rank.
 *
 * Query params:
 *   q           - Search query (required, min 2 chars)
 *   page        - Page number (default: 1)
 *   limit       - Results per page (default: 20, max: 100)
 *   state       - Two-letter state abbreviation
 *   category    - Product category
 *   severity    - Classification: "I", "II", or "III"
 *   source      - "FDA" or "USDA"
 *   reason      - Reason category
 *   start_date  - ISO date, filters reportDate >= value
 *   end_date    - ISO date, filters reportDate <= value
 *
 * Response: { data: RecallEventSerialized[], pagination: { page, limit, total, totalPages } }
 *
 * Uses Prisma $queryRaw with plainto_tsquery and ts_rank for relevance-ranked results.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  serializeRecallEvent,
  parsePagination,
  parseFilters,
} from "@/lib/api-utils";
import type { RecallEvent as PrismaRecallEvent } from "@/generated/prisma/client/client";

export const dynamic = "force-dynamic";

/**
 * The raw SQL result has the same shape as a recall_events row plus a rank column.
 * We cast it to PrismaRecallEvent after processing.
 */
interface RawSearchRow {
  id: string;
  source: string;
  recall_number: string;
  classification: string;
  status: string;
  product_description: string;
  product_category: string;
  reason: string;
  reason_category: string;
  recalling_firm: string;
  distribution_states: string[];
  nationwide: boolean;
  report_date: Date;
  recall_initiation_date: Date | null;
  city: string | null;
  state: string | null;
  quantity: string | null;
  url: string | null;
  ai_summary: string | null;
  created_at: Date;
  updated_at: Date;
  rank: number;
}

interface CountResult {
  count: bigint;
}

/**
 * Convert a raw SQL row (snake_case) back to the Prisma model shape (camelCase)
 * so we can reuse serializeRecallEvent.
 */
function rawToPrismaRecallEvent(row: RawSearchRow): PrismaRecallEvent {
  return {
    id: row.id,
    source: row.source,
    recallNumber: row.recall_number,
    classification: row.classification,
    status: row.status,
    productDescription: row.product_description,
    productCategory: row.product_category,
    reason: row.reason,
    reasonCategory: row.reason_category,
    recallingFirm: row.recalling_firm,
    distributionStates: row.distribution_states,
    nationwide: row.nationwide,
    reportDate: new Date(row.report_date),
    recallInitiationDate: row.recall_initiation_date
      ? new Date(row.recall_initiation_date)
      : null,
    city: row.city,
    state: row.state,
    quantity: row.quantity,
    url: row.url,
    aiSummary: row.ai_summary,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  } as PrismaRecallEvent;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // -- Validate search query ----------------------------------------------
    const q = searchParams.get("q");
    if (!q || q.trim().length < 2) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Query parameter `q` is required and must be at least 2 characters.",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const query = q.trim();

    // -- Parse & validate pagination ----------------------------------------
    const paginationResult = parsePagination(searchParams);
    if (!paginationResult.ok) return paginationResult.error;
    const { page, limit, skip } = paginationResult.value;

    // -- Parse & validate filters -------------------------------------------
    const filtersResult = parseFilters(searchParams);
    if (!filtersResult.ok) return filtersResult.error;
    const filters = filtersResult.value;

    // -- Build dynamic SQL filter conditions --------------------------------
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Full-text search condition is always present
    conditions.push(
      `(
        to_tsvector('english', r.product_description || ' ' || r.recalling_firm || ' ' || r.reason)
        @@ plainto_tsquery('english', $${paramIndex})
      )`
    );
    params.push(query);
    paramIndex++;

    // State filter: distributionStates contains state OR nationwide
    if (filters.state) {
      conditions.push(
        `($${paramIndex}::text = ANY(r.distribution_states) OR r.nationwide = true)`
      );
      params.push(filters.state);
      paramIndex++;
    }

    if (filters.category) {
      conditions.push(`r.product_category = $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.severity) {
      conditions.push(`r.classification::text = $${paramIndex}`);
      params.push(filters.severity);
      paramIndex++;
    }

    if (filters.source) {
      conditions.push(`r.source::text = $${paramIndex}`);
      params.push(filters.source);
      paramIndex++;
    }

    if (filters.reason) {
      conditions.push(`r.reason_category = $${paramIndex}`);
      params.push(filters.reason);
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`r.report_date >= $${paramIndex}::timestamp`);
      params.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`r.report_date <= $${paramIndex}::timestamp`);
      params.push(new Date(filters.end_date));
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // -- Count total matches ------------------------------------------------
    const countSql = `
      SELECT COUNT(*)::bigint AS count
      FROM recall_events r
      WHERE ${whereClause}
    `;

    // -- Fetch ranked results with pagination -------------------------------
    const dataSql = `
      SELECT r.*,
        ts_rank(
          to_tsvector('english', r.product_description || ' ' || r.recalling_firm || ' ' || r.reason),
          plainto_tsquery('english', $1)
        ) AS rank
      FROM recall_events r
      WHERE ${whereClause}
      ORDER BY rank DESC, r.report_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, limit, skip];

    // Execute both queries in parallel
    const [countResult, rows] = await Promise.all([
      db.$queryRawUnsafe<CountResult[]>(countSql, ...params),
      db.$queryRawUnsafe<RawSearchRow[]>(dataSql, ...dataParams),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: rows.map((row) => serializeRecallEvent(rawToPrismaRecallEvent(row))),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[GET /api/recalls/search] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Search failed. Please try again later.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
