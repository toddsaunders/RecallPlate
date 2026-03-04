/**
 * openFDA Animal & Veterinary Enforcement API Fetcher
 *
 * Endpoint: https://api.fda.gov/animalandveterinary/enforcement.json
 * Same structure as the food enforcement endpoint.
 * Records are tagged for "Pet Food" category routing during normalization.
 *
 * Pagination: skip + limit (max 1000 per page)
 * Rate limit: 240 req/min with API key, 40/min without
 * Strategy: 250ms minimum between requests
 */

import {
  type OpenFdaEnforcementResponse,
  type OpenFdaEnforcementResult,
  createRateLimiter,
  withRetry,
  logger,
} from "./shared";

const SOURCE = "FDA_ANIMAL";
const BASE_URL = "https://api.fda.gov/animalandveterinary/enforcement.json";
const PAGE_SIZE = 1000;
const RATE_LIMIT_DELAY_MS = 250;

const throttle = createRateLimiter(RATE_LIMIT_DELAY_MS);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FdaAnimalFetchOptions {
  /** openFDA API key. Increases rate limit from 40 to 240 req/min. */
  apiKey: string;
  /** Fetch records reported on or after this date (YYYYMMDD). */
  dateFrom?: string;
  /** Fetch records reported on or before this date (YYYYMMDD). */
  dateTo?: string;
  /** Maximum total records to fetch. 0 = unlimited. Default: 0. */
  maxRecords?: number;
}

/**
 * Fetches all animal/veterinary enforcement records from the openFDA API.
 * Paginates through all pages, applying date filtering for incremental syncs.
 * Returns raw API result objects (normalization happens later).
 *
 * These records are tagged for "Pet Food" category during normalization.
 */
export async function fetchFdaAnimalRecords(
  options: FdaAnimalFetchOptions
): Promise<OpenFdaEnforcementResult[]> {
  const { apiKey, dateFrom, dateTo, maxRecords = 0 } = options;
  const allResults: OpenFdaEnforcementResult[] = [];
  let skip = 0;
  let totalAvailable = Infinity;

  logger.info(SOURCE, "Starting fetch", { dateFrom, dateTo });

  while (skip < totalAvailable) {
    if (maxRecords > 0 && allResults.length >= maxRecords) {
      logger.info(SOURCE, `Reached maxRecords limit (${maxRecords}), stopping`);
      break;
    }

    await throttle();

    const url = buildUrl({ apiKey, dateFrom, dateTo, skip, limit: PAGE_SIZE });

    const response = await withRetry(
      async () => {
        const res = await fetch(url);

        if (res.status === 429) {
          logger.warn(SOURCE, "Rate limited, will retry after backoff");
          throw new Error("Rate limited (429)");
        }

        // "No results" returns 404 on openFDA
        if (res.status === 404) {
          return { results: [], meta: { results: { total: 0, skip: 0, limit: PAGE_SIZE } } } as OpenFdaEnforcementResponse;
        }

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
        }

        return (await res.json()) as OpenFdaEnforcementResponse;
      },
      { maxAttempts: 3, baseDelayMs: 1000, source: SOURCE }
    );

    if (response.error) {
      if (response.error.code === "NOT_FOUND" || response.error.message?.includes("No matches found")) {
        logger.info(SOURCE, "No more records found");
        break;
      }
      logger.error(SOURCE, "API returned error", { error: response.error });
      break;
    }

    const results = response.results ?? [];
    const total = response.meta?.results?.total ?? 0;

    if (totalAvailable === Infinity) {
      totalAvailable = total;
      logger.info(SOURCE, `Total records available: ${totalAvailable}`);
    }

    if (results.length === 0) {
      break;
    }

    allResults.push(...results);
    skip += PAGE_SIZE;

    logger.info(SOURCE, `Fetched page: ${allResults.length}/${totalAvailable} records`);
  }

  logger.info(SOURCE, `Fetch complete: ${allResults.length} records`);
  return allResults;
}

// ---------------------------------------------------------------------------
// URL Builder
// ---------------------------------------------------------------------------

function buildUrl(params: {
  apiKey: string;
  dateFrom?: string;
  dateTo?: string;
  skip: number;
  limit: number;
}): string {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", params.apiKey);
  url.searchParams.set("skip", String(params.skip));
  url.searchParams.set("limit", String(params.limit));

  const searchParts: string[] = [];

  if (params.dateFrom || params.dateTo) {
    const from = params.dateFrom ?? "20040101";
    const to = params.dateTo ?? "21001231";
    searchParts.push(`report_date:[${from}+TO+${to}]`);
  }

  if (searchParts.length > 0) {
    url.searchParams.set("search", searchParts.join("+AND+"));
  }

  return url.toString();
}
