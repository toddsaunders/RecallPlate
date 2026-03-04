/**
 * RecallPlate — AI Summary Generation
 *
 * Uses Claude Opus 4.6 (claude-opus-4-6) via the @anthropic-ai/sdk to generate
 * plain-English recall summaries at ETL time.
 *
 * Each summary is 2-3 sentences written for a concerned parent. It explains:
 * (1) what product was recalled, (2) what is wrong with it, and (3) what
 * consumers should do.
 *
 * Summaries are generated in batches with controlled concurrency (5 parallel)
 * and rate limiting for the Anthropic API. Failures fall back to null.
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger, sleep } from "./fetchers/shared";
import type { NormalizedRecall } from "./normalize";

const SOURCE = "AI_SUMMARY";
const MODEL = "claude-opus-4-6";
const MAX_TOKENS = 300;
const CONCURRENCY = 5;
const RATE_LIMIT_DELAY_MS = 200; // Delay between batches of concurrent requests

// ---------------------------------------------------------------------------
// Prompt Template
// ---------------------------------------------------------------------------

function buildPrompt(recall: NormalizedRecall): string {
  const distributionText = recall.nationwide
    ? "Nationwide"
    : recall.distributionStates.length > 0
      ? recall.distributionStates.join(", ")
      : "Unknown";

  return `You are writing a plain-English recall summary for a consumer-facing food safety website.
Given the following recall data, write a 2-3 sentence summary that a parent can read in 10 seconds. Explain: (1) what the product is, (2) what is wrong with it, and (3) what the consumer should do. Do not use government jargon. Be clear and direct.

Product: ${recall.productDescription}
Company: ${recall.recallingFirm}
Reason: ${recall.reason}
Classification: Class ${recall.classification}
Distribution: ${distributionText}`;
}

// ---------------------------------------------------------------------------
// Single Summary Generation
// ---------------------------------------------------------------------------

/**
 * Generates a plain-English AI summary for a single recall.
 * Returns null on failure (logs the error but does not throw).
 */
export async function generateAiSummary(
  recall: NormalizedRecall,
  client: Anthropic
): Promise<string | null> {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: buildPrompt(recall),
        },
      ],
    });

    // Extract text from the response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      logger.warn(SOURCE, "No text in AI response", {
        recallNumber: recall.recallNumber,
      });
      return null;
    }

    const summary = textBlock.text.trim();
    if (summary.length === 0) {
      logger.warn(SOURCE, "Empty AI response", {
        recallNumber: recall.recallNumber,
      });
      return null;
    }

    return summary;
  } catch (err) {
    logger.error(SOURCE, "Failed to generate AI summary", {
      recallNumber: recall.recallNumber,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Batch Summary Generation
// ---------------------------------------------------------------------------

export interface BatchSummaryResult {
  /** Map from recallNumber to generated summary (or null). */
  summaries: Map<string, string | null>;
  /** Count of successfully generated summaries. */
  succeeded: number;
  /** Count of failed generations. */
  failed: number;
}

/**
 * Generates AI summaries for a batch of recalls with controlled concurrency.
 *
 * Only processes recalls that need summaries (no existing aiSummary).
 * Uses a pool of CONCURRENCY concurrent requests with rate limiting
 * between batches.
 *
 * @param recalls - Array of normalized recalls to summarize
 * @param anthropicApiKey - Anthropic API key
 * @returns Map of recallNumber -> summary, plus counts
 */
export async function generateBatchSummaries(
  recalls: NormalizedRecall[],
  anthropicApiKey: string
): Promise<BatchSummaryResult> {
  if (recalls.length === 0) {
    return { summaries: new Map(), succeeded: 0, failed: 0 };
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const summaries = new Map<string, string | null>();
  let succeeded = 0;
  let failed = 0;

  logger.info(SOURCE, `Generating summaries for ${recalls.length} recalls (concurrency: ${CONCURRENCY})`);

  // Process in chunks of CONCURRENCY
  for (let i = 0; i < recalls.length; i += CONCURRENCY) {
    const chunk = recalls.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      chunk.map(async (recall) => {
        const summary = await generateAiSummary(recall, client);
        return { recallNumber: recall.recallNumber, summary };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        summaries.set(result.value.recallNumber, result.value.summary);
        if (result.value.summary) {
          succeeded++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    // Rate limit between batches
    if (i + CONCURRENCY < recalls.length) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    logger.info(SOURCE, `Progress: ${Math.min(i + CONCURRENCY, recalls.length)}/${recalls.length} (${succeeded} ok, ${failed} failed)`);
  }

  logger.info(SOURCE, `Batch complete: ${succeeded} succeeded, ${failed} failed`);
  return { summaries, succeeded, failed };
}
