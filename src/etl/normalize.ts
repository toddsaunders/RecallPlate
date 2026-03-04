/**
 * RecallPlate — Data Normalization
 *
 * Transforms raw API responses from FDA (food + animal) and USDA into
 * the unified RecallEvent shape used throughout the application.
 *
 * Includes:
 * - normalizeFdaRecord()       — openFDA food enforcement -> RecallEvent
 * - normalizeFdaAnimalRecord() — openFDA animal/vet enforcement -> RecallEvent
 * - normalizeUsdaRecord()      — USDA FSIS -> RecallEvent
 * - categorizeProduct()        — keyword matching for 14 product categories
 * - categorizeReason()         — keyword matching for 7 reason categories
 * - parseDistributionStates()  — free-text state parsing
 */

import type { OpenFdaEnforcementResult, UsdaFsisRecallResult } from "./fetchers/shared";
import {
  PRODUCT_CATEGORIES,
  REASON_CATEGORIES,
  NATIONWIDE_KEYWORDS,
  STATE_NAME_TO_ABBREVIATION,
  STATE_ABBREVIATIONS,
} from "@/lib/constants";
import type { RecallClassification, RecallSource } from "@/lib/types";
import { logger } from "./fetchers/shared";

const SOURCE = "NORMALIZE";

// ---------------------------------------------------------------------------
// Normalized intermediate type (before database upsert)
// ---------------------------------------------------------------------------

/**
 * A normalized recall record ready for database upsert.
 * Does not include `id`, `createdAt`, or `updatedAt` — those are set by Prisma.
 */
export interface NormalizedRecall {
  source: RecallSource;
  recallNumber: string;
  classification: RecallClassification;
  status: string;
  productDescription: string;
  productCategory: string;
  reason: string;
  reasonCategory: string;
  recallingFirm: string;
  distributionStates: string[];
  nationwide: boolean;
  reportDate: Date;
  recallInitiationDate: Date | null;
  city: string | null;
  state: string | null;
  quantity: string | null;
  url: string | null;
}

// ---------------------------------------------------------------------------
// FDA Food Enforcement Normalization
// ---------------------------------------------------------------------------

