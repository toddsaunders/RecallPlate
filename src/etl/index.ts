/**
 * RecallPlate — ETL Module Index
 *
 * Re-exports the main sync function and key types for use by
 * the cron API route and any manual trigger scripts.
 */

export { runSync, type SyncResult } from "./sync";
export { type NormalizedRecall } from "./normalize";
export {
  categorizeProduct,
  categorizeReason,
  parseDistributionStates,
  extractClassification,
  normalizeStatus,
  normalizeFdaRecord,
  normalizeFdaAnimalRecord,
  normalizeUsdaRecord,
} from "./normalize";
export { generateAiSummary, generateBatchSummaries } from "./ai-summary";
