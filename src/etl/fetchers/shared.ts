/**
 * Shared utilities for all ETL fetchers.
 *
 * Provides rate limiting, retry with exponential backoff, and a common
 * logger interface used by the FDA and USDA fetchers.
 */

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const LOG_PREFIX = "[ETL]";

export const logger = {
  info: (source: string, message: string, meta?: Record<string, unknown>) => {
    const parts = [LOG_PREFIX, `[${source}]`, message];
    if (meta) parts.push(JSON.stringify(meta));
    console.log(parts.join(" "));
  },
  warn: (source: string, message: string, meta?: Record<string, unknown>) => {
    const parts = [LOG_PREFIX, `[${source}]`, message];
    if (meta) parts.push(JSON.stringify(meta));
    console.warn(parts.join(" "));
  },
  error: (source: string, message: string, meta?: Record<string, unknown>) => {
    const parts = [LOG_PREFIX, `[${source}]`, message];
    if (meta) parts.push(JSON.stringify(meta));
    console.error(parts.join(" "));
  },
};

// ---------------------------------------------------------------------------
// Rate Limiter — token-bucket style
// ---------------------------------------------------------------------------

/**
 * Creates a simple delay-based rate limiter.
 * Ensures at least `minDelayMs` between successive calls.
 */
export function createRateLimiter(minDelayMs: number) {
  let lastCall = 0;

  return async function throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastCall;
    if (elapsed < minDelayMs) {
      await sleep(minDelayMs - elapsed);
    }
    lastCall = Date.now();
  };
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Retry with Exponential Backoff
// ---------------------------------------------------------------------------

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3. */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Default: 1000. */
  baseDelayMs?: number;
  /** Maximum delay cap in ms. Default: 30000. */
  maxDelayMs?: number;
  /** Source label for logging. */
  source?: string;
}

/**
 * Retries an async function with exponential backoff.
 * Jitter is applied to prevent thundering herd.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    source = "unknown",
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === maxAttempts) {
        logger.error(source, `All ${maxAttempts} attempts failed`, {
          error: lastError.message,
        });
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500,
        maxDelayMs
      );

      logger.warn(source, `Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`, {
        error: lastError.message,
      });

      await sleep(delay);
    }
  }

  // Unreachable, but TypeScript needs it
  throw lastError;
}

// ---------------------------------------------------------------------------
// Raw API response types for openFDA
// ---------------------------------------------------------------------------

/**
 * A single enforcement result from the openFDA API.
 * Fields are nullable — the API does not guarantee all fields are present.
 */
export interface OpenFdaEnforcementResult {
  recall_number?: string;
  classification?: string;
  status?: string;
  product_description?: string;
  reason_for_recall?: string;
  recalling_firm?: string;
  distribution_pattern?: string;
  state?: string;
  city?: string;
  report_date?: string;
  recall_initiation_date?: string;
  product_quantity?: string;
  product_type?: string;
  event_id?: string;
  center_classification_date?: string;
  voluntary_mandated?: string;
  initial_firm_notification?: string;
  openfda?: Record<string, unknown>;
  // Allow additional unknown fields
  [key: string]: unknown;
}

export interface OpenFdaEnforcementResponse {
  meta?: {
    disclaimer?: string;
    terms?: string;
    license?: string;
    last_updated?: string;
    results?: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results?: OpenFdaEnforcementResult[];
  error?: {
    code?: string;
    message?: string;
  };
}

// ---------------------------------------------------------------------------
// Raw API response types for USDA FSIS
// ---------------------------------------------------------------------------

/**
 * A single recall record from the USDA FSIS API.
 * Field names vary — the USDA API is less structured than openFDA.
 */
export interface UsdaFsisRecallResult {
  recall_number?: string;
  recall_id?: string;
  RECALL_NUMBER?: string;
  title?: string;
  recall_title?: string;
  TITLE?: string;
  classification?: string;
  CLASSIFICATION?: string;
  recall_classification?: string;
  status?: string;
  current_status?: string;
  STATUS?: string;
  description?: string;
  product_description?: string;
  products?: string;
  DESCRIPTION?: string;
  reason?: string;
  reason_for_recall?: string;
  REASON?: string;
  establishment?: string;
  recalling_firm?: string;
  company?: string;
  firm_name?: string;
  ESTABLISHMENT?: string;
  distribution?: string;
  distribution_pattern?: string;
  distribution_list?: string;
  DISTRIBUTION?: string;
  state?: string;
  STATE?: string;
  city?: string;
  CITY?: string;
  recall_date?: string;
  date?: string;
  report_date?: string;
  RECALL_DATE?: string;
  quantity?: string;
  pounds_recalled?: string;
  QUANTITY?: string;
  url?: string;
  link?: string;
  URL?: string;
  // Allow additional unknown fields
  [key: string]: unknown;
}
