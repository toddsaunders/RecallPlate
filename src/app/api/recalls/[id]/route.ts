/**
 * GET /api/recalls/[id] -- Fetch a single recall event by ID.
 *
 * Response: { data: RecallEventSerialized, related: RecallEventSerialized[] }
 *
 * Related recalls (up to 6):
 *   - Same recallingFirm, OR
 *   - Same productCategory + reasonCategory
 *   - Excludes the current recall
 *   - Sorted by reportDate descending
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeRecallEvent } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "A valid recall ID is required.",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // -- Fetch the recall ---------------------------------------------------
    const recall = await db.recallEvent.findUnique({
      where: { id },
    });

    if (!recall) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: `No recall found with ID "${id}".`,
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    // -- Fetch related recalls (up to 6) ------------------------------------
    // Related = same firm OR (same productCategory AND same reasonCategory),
    // excluding the current recall, sorted by reportDate desc.
    const related = await db.recallEvent.findMany({
      where: {
        AND: [
          { id: { not: recall.id } },
          {
            OR: [
              { recallingFirm: recall.recallingFirm },
              {
                AND: [
                  { productCategory: recall.productCategory },
                  { reasonCategory: recall.reasonCategory },
                ],
              },
            ],
          },
        ],
      },
      orderBy: { reportDate: "desc" },
      take: 6,
    });

    return NextResponse.json({
      data: serializeRecallEvent(recall),
      related: related.map(serializeRecallEvent),
    });
  } catch (error) {
    console.error("[GET /api/recalls/[id]] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch recall details. Please try again later.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
