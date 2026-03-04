/**
 * RecallPlate — Cron API Route
 *
 * POST /api/cron
 * GET  /api/cron
 *
 * Triggers the ETL sync pipeline. Protected with CRON_SECRET token.
 * Designed to be called by:
 * - Vercel Cron Jobs (configured in vercel.json, sends GET)
 * - Manual triggers during development (POST)
 *
 * IMPORTANT: The sync module is imported dynamically to prevent Next.js
 * from evaluating the Prisma client at build time (DATABASE_URL is not
 * available during static builds on Vercel).
 */

import { NextRequest, NextResponse } from "next/server";

/** Prevent Next.js from attempting static rendering of this route. */
export const dynamic = "force-dynamic";

/** Maximum execution time for the sync (9 minutes — Vercel Pro limit is 10). */
const TIMEOUT_MS = 9 * 60 * 1000;

// ---------------------------------------------------------------------------
// Auth Check
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === secret) return true;
  }

  // Check query parameter (for Vercel Cron which sends GET requests)
  const tokenParam = request.nextUrl.searchParams.get("token");
  if (tokenParam === secret) return true;

  // Check x-cron-secret header (custom header for flexibility)
  const cronHeader = request.headers.get("x-cron-secret");
  if (cronHeader === secret) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Shared handler for both GET (Vercel Cron) and POST (manual trigger)
// ---------------------------------------------------------------------------

async function handleSync(request: NextRequest): Promise<NextResponse> {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing CRON_SECRET token." },
      { status: 401 }
    );
  }

  try {
    // Dynamic import to avoid loading Prisma at build time
    const { runSync } = await import("@/etl/sync");

    // Run the sync with a timeout
    const result = await Promise.race([
      runSync(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Sync timed out")), TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json({
      success: true,
      message: "ETL sync completed.",
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[CRON] Sync failed:", message);

    return NextResponse.json(
      {
        success: false,
        error: "Sync Failed",
        message,
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

/** GET handler — used by Vercel Cron Jobs (they send GET requests). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSync(request);
}

/** POST handler — used for manual triggers during development. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSync(request);
}
