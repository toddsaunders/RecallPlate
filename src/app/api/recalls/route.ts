/**
 * GET /api/recalls -- List recalls with filtering, sorting, and pagination.
 *
 * Query params:
 *   page        - Page number (default: 1)
 *   limit       - Results per page (default: 20, max: 100)
 *   state       - Two-letter state abbreviation (filters distributionStates OR nationwide)
 *   category    - Product category (one of PRODUCT_CATEGORIES)
 *   severity    - Classification: "I", "II", or "III"
 *   source      - "FDA" or "USDA"
 *   reason      - Reason category (one of REASON_CATEGORIES)
 *   start_date  - ISO date string, filters reportDate >= value
 *   end_date    - ISO date string, filters reportDate <= value
 *   sort        - Sort field (default: "report_date")
 *   order       - "asc" or "desc" (default: "desc")
 *
 * Response: { data: RecallEventSerialized[], pagination: { page, limit, total, totalPages } }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  serializeRecallEvent,
  parsePagination,
  parseFilters,
  parseSortOrder,
  buildWhereClause,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // -- Parse & validate pagination ----------------------------------------
    const paginationResult = parsePagination(searchParams);
    if (!paginationResult.ok) return paginationResult.error;
    const { page, limit, skip } = paginationResult.value;

    // -- Parse & validate filters -------------------------------------------
    const filtersResult = parseFilters(searchParams);
    if (!filtersResult.ok) return filtersResult.error;
    const filters = filtersResult.value;

    // -- Parse & validate sort order ----------------------------------------
    const sortResult = parseSortOrder(searchParams);
    if (!sortResult.ok) return sortResult.error;
    const { orderBy } = sortResult.value;

    // -- Build Prisma where clause ------------------------------------------
    const where = buildWhereClause(filters);

    // -- Execute queries in parallel ----------------------------------------
    const [data, total] = await Promise.all([
      db.recallEvent.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.recallEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: data.map(serializeRecallEvent),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[GET /api/recalls] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch recalls. Please try again later.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
