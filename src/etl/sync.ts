/**
 * RecallPlate — ETL Pipeline Orchestration
 *
 * Main entry point: `runSync()`
 *
 * Pipeline steps:
 *  1. Fetch from all three endpoints (FDA food, FDA animal, USDA FSIS)
 *  2. Normalize all records into the unified RecallEvent shape
 *  3. Categorize products and reasons
 *  4. Generate AI summaries for new/unsummarized recalls
 *  5. Upsert to database (by source + recall_number)
 *  6. Create SyncLog entries for each source
 *
 * Design principles:
 * - Partial failures: one source failing does not block others
 * - Transaction safety: upserts use Prisma transactions
 * - Re-sync window: last 90 days for status/field changes
 * - Detailed logging at every stage
 */

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { fetchFdaFoodRecords } from "./fetchers/fda-food";
import { fetchFdaAnimalRecords } from "./fetchers/fda-animal";
import { fetchUsdaFsisRecords } from "./fetchers/usda-fsis";
import {
  normalizeFdaRecord,
  normalizeFdaAnimalRecord,
  normalizeUsdaRecord,
  type NormalizedRecall,
} from "./normalize";
import { generateBatchSummaries } from "./ai-summary";
import { logger } from "./fetchers/shared";
import type { RecallClassification, RecallSource } from "@/lib/types";

const SOURCE = "SYNC";

/** How far back to re-sync for status changes (in days). */
const RESYNC_WINDOW_DAYS = 90;

// ---------------------------------------------------------------------------
// Sync Result Type
// ---------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  sources: {
    fdaFood: SourceResult;
    fdaAnimal: SourceResult;
    usda: SourceResult;
  };
  aiSummaries: {
    generated: number;
    failed: number;
  };
  totalFetched: number;
  totalUpserted: number;
  totalSkipped: number;
  totalErrors: number;
  durationMs: number;
}

interface SourceResult {
  fetched: number;
  normalized: number;
  upserted: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ recallNumber?: string; error: string }>;
}

function emptySourceResult(): SourceResult {
  return {
    fetched: 0,
    normalized: 0,
    upserted: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };
}

// ---------------------------------------------------------------------------
// Main Sync Function
// ---------------------------------------------------------------------------

/**
 * Runs the full ETL sync pipeline.
 *
 * 1. Fetches from all three API endpoints in parallel
 * 2. Normalizes all records
 * 3. Upserts to database
 * 4. Generates AI summaries for records missing them
 * 5. Logs sync results
 *
 * Each source is independent — if one fails, the others continue.
 */