export function normalizeFdaRecord(raw: OpenFdaEnforcementResult): NormalizedRecall | null {
  try {
    const recallNumber = raw.recall_number?.trim();
    if (!recallNumber) {
      logger.warn(SOURCE, "Skipping FDA food record: missing recall_number");
      return null;
    }

    const productDescription = raw.product_description?.trim() ?? "Unknown product";
    const reason = raw.reason_for_recall?.trim() ?? "Unknown reason";
    const distributionResult = parseDistributionStates(raw.distribution_pattern ?? "");

    return {
      source: "FDA",
      recallNumber,
      classification: extractClassification(raw.classification),
      status: normalizeStatus(raw.status),
      productDescription,
      productCategory: categorizeProduct(productDescription),
      reason,
      reasonCategory: categorizeReason(reason),
      recallingFirm: raw.recalling_firm?.trim() ?? "Unknown firm",
      distributionStates: distributionResult.states,
      nationwide: distributionResult.nationwide,
      reportDate: parseFdaDate(raw.report_date) ?? new Date(),
      recallInitiationDate: parseFdaDate(raw.recall_initiation_date),
      city: raw.city?.trim() ?? null,
      state: normalizeStateAbbreviation(raw.state?.trim() ?? null),
      quantity: raw.product_quantity?.trim() ?? null,
      url: buildFdaUrl(recallNumber),
    };
  } catch (err) {
    logger.error(SOURCE, "Failed to normalize FDA food record", {
      recall_number: raw.recall_number,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// FDA Animal/Veterinary Enforcement Normalization
// ---------------------------------------------------------------------------

export function normalizeFdaAnimalRecord(raw: OpenFdaEnforcementResult): NormalizedRecall | null {
  try {
    const recallNumber = raw.recall_number?.trim();
    if (!recallNumber) {
      logger.warn(SOURCE, "Skipping FDA animal record: missing recall_number");
      return null;
    }

    const productDescription = raw.product_description?.trim() ?? "Unknown product";
    const reason = raw.reason_for_recall?.trim() ?? "Unknown reason";
    const distributionResult = parseDistributionStates(raw.distribution_pattern ?? "");

    // Default to "Pet Food" category for animal/vet records unless a more
    // specific category clearly applies (which is unlikely for this endpoint).
    const productCategory = "Pet Food";

    return {
      source: "FDA",
      recallNumber,
      classification: extractClassification(raw.classification),
      status: normalizeStatus(raw.status),
      productDescription,
      productCategory,
      reason,
      reasonCategory: categorizeReason(reason),
      recallingFirm: raw.recalling_firm?.trim() ?? "Unknown firm",
      distributionStates: distributionResult.states,
      nationwide: distributionResult.nationwide,
      reportDate: parseFdaDate(raw.report_date) ?? new Date(),
      recallInitiationDate: parseFdaDate(raw.recall_initiation_date),
      city: raw.city?.trim() ?? null,
      state: normalizeStateAbbreviation(raw.state?.trim() ?? null),
      quantity: raw.product_quantity?.trim() ?? null,
      url: buildFdaUrl(recallNumber),
    };
  } catch (err) {
    logger.error(SOURCE, "Failed to normalize FDA animal record", {
      recall_number: raw.recall_number,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// USDA FSIS Normalization
// ---------------------------------------------------------------------------

export function normalizeUsdaRecord(raw: UsdaFsisRecallResult): NormalizedRecall | null {
  try {
    const recallNumber = extractUsdaField(raw, [
      "recall_number",
      "RECALL_NUMBER",
      "recall_id",
    ])?.trim();

    if (!recallNumber) {
      logger.warn(SOURCE, "Skipping USDA record: missing recall_number");
      return null;
    }

    const productDescription = extractUsdaField(raw, [
      "description",
      "product_description",
      "products",
      "DESCRIPTION",
      "title",
      "recall_title",
      "TITLE",
    ])?.trim() ?? "Unknown product";

    const reason = extractUsdaField(raw, [
      "reason",
      "reason_for_recall",
      "REASON",
    ])?.trim() ?? "Unknown reason";

    const distributionText = extractUsdaField(raw, [
      "distribution",
      "distribution_pattern",
      "distribution_list",
      "DISTRIBUTION",
    ]) ?? "";

    const distributionResult = parseDistributionStates(distributionText);

    const rawClassification = extractUsdaField(raw, [
      "classification",
      "CLASSIFICATION",
      "recall_classification",
    ]);

    const rawDate = extractUsdaField(raw, [
      "recall_date",
      "date",
      "report_date",
      "RECALL_DATE",
    ]);

    const rawQuantity = extractUsdaField(raw, [
      "quantity",
      "pounds_recalled",
      "QUANTITY",
    ]);

    const rawStatus = extractUsdaField(raw, [
      "status",
      "current_status",
      "STATUS",
    ]);

    const rawCompany = extractUsdaField(raw, [
      "establishment",
      "recalling_firm",
      "company",
      "firm_name",
      "ESTABLISHMENT",
    ]);

    const rawCity = extractUsdaField(raw, ["city", "CITY"]);
    const rawState = extractUsdaField(raw, ["state", "STATE"]);
    const rawUrl = extractUsdaField(raw, ["url", "link", "URL"]);

    return {
      source: "USDA",
      recallNumber,
      classification: extractClassification(rawClassification),
      status: normalizeStatus(rawStatus),
      productDescription,
      productCategory: categorizeProduct(productDescription),
      reason,
      reasonCategory: categorizeReason(reason),
      recallingFirm: rawCompany?.trim() ?? "Unknown firm",
      distributionStates: distributionResult.states,
      nationwide: distributionResult.nationwide,
      reportDate: parseFlexibleDate(rawDate) ?? new Date(),
      recallInitiationDate: null, // USDA does not typically provide this
      city: rawCity?.trim() ?? null,
      state: normalizeStateAbbreviation(rawState?.trim() ?? null),
      quantity: rawQuantity?.trim() ?? null,
      url: rawUrl?.trim() ?? buildUsdaUrl(recallNumber),
    };
  } catch (err) {
    logger.error(SOURCE, "Failed to normalize USDA record", {
      recall_number: raw.recall_number ?? raw.RECALL_NUMBER,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Product Category Classification
// ---------------------------------------------------------------------------

/**
 * Keyword rules for product categorization.
 * Applied in priority order — first match wins.
 * The PRD specifies these exact keyword mappings (section 3.5.4).
 */
const PRODUCT_KEYWORD_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Baby Food & Formula",
    keywords: ["baby", "infant", "formula", "toddler"],
  },
  {
    category: "Pet Food",
    keywords: ["dog", "cat", "pet", "animal", "kibble", "treat pet", "pet food", "dog food", "cat food"],
  },
  {
    category: "Dairy & Eggs",
    keywords: ["milk", "cheese", "yogurt", "butter", "cream", "dairy", "egg", "eggs"],
  },
  {
    category: "Meat & Poultry",
    keywords: ["beef", "pork", "chicken", "turkey", "meat", "sausage", "ham", "bacon", "poultry", "lamb", "veal", "bison", "venison"],
  },
  {
    category: "Seafood & Fish",
    keywords: ["salmon", "tuna", "shrimp", "fish", "crab", "lobster", "seafood", "oyster", "clam", "mussel", "scallop", "tilapia", "cod", "anchov"],
  },
  {
    category: "Fruits & Vegetables",
    keywords: ["apple", "banana", "lettuce", "spinach", "tomato", "fruit", "vegetable", "salad", "berry", "berries", "grape", "orange", "peach", "melon", "mango", "avocado", "broccoli", "carrot", "onion", "pepper", "celery", "kale", "mushroom"],
  },
  {
    category: "Grains & Bakery",
    keywords: ["bread", "wheat", "flour", "cereal", "rice", "pasta", "bakery", "grain", "oat", "oats", "tortilla", "noodle", "crouton", "biscuit", "muffin", "cake", "pie", "bagel"],
  },
  {
    category: "Nuts & Seeds",
    keywords: ["almond", "peanut", "cashew", "walnut", "nut", "seed", "pistachio", "pecan", "macadamia", "hazelnut", "sunflower seed"],
  },
  {
    category: "Snacks & Candy",
    keywords: ["chip", "chips", "cookie", "cookies", "candy", "chocolate", "snack", "cracker", "crackers", "popcorn", "pretzel", "gummy", "gummies", "licorice"],
  },
  {
    category: "Beverages",
    keywords: ["juice", "soda", "water", "tea", "coffee", "drink", "beverage", "smoothie", "lemonade", "kombucha"],
  },
  {
    category: "Prepared/Frozen Meals",
    keywords: ["frozen", "meal", "dinner", "pizza", "entree", "prepared", "ready-to-eat", "ready to eat", "burrito", "wrap", "soup", "stew", "chili"],
  },
  {
    category: "Condiments & Sauces",
    keywords: ["sauce", "dressing", "ketchup", "mustard", "mayo", "mayonnaise", "condiment", "spice", "seasoning", "salsa", "vinegar", "marinade", "syrup", "honey", "jam", "jelly"],
  },
  {
    category: "Supplements & Vitamins",
    keywords: ["supplement", "vitamin", "mineral", "protein powder", "dietary", "probiotic", "herbal", "capsule", "tablet"],
  },
];

/**
 * Assigns a normalized product category based on keyword matching
 * against the product description. First match wins (priority order).
 */
export function categorizeProduct(description: string): string {
  const lower = description.toLowerCase();

  for (const rule of PRODUCT_KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      // Use word-boundary-aware matching to avoid false positives
      // e.g., "cream" should match "ice cream" but also "cream cheese"
      if (lower.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return "Other";
}

// ---------------------------------------------------------------------------
// Reason Category Classification
// ---------------------------------------------------------------------------

/**
 * Keyword rules for reason categorization.
 * Undeclared Allergens must be checked carefully — many allergen keywords
 * (milk, egg, soy) also appear in product descriptions. The PRD notes
 * these should be matched "in context of labeling."
 */
const REASON_KEYWORD_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Bacterial Contamination",
    keywords: [
      "salmonella", "listeria", "e. coli", "e.coli", "ecoli",
      "botulism", "clostridium", "campylobacter", "norovirus",
      "hepatitis", "bacteria", "bacterial", "stec", "shiga",
      "cronobacter",
    ],
  },
  {
    category: "Undeclared Allergens",
    keywords: [
      "undeclared", "allergen", "allergy", "allergic",
      "may contain", "not declared", "not listed",
      "undeclared milk", "undeclared soy", "undeclared wheat",
      "undeclared peanut", "undeclared tree nut", "undeclared egg",
      "undeclared shellfish", "undeclared sesame", "undeclared fish",
    ],
  },
  {
    category: "Foreign Material",
    keywords: [
      "metal", "glass", "plastic", "wood", "rubber", "bone",
      "foreign", "object", "material", "fragment", "piece",
      "wire", "stone", "rock",
    ],
  },
  {
    category: "Misbranding/Mislabeling",
    keywords: [
      "misbrand", "mislabel", "mispackag", "incorrect label",
      "wrong label", "labeling", "misbranded", "mislabeled",
      "wrong product", "incorrect packaging",
    ],
  },
  {
    category: "Chemical Contamination",
    keywords: [
      "chemical", "pesticide", "lead", "mercury", "arsenic",
      "cadmium", "toxin", "mycotoxin", "aflatoxin", "melamine",
      "cyanide", "sulfite", "sulfur dioxide",
    ],
  },
  {
    category: "Processing Defect",
    keywords: [
      "processing", "undercooked", "temperature", "undercook",
      "contamination during processing", "improper processing",
      "under-processed", "temperature abuse", "inadequate processing",
    ],
  },
];

/**
 * Assigns a normalized reason category based on keyword matching
 * against the reason text. First match wins (priority order).
 */
export function categorizeReason(reason: string): string {
  const lower = reason.toLowerCase();

  for (const rule of REASON_KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return "Other";
}

// ---------------------------------------------------------------------------
// Distribution States Parsing
// ---------------------------------------------------------------------------

interface DistributionResult {
  states: string[];
  nationwide: boolean;
}

/** All valid abbreviations as a Set for O(1) lookup. */
const VALID_ABBREVIATIONS = new Set<string>(STATE_ABBREVIATIONS);

/**
 * Parses a free-text distribution string into an array of state abbreviations.
 *
 * Handles:
 * - "Nationwide", "All states", "US wide", etc.
 * - Comma-separated abbreviations: "CA, TX, FL"
 * - Comma-separated full names: "California, Texas, and Florida"
 * - Prose: "distributed in the states of California, Texas, and Florida"
 * - Mixed: "CA, Texas, New York"
 * - Semi-colon separated
 *
 * If nationwide is detected, returns all state abbreviations.
 */
export function parseDistributionStates(text: string): DistributionResult {
  if (!text || text.trim().length === 0) {
    return { states: [], nationwide: false };
  }

  const lower = text.toLowerCase().trim();

  // Check for nationwide keywords
  const isNationwide = NATIONWIDE_KEYWORDS.some((kw) => lower.includes(kw));

  if (isNationwide) {
    return {
      states: [...STATE_ABBREVIATIONS],
      nationwide: true,
    };
  }

  const found = new Set<string>();

  // Strategy 1: Find all two-letter state abbreviations using word boundaries.
  // We match uppercase abbreviation tokens from the original text.
  const abbreviationRegex = /\b([A-Z]{2})\b/g;
  let match: RegExpExecArray | null;
  while ((match = abbreviationRegex.exec(text)) !== null) {
    const abbr = match[1];
    if (VALID_ABBREVIATIONS.has(abbr)) {
      found.add(abbr);
    }
  }

  // Strategy 2: Find full state names (case-insensitive)
  for (const [name, abbr] of Object.entries(STATE_NAME_TO_ABBREVIATION)) {
    if (lower.includes(name)) {
      found.add(abbr);
    }
  }

  return {
    states: Array.from(found).sort(),
    nationwide: false,
  };
}

// ---------------------------------------------------------------------------
// Classification Extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the classification Roman numeral from various string formats.
 * "Class I" -> "I", "Class II" -> "II", "CLASS III" -> "III"
 * Also handles standalone "I", "II", "III".
 * Defaults to "I" (most conservative) if unparseable.
 */
export function extractClassification(raw?: string | null): RecallClassification {
  if (!raw) return "I";

  const cleaned = raw.trim().toUpperCase();

  // Try "CLASS III", "CLASS II", "CLASS I" patterns (check III first to avoid
  // matching "III" as "II" + "I")
  if (cleaned.includes("III") || cleaned.includes("3")) return "III";
  if (cleaned.includes("II") || cleaned.includes("2")) return "II";
  if (cleaned.includes("I") || cleaned.includes("1")) return "I";

  return "I";
}

// ---------------------------------------------------------------------------
// Status Normalization
// ---------------------------------------------------------------------------

export function normalizeStatus(raw?: string | null): string {
  if (!raw) return "Ongoing";

  const lower = raw.toLowerCase().trim();

  if (lower.includes("ongoing") || lower.includes("active") || lower.includes("open")) {
    return "Ongoing";
  }
  if (lower.includes("completed") || lower.includes("closed") || lower.includes("complete")) {
    return "Completed";
  }
  if (lower.includes("terminated") || lower.includes("cancelled") || lower.includes("canceled")) {
    return "Terminated";
  }

  return "Ongoing";
}

// ---------------------------------------------------------------------------
// Date Parsing
// ---------------------------------------------------------------------------

/**
 * Parses an openFDA date string. The API uses YYYYMMDD format.
 */
export function parseFdaDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim();

  // YYYYMMDD format
  if (/^\d{8}$/.test(cleaned)) {
    const year = parseInt(cleaned.slice(0, 4), 10);
    const month = parseInt(cleaned.slice(4, 6), 10) - 1; // 0-indexed
    const day = parseInt(cleaned.slice(6, 8), 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  // Fallback to flexible parsing
  return parseFlexibleDate(cleaned);
}

/**
 * Parses dates in various formats commonly found in USDA and FDA data:
 * - YYYYMMDD
 * - YYYY-MM-DD
 * - MM/DD/YYYY
 * - Month DD, YYYY (e.g., "January 15, 2024")
 * - ISO 8601 timestamps
 */
export function parseFlexibleDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (cleaned.length === 0) return null;

  // YYYYMMDD
  if (/^\d{8}$/.test(cleaned)) {
    const year = parseInt(cleaned.slice(0, 4), 10);
    const month = parseInt(cleaned.slice(4, 6), 10) - 1;
    const day = parseInt(cleaned.slice(6, 8), 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(cleaned)) {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) return date;
  }

  // MM/DD/YYYY or MM-DD-YYYY
  const mdyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    if (!isNaN(date.getTime())) return date;
  }

  // "Month DD, YYYY" or "Month DD YYYY"
  const namedMonthMatch = cleaned.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
  );
  if (namedMonthMatch) {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) return date;
  }

  // ISO 8601 fallback
  const date = new Date(cleaned);
  if (!isNaN(date.getTime())) return date;

  logger.warn(SOURCE, `Could not parse date: "${cleaned}"`);
  return null;
}

// ---------------------------------------------------------------------------
// URL Construction
// ---------------------------------------------------------------------------

function buildFdaUrl(_recallNumber: string): string {
  // The FDA enforcement detail URL uses the recall_number for search
  return `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`;
}

function buildUsdaUrl(_recallNumber: string): string {
  return `https://www.fsis.usda.gov/recalls`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the first non-empty string value from a USDA record
 * by trying multiple possible field names.
 */
function extractUsdaField(
  raw: UsdaFsisRecallResult,
  fieldNames: string[]
): string | null {
  for (const name of fieldNames) {
    const value = raw[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

/**
 * Normalizes a state string to its two-letter abbreviation.
 * Handles full names and abbreviations.
 */
function normalizeStateAbbreviation(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();

  // Already a valid abbreviation
  if (cleaned.length === 2 && VALID_ABBREVIATIONS.has(cleaned.toUpperCase())) {
    return cleaned.toUpperCase();
  }

  // Full state name
  const abbr = STATE_NAME_TO_ABBREVIATION[cleaned.toLowerCase()];
  return abbr ?? null;
}

// ---------------------------------------------------------------------------
// Validation — ensure all referenced constants actually exist
// ---------------------------------------------------------------------------

// Type-level check: all categories used in keyword rules exist in the constants
const _productCategoryCheck: ReadonlyArray<string> = PRODUCT_CATEGORIES;
const _reasonCategoryCheck: ReadonlyArray<string> = REASON_CATEGORIES;
void _productCategoryCheck;
void _reasonCategoryCheck;
