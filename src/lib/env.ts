/**
 * Environment Variable Validation
 *
 * Uses Zod to validate all required environment variables at startup.
 * Import this module early (e.g., in layout.tsx or middleware.ts) to
 * fail fast if any required variable is missing.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const dbUrl = env.DATABASE_URL;
 */

import { z } from "zod";

const envSchema = z.object({
  /** PostgreSQL connection string (Supabase, Neon, or Railway). */
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),

  /** openFDA API key for higher rate limits (240 req/min vs 40 req/min). */
  OPENFDA_API_KEY: z.string().min(1, "OPENFDA_API_KEY is required"),

  /** Anthropic API key for Claude AI summary generation. */
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),

  /** Public base URL of the application (e.g., https://recallplate.com). */
  NEXT_PUBLIC_BASE_URL: z.string().url("NEXT_PUBLIC_BASE_URL must be a valid URL"),

  /** Secret token to authenticate cron job requests. */
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables.
 *
 * This function is called lazily — it will throw a descriptive ZodError
 * if any variable is missing or invalid. In development, the error includes
 * which specific variables failed validation.
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error("Environment variable validation failed:\n" + formatted);

    // In development, throw a descriptive error. In production, throw a generic one.
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "Missing or invalid environment variables:\n" +
          formatted +
          "\n\nCopy .env.example to .env.local and fill in all values."
      );
    }

    throw new Error("Server configuration error. Check environment variables.");
  }

  return parsed.data;
}

/**
 * Lazy-validated environment. Access env vars through this object.
 *
 * NOTE: Do NOT import this at the module level in files that run during build
 * (e.g., page.tsx during `next build` static generation) — the env vars
 * won't be available. Instead, call getEnv() inside server functions.
 */
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}