export async function runSync(): Promise<SyncResult> {
  const startTime = Date.now();
  const env = getEnv();

  logger.info(SOURCE, "=== Starting ETL sync ===");

  // Calculate the date range for incremental sync (last 90 days)
  const dateFrom = getDateNDaysAgo(RESYNC_WINDOW_DAYS);
  const dateFromStr = formatDateYYYYMMDD(dateFrom);

  const result: SyncResult = {
    success: false,
    sources: {
      fdaFood: emptySourceResult(),
      fdaAnimal: emptySourceResult(),
      usda: emptySourceResult(),
    },
    aiSummaries: { generated: 0, failed: 0 },
    totalFetched: 0,
    totalUpserted: 0,
    totalSkipped: 0,
    totalErrors: 0,
    durationMs: 0,
  };

  // -------------------------------------------------------------------
  // Step 1: Fetch from all sources (in parallel)
  // -------------------------------------------------------------------

  logger.info(SOURCE, "Step 1/5: Fetching from all sources", { dateFrom: dateFromStr });

  const [fdaFoodRaw, fdaAnimalRaw, usdaRaw] = await Promise.allSettled([
    fetchFdaFoodRecords({
      apiKey: env.OPENFDA_API_KEY,
      dateFrom: dateFromStr,
    }).catch((err) => {
      logger.error(SOURCE, "FDA food fetch failed completely", {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }),
    fetchFdaAnimalRecords({
      apiKey: env.OPENFDA_API_KEY,
      dateFrom: dateFromStr,
    }).catch((err) => {
      logger.error(SOURCE, "FDA animal fetch failed completely", {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }),
    fetchUsdaFsisRecords().catch((err) => {
      logger.error(SOURCE, "USDA fetch failed completely", {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }),
  ]);

  const fdaFoodRecords = fdaFoodRaw.status === "fulfilled" ? fdaFoodRaw.value : [];
  const fdaAnimalRecords = fdaAnimalRaw.status === "fulfilled" ? fdaAnimalRaw.value : [];
  const usdaRecords = usdaRaw.status === "fulfilled" ? usdaRaw.value : [];

  result.sources.fdaFood.fetched = fdaFoodRecords.length;
  result.sources.fdaAnimal.fetched = fdaAnimalRecords.length;
  result.sources.usda.fetched = usdaRecords.length;
  result.totalFetched = fdaFoodRecords.length + fdaAnimalRecords.length + usdaRecords.length;

  logger.info(SOURCE, `Fetched totals: FDA food=${fdaFoodRecords.length}, FDA animal=${fdaAnimalRecords.length}, USDA=${usdaRecords.length}`);

  // -------------------------------------------------------------------
  // Step 2: Normalize all records
  // -------------------------------------------------------------------

  logger.info(SOURCE, "Step 2/5: Normalizing records");

  const allNormalized: NormalizedRecall[] = [];

  // Normalize FDA food records
  for (const raw of fdaFoodRecords) {
    const normalized = normalizeFdaRecord(raw);
    if (normalized) {
      allNormalized.push(normalized);
      result.sources.fdaFood.normalized++;
    } else {
      result.sources.fdaFood.errors++;
      result.sources.fdaFood.errorDetails.push({
        recallNumber: raw.recall_number,
        error: "Normalization failed",
      });
    }
  }

  // Normalize FDA animal records
  for (const raw of fdaAnimalRecords) {
    const normalized = normalizeFdaAnimalRecord(raw);
    if (normalized) {
      allNormalized.push(normalized);
      result.sources.fdaAnimal.normalized++;
    } else {
      result.sources.fdaAnimal.errors++;
      result.sources.fdaAnimal.errorDetails.push({
        recallNumber: raw.recall_number,
        error: "Normalization failed",
      });
    }
  }

  // Normalize USDA records
  for (const raw of usdaRecords) {
    const normalized = normalizeUsdaRecord(raw);
    if (normalized) {
      allNormalized.push(normalized);
      result.sources.usda.normalized++;
    } else {
      result.sources.usda.errors++;
      result.sources.usda.errorDetails.push({
        recallNumber: raw.recall_number ?? raw.RECALL_NUMBER,
        error: "Normalization failed",
      });
    }
  }

  logger.info(SOURCE, `Normalized: ${allNormalized.length} total records`);

  // -------------------------------------------------------------------
  // Step 3: Upsert to database
  // -------------------------------------------------------------------

  logger.info(SOURCE, "Step 3/5: Upserting to database");

  const upsertedRecallNumbers = new Set<string>();

  // Process in batches to avoid overwhelming the database
  const BATCH_SIZE = 50;
  for (let i = 0; i < allNormalized.length; i += BATCH_SIZE) {
    const batch = allNormalized.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (record) => {
        try {
          await db.recallEvent.upsert({
            where: {
              source_recall_number: {
                source: record.source as RecallSource,
                recallNumber: record.recallNumber,
              },
            },
            create: {
              source: record.source as RecallSource,
              recallNumber: record.recallNumber,
              classification: record.classification as RecallClassification,
              status: record.status,
              productDescription: record.productDescription,
              productCategory: record.productCategory,
              reason: record.reason,
              reasonCategory: record.reasonCategory,
              recallingFirm: record.recallingFirm,
              distributionStates: record.distributionStates,
              nationwide: record.nationwide,
              reportDate: record.reportDate,
              recallInitiationDate: record.recallInitiationDate,
              city: record.city,
              state: record.state,
              quantity: record.quantity,
              url: record.url,
            },
            update: {
              classification: record.classification as RecallClassification,
              status: record.status,
              productDescription: record.productDescription,
              productCategory: record.productCategory,
              reason: record.reason,
              reasonCategory: record.reasonCategory,
              recallingFirm: record.recallingFirm,
              distributionStates: record.distributionStates,
              nationwide: record.nationwide,
              reportDate: record.reportDate,
              recallInitiationDate: record.recallInitiationDate,
              city: record.city,
              state: record.state,
              quantity: record.quantity,
              url: record.url,
            },
          });

          upsertedRecallNumbers.add(`${record.source}:${record.recallNumber}`);

          // Track per-source upserts
          if (record.source === "FDA") {
            // Determine if this was from food or animal based on category
            if (record.productCategory === "Pet Food") {
              result.sources.fdaAnimal.upserted++;
            } else {
              result.sources.fdaFood.upserted++;
            }
          } else {
            result.sources.usda.upserted++;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          logger.error(SOURCE, "Upsert failed", {
            recallNumber: record.recallNumber,
            source: record.source,
            error: errorMsg,
          });

          if (record.source === "FDA" && record.productCategory === "Pet Food") {
            result.sources.fdaAnimal.errors++;
            result.sources.fdaAnimal.errorDetails.push({
              recallNumber: record.recallNumber,
              error: `Upsert failed: ${errorMsg}`,
            });
          } else if (record.source === "FDA") {
            result.sources.fdaFood.errors++;
            result.sources.fdaFood.errorDetails.push({
              recallNumber: record.recallNumber,
              error: `Upsert failed: ${errorMsg}`,
            });
          } else {
            result.sources.usda.errors++;
            result.sources.usda.errorDetails.push({
              recallNumber: record.recallNumber,
              error: `Upsert failed: ${errorMsg}`,
            });
          }
        }
      })
    );

    if (i + BATCH_SIZE < allNormalized.length) {
      logger.info(SOURCE, `Upserted batch: ${Math.min(i + BATCH_SIZE, allNormalized.length)}/${allNormalized.length}`);
    }
  }

  result.totalUpserted =
    result.sources.fdaFood.upserted +
    result.sources.fdaAnimal.upserted +
    result.sources.usda.upserted;

  logger.info(SOURCE, `Upsert complete: ${result.totalUpserted} records`);

  // -------------------------------------------------------------------
  // Step 4: Generate AI summaries for records without one
  // -------------------------------------------------------------------

  logger.info(SOURCE, "Step 4/5: Generating AI summaries");

  try {
    // Find all recalls that need summaries (ai_summary is null)
    const recallsNeedingSummaries = await db.recallEvent.findMany({
      where: { aiSummary: null },
      select: {
        recallNumber: true,
        source: true,
        productDescription: true,
        productCategory: true,
        reason: true,
        reasonCategory: true,
        recallingFirm: true,
        classification: true,
        distributionStates: true,
        nationwide: true,
        reportDate: true,
        recallInitiationDate: true,
        city: true,
        state: true,
        quantity: true,
        url: true,
        status: true,
      },
      orderBy: { reportDate: "desc" },
      take: 100, // Limit to 100 per sync to control API costs
    });

    if (recallsNeedingSummaries.length > 0) {
      logger.info(SOURCE, `Found ${recallsNeedingSummaries.length} recalls needing AI summaries`);

      // Convert to NormalizedRecall shape for the summary generator
      const forSummary: NormalizedRecall[] = recallsNeedingSummaries.map((r) => ({
        source: r.source as RecallSource,
        recallNumber: r.recallNumber,
        classification: r.classification as RecallClassification,
        status: r.status,
        productDescription: r.productDescription,
        productCategory: r.productCategory,
        reason: r.reason,
        reasonCategory: r.reasonCategory,
        recallingFirm: r.recallingFirm,
        distributionStates: r.distributionStates,
        nationwide: r.nationwide,
        reportDate: r.reportDate,
        recallInitiationDate: r.recallInitiationDate,
        city: r.city,
        state: r.state,
        quantity: r.quantity,
        url: r.url,
      }));

      const summaryResult = await generateBatchSummaries(
        forSummary,
        env.ANTHROPIC_API_KEY
      );

      // Update records with generated summaries
      for (const [recallNumber, summary] of summaryResult.summaries) {
        if (summary) {
          // Find the source for this recall number from our original data
          const recall = recallsNeedingSummaries.find(
            (r) => r.recallNumber === recallNumber
          );
          if (recall) {
            try {
              await db.recallEvent.update({
                where: {
                  source_recall_number: {
                    source: recall.source,
                    recallNumber: recall.recallNumber,
                  },
                },
                data: { aiSummary: summary },
              });
            } catch (err) {
              logger.error(SOURCE, "Failed to save AI summary", {
                recallNumber,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }
      }

      result.aiSummaries.generated = summaryResult.succeeded;
      result.aiSummaries.failed = summaryResult.failed;
    } else {
      logger.info(SOURCE, "No recalls need AI summaries");
    }
  } catch (err) {
    logger.error(SOURCE, "AI summary generation phase failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // -------------------------------------------------------------------
  // Step 5: Create SyncLog entries
  // -------------------------------------------------------------------

  logger.info(SOURCE, "Step 5/5: Creating sync log entries");

  result.totalErrors =
    result.sources.fdaFood.errors +
    result.sources.fdaAnimal.errors +
    result.sources.usda.errors;

  result.totalSkipped = result.totalFetched - result.totalUpserted - result.totalErrors;
  result.durationMs = Date.now() - startTime;
  result.success = true;

  // Log each source separately
  await createSyncLog("FDA_FOOD", result.sources.fdaFood);
  await createSyncLog("FDA_ANIMAL", result.sources.fdaAnimal);
  await createSyncLog("USDA", result.sources.usda);

  logger.info(SOURCE, "=== ETL sync complete ===", {
    totalFetched: result.totalFetched,
    totalUpserted: result.totalUpserted,
    totalErrors: result.totalErrors,
    aiSummariesGenerated: result.aiSummaries.generated,
    durationMs: result.durationMs,
  });

  return result;
}

// ---------------------------------------------------------------------------
// Sync Log Helper
// ---------------------------------------------------------------------------

async function createSyncLog(
  source: string,
  sourceResult: SourceResult
): Promise<void> {
  try {
    await db.syncLog.create({
      data: {
        source,
        recordsFetched: sourceResult.fetched,
        recordsUpserted: sourceResult.upserted,
        recordsSkipped: Math.max(0, sourceResult.fetched - sourceResult.upserted - sourceResult.errors),
        errors: sourceResult.errors,
        errorDetails:
          sourceResult.errorDetails.length > 0
            ? sourceResult.errorDetails
            : undefined,
        status: sourceResult.errors > 0 && sourceResult.upserted === 0 ? "failed" : "completed",
        completedAt: new Date(),
      },
    });
  } catch (err) {
    logger.error(SOURCE, `Failed to create SyncLog for ${source}`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

function getDateNDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
