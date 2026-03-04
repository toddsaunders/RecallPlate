/**
 * USDA FSIS Recall API Fetcher
 *
 * Primary: https://www.fsis.usda.gov/api/recall-api
 *
 * The USDA API is less structured than openFDA. Field names are inconsistent
 * across records, pagination may not follow standard patterns, and some fields
 * may be missing entirely.
 *
 * Strategy:
 * - Fetch all available records (the API typically returns all at once)
 * - Retry with exponential backoff on failure
 * - Handle both array and object response formats
 */

import {
  type UsdaFsisRecallResult,
  createRateLimiter,
  withRetry,
  logger,
} from "./shared";

const SOURCE = "USDA";
const BASE_URL = "https://www.fsis.usda.gov/api/recall-api";
const RATE_LIMIT_DELAY_MS = 500; // More conservative for USDA

const throttle = createRateLimiter(RATE_LIMIT_DELAY_MS);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UsdaFsisFetchOptions {
  /** Maximum total records to fetch. 0 = unlimited. Default: 0. */
  maxRecords?: number;
}

/**
 * Fetches recall records from the USDA FSIS API.
 * Returns raw API result objects (normalization happens later).
 *
 * The USDA API is less predictable than openFDA — this fetcher handles
 * various response formats and field name inconsistencies.
 */
export async function fetchUsdaFsisRecords(
  options: UsdaFsisFetchOptions = {}
): Promise<UsdaFsisRecallResult[]> {
  const { maxRecords = 0 } = options;

  logger.info(SOURCE, "Starting fetch from USDA FSIS API");

  await throttle();

  const rawData = await withRetry(
    async () => {
      const res = await fetch(BASE_URL, {
        headers: {
          Accept: "application/json",
          "User-Agent": "RecallPlate/1.0 (food-safety-dashboard)",
        },
      });

      if (res.status === 429) {
        logger.warn(SOURCE, "Rate limited, will retry after backoff");
        throw new Error("Rate limited (429)");
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      return await res.json();
    },
    { maxAttempts: 3, baseDelayMs: 2000, source: SOURCE }
  );

  // The USDA API may return data in different structures
  const records = extractRecords(rawData);

  logger.info(SOURCE, `Extracted ${records.length} raw records`);

  if (maxRecords > 0 && records.length > maxRecords) {
    return records.slice(0, maxRecords);
  }

  return records;
}

// ---------------------------------------------------------------------------
// Response Parsing — handles various USDA response formats
// ---------------------------------------------------------------------------

/**
 * Extracts recall records from the raw USDA API response.
 * Handles multiple possible response structures:
 * - Direct array of records
 * - Object with a data/results/recalls array property
 * - Nested structure with pagination
 */
function extractRecords(raw: unknown): UsdaFsisRecallResult[] {
  // Direct array response
  if (Array.isArray(raw)) {
    return raw.filter(isPlainObject) as UsdaFsisRecallResult[];
  }

  // Object response — try common wrapper keys
  if (isPlainObject(raw)) {
    const obj = raw as Record<string, unknown>;

    // Try various wrapper keys the USDA API might use
    const wrapperKeys = ["data", "results", "recalls", "items", "records"];
    for (const key of wrapperKeys) {
      if (Array.isArray(obj[key])) {
        return (obj[key] as unknown[]).filter(isPlainObject) as UsdaFsisRecallResult[];
      }
    }

    // If the object itself looks like a single record, wrap it
    if (hasRecallFields(obj)) {
      return [obj as UsdaFsisRecallResult];
    }

    // Check for nested pagination structures
    if (obj.content && Array.isArray(obj.content)) {
      return (obj.content as unknown[]).filter(isPlainObject) as UsdaFsisRecallResult[];
    }

    logger.warn(SOURCE, "Unexpected response structure, could not extract records", {
      keys: Object.keys(obj).slice(0, 10),
    });
  }

  logger.error(SOURCE, "Could not parse USDA API response", {
    type: typeof raw,
  });

  return [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Heuristic check: does this object look like a USDA recall record?
 * Checks for at least one known field name.
 */
function hasRecallFields(obj: Record<string, unknown>): boolean {
  const knownFields = [
    "recall_number",
    "RECALL_NUMBER",
    "recall_id",
    "title",
    "recall_title",
    "TITLE",
    "classification",
    "CLASSIFICATION",
    "establishment",
    "recalling_firm",
    "company",
    "firm_name",
    "ESTABLISHMENT",
  ];
  return knownFields.some((field) => field in obj);
}
