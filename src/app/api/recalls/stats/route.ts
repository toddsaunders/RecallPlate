/**
 * GET /api/recalls/stats -- Dashboard aggregation endpoint.
 *
 * Query params:
 *   state - Two-letter state abbreviation (optional, filters all aggregations)
 *   days  - Time window: 30, 90, 365, or 0 for all time (default: 30)
 *
 * Response:
 *   {
 *     total_active: number,
 *     by_source:    { FDA: number, USDA: number },
 *     by_severity:  { I: number, II: number, III: number },
 *     by_category:  Record<string, number>,
 *     by_reason:    Record<string, number>,
 *     by_state:     Record<string, number>,
 *     top_reason:   string,
 *     timeline:     Array<{ period: string, count: number }>,
 *     last_updated: string | null,
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STATE_ABBREVIATIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const VALID_DAYS = [0, 30, 90, 365];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // -- Validate params ----------------------------------------------------
    const rawDays = searchParams.get("days");
    const days = rawDays ? parseInt(rawDays, 10) : 30;
    if (isNaN(days) || !VALID_DAYS.includes(days)) {
      return NextResponse.json(
        {
          error: "Invalid parameter",
          message: `\`days\` must be one of: ${VALID_DAYS.join(", ")}. Received: "${rawDays}".`,
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const state = searchParams.get("state") ?? undefined;
    if (state && !(STATE_ABBREVIATIONS as readonly string[]).includes(state)) {
      return NextResponse.json(
        {
          error: "Invalid parameter",
          message: `\`state\` must be a valid two-letter US state abbreviation. Received: "${state}".`,
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // -- Build base where clause --------------------------------------------
    const where: Record<string, unknown> = {};

    // Date window
    if (days > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      where.reportDate = { gte: cutoff };
    }

    // State filter: distributionStates contains the state OR nationwide
    if (state) {
      where.OR = [
        { distributionStates: { has: state } },
        { nationwide: true },
      ];
    }

    // -- Run all aggregations in parallel -----------------------------------
    const [
      totalActive,
      bySourceRaw,
      bySeverityRaw,
      byCategoryRaw,
      byReasonRaw,
      allMatchingRecalls,
      lastSync,
      timelineRaw,
    ] = await Promise.all([
      // 1. Total count
      db.recallEvent.count({ where }),

      // 2. By source
      db.recallEvent.groupBy({
        by: ["source"],
        _count: { _all: true },
        where,
      }),

      // 3. By severity
      db.recallEvent.groupBy({
        by: ["classification"],
        _count: { _all: true },
        where,
      }),

      // 4. By category
      db.recallEvent.groupBy({
        by: ["productCategory"],
        _count: { _all: true },
        where,
        orderBy: { _count: { productCategory: "desc" } },
      }),

      // 5. By reason
      db.recallEvent.groupBy({
        by: ["reasonCategory"],
        _count: { _all: true },
        where,
        orderBy: { _count: { reasonCategory: "desc" } },
      }),

      // 6. For by_state we need to count per state from distributionStates arrays.
      //    Fetch only the fields we need for state counting.
      db.recallEvent.findMany({
        where,
        select: {
          distributionStates: true,
          nationwide: true,
        },
      }),

      // 7. Last sync log
      db.syncLog.findFirst({
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),

      // 8. Timeline: monthly buckets. We use groupBy on reportDate won't give us
      //    monthly buckets directly, so we fetch dates and bucket client-side.
      //    For performance, only select reportDate.
      db.recallEvent.findMany({
        where,
        select: { reportDate: true },
        orderBy: { reportDate: "asc" },
      }),
    ]);

    // -- Format by_source ---------------------------------------------------
    const bySource: Record<string, number> = { FDA: 0, USDA: 0 };
    for (const row of bySourceRaw) {
      bySource[row.source] = row._count._all;
    }

    // -- Format by_severity -------------------------------------------------
    const bySeverity: Record<string, number> = { I: 0, II: 0, III: 0 };
    for (const row of bySeverityRaw) {
      bySeverity[row.classification] = row._count._all;
    }

    // -- Format by_category -------------------------------------------------
    const byCategory: Record<string, number> = {};
    for (const row of byCategoryRaw) {
      byCategory[row.productCategory] = row._count._all;
    }

    // -- Format by_reason ---------------------------------------------------
    const byReason: Record<string, number> = {};
    for (const row of byReasonRaw) {
      byReason[row.reasonCategory] = row._count._all;
    }

    // -- Compute top_reason -------------------------------------------------
    let topReason = "N/A";
    if (byReasonRaw.length > 0) {
      // Already sorted by count desc from the query
      topReason = byReasonRaw[0].reasonCategory;
    }

    // -- Compute by_state ---------------------------------------------------
    // Each recall can affect multiple states. Count each state occurrence.
    const stateCountMap: Record<string, number> = {};
    for (const recall of allMatchingRecalls) {
      const states = recall.nationwide
        ? STATE_ABBREVIATIONS
        : recall.distributionStates;
      for (const s of states) {
        stateCountMap[s] = (stateCountMap[s] ?? 0) + 1;
      }
    }

    // -- Compute timeline (monthly buckets) ---------------------------------
    const timelineMap: Record<string, number> = {};
    for (const recall of timelineRaw) {
      const d = recall.reportDate;
      const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      timelineMap[period] = (timelineMap[period] ?? 0) + 1;
    }

    // Sort periods chronologically
    const timeline = Object.entries(timelineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, count]) => ({ period, count }));

    // -- Last updated -------------------------------------------------------
    const lastUpdated = lastSync?.completedAt?.toISOString() ?? null;

    return NextResponse.json({
      total_active: totalActive,
      by_source: bySource,
      by_severity: bySeverity,
      by_category: byCategory,
      by_reason: byReason,
      by_state: stateCountMap,
      top_reason: topReason,
      timeline,
      last_updated: lastUpdated,
    });
  } catch (error) {
    console.error("[GET /api/recalls/stats] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to compute recall statistics. Please try again later.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
