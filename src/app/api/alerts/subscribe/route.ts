/**
 * POST /api/alerts/subscribe -- Email capture for recall alert subscriptions.
 *
 * Request body:
 *   {
 *     email: string,       -- Required, valid email format
 *     state: string,       -- Required, valid US state abbreviation or "ALL"
 *     categories?: string[] -- Optional, array of valid product category strings
 *   }
 *
 * Behavior:
 *   - If email already exists, update preferences (upsert)
 *   - Basic in-memory rate limiting per IP
 *
 * Response:
 *   Success: { success: true, message: "..." }
 *   Error:   { success: false, message: "..." }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  STATE_ABBREVIATIONS,
  PRODUCT_CATEGORIES,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;       // 5 requests per minute per IP

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Periodically clean up expired entries to prevent memory leaks.
 * Runs at most once every 5 minutes.
 */
let lastCleanup = Date.now();
function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupRateLimitStore();
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Email validation regex (RFC 5322 simplified)
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Valid states: all abbreviations + "ALL"
// ---------------------------------------------------------------------------

const VALID_STATES = new Set([...STATE_ABBREVIATIONS, "ALL"]);
const VALID_CATEGORIES = new Set<string>(PRODUCT_CATEGORIES);

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // -- Rate limiting ------------------------------------------------------
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    // -- Parse request body -------------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    const { email, state, categories, brands } = body as {
      email?: unknown;
      state?: unknown;
      categories?: unknown;
      brands?: unknown;
    };

    // -- Validate email -----------------------------------------------------
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid email address is required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // -- Validate state -----------------------------------------------------
    if (!state || typeof state !== "string" || !VALID_STATES.has(state.trim().toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          message: `A valid US state abbreviation or "ALL" is required. Received: "${state}".`,
        },
        { status: 400 }
      );
    }

    const normalizedState = state.trim().toUpperCase();

    // -- Validate categories (optional) -------------------------------------
    let normalizedCategories: string[] = [];
    if (categories !== undefined && categories !== null) {
      if (!Array.isArray(categories)) {
        return NextResponse.json(
          {
            success: false,
            message: "`categories` must be an array of product category strings.",
          },
          { status: 400 }
        );
      }

      for (const cat of categories) {
        if (typeof cat !== "string" || !VALID_CATEGORIES.has(cat)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid category: "${cat}". Must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`,
            },
            { status: 400 }
          );
        }
      }

      normalizedCategories = categories as string[];
    }

    // -- Validate brands (optional) -----------------------------------------
    let normalizedBrands: string[] = [];
    if (brands !== undefined && brands !== null) {
      if (!Array.isArray(brands)) {
        return NextResponse.json(
          {
            success: false,
            message: "`brands` must be an array of brand name strings.",
          },
          { status: 400 }
        );
      }

      for (const brand of brands) {
        if (typeof brand !== "string" || brand.trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Each brand must be a non-empty string.",
            },
            { status: 400 }
          );
        }
      }

      normalizedBrands = (brands as string[]).map((b) => b.trim());
    }

    // -- Upsert subscriber --------------------------------------------------
    const subscriber = await db.alertSubscriber.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        state: normalizedState,
        categories: normalizedCategories,
        brands: normalizedBrands,
      },
      update: {
        state: normalizedState,
        categories: normalizedCategories,
        brands: normalizedBrands,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "You're signed up! We'll notify you when new recalls match your preferences.",
        subscriberId: subscriber.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/alerts/subscribe] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
