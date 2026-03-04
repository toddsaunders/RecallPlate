/**
 * RecallPlate — Shared Constants
 *
 * Product categories, reason categories, US states, severity labels,
 * folder colors, and nationwide detection keywords.
 */

// ---------------------------------------------------------------------------
// Product Categories (14)
// ---------------------------------------------------------------------------

export const PRODUCT_CATEGORIES = [
  "Dairy & Eggs",
  "Meat & Poultry",
  "Seafood & Fish",
  "Fruits & Vegetables",
  "Grains & Bakery",
  "Snacks & Candy",
  "Beverages",
  "Nuts & Seeds",
  "Prepared/Frozen Meals",
  "Condiments & Sauces",
  "Baby Food & Formula",
  "Supplements & Vitamins",
  "Pet Food",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Reason Categories (7)
// ---------------------------------------------------------------------------

export const REASON_CATEGORIES = [
  "Bacterial Contamination",
  "Undeclared Allergens",
  "Foreign Material",
  "Misbranding/Mislabeling",
  "Chemical Contamination",
  "Processing Defect",
  "Other",
] as const;

export type ReasonCategory = (typeof REASON_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// US States + DC + Territories
// ---------------------------------------------------------------------------

export const US_STATES = [
  { name: "Alabama", abbreviation: "AL" },
  { name: "Alaska", abbreviation: "AK" },
  { name: "Arizona", abbreviation: "AZ" },
  { name: "Arkansas", abbreviation: "AR" },
  { name: "California", abbreviation: "CA" },
  { name: "Colorado", abbreviation: "CO" },
  { name: "Connecticut", abbreviation: "CT" },
  { name: "Delaware", abbreviation: "DE" },
  { name: "Florida", abbreviation: "FL" },
  { name: "Georgia", abbreviation: "GA" },
  { name: "Hawaii", abbreviation: "HI" },
  { name: "Idaho", abbreviation: "ID" },
  { name: "Illinois", abbreviation: "IL" },
  { name: "Indiana", abbreviation: "IN" },
  { name: "Iowa", abbreviation: "IA" },
  { name: "Kansas", abbreviation: "KS" },
  { name: "Kentucky", abbreviation: "KY" },
  { name: "Louisiana", abbreviation: "LA" },
  { name: "Maine", abbreviation: "ME" },
  { name: "Maryland", abbreviation: "MD" },
  { name: "Massachusetts", abbreviation: "MA" },
  { name: "Michigan", abbreviation: "MI" },
  { name: "Minnesota", abbreviation: "MN" },
  { name: "Mississippi", abbreviation: "MS" },
  { name: "Missouri", abbreviation: "MO" },
  { name: "Montana", abbreviation: "MT" },
  { name: "Nebraska", abbreviation: "NE" },
  { name: "Nevada", abbreviation: "NV" },
  { name: "New Hampshire", abbreviation: "NH" },
  { name: "New Jersey", abbreviation: "NJ" },
  { name: "New Mexico", abbreviation: "NM" },
  { name: "New York", abbreviation: "NY" },
  { name: "North Carolina", abbreviation: "NC" },
  { name: "North Dakota", abbreviation: "ND" },
  { name: "Ohio", abbreviation: "OH" },
  { name: "Oklahoma", abbreviation: "OK" },
  { name: "Oregon", abbreviation: "OR" },
  { name: "Pennsylvania", abbreviation: "PA" },
  { name: "Rhode Island", abbreviation: "RI" },
  { name: "South Carolina", abbreviation: "SC" },
  { name: "South Dakota", abbreviation: "SD" },
  { name: "Tennessee", abbreviation: "TN" },
  { name: "Texas", abbreviation: "TX" },
  { name: "Utah", abbreviation: "UT" },
  { name: "Vermont", abbreviation: "VT" },
  { name: "Virginia", abbreviation: "VA" },
  { name: "Washington", abbreviation: "WA" },
  { name: "West Virginia", abbreviation: "WV" },
  { name: "Wisconsin", abbreviation: "WI" },
  { name: "Wyoming", abbreviation: "WY" },
  { name: "District of Columbia", abbreviation: "DC" },
  { name: "Puerto Rico", abbreviation: "PR" },
  { name: "U.S. Virgin Islands", abbreviation: "VI" },
  { name: "Guam", abbreviation: "GU" },
  { name: "American Samoa", abbreviation: "AS" },
  { name: "Northern Mariana Islands", abbreviation: "MP" },
] as const;

/** All two-letter state/territory abbreviations. */
export const STATE_ABBREVIATIONS = US_STATES.map((s) => s.abbreviation);

/** Map from state name (lowercase) to abbreviation for ETL parsing. */
export const STATE_NAME_TO_ABBREVIATION: Record<string, string> = Object.fromEntries(
  US_STATES.map((s) => [s.name.toLowerCase(), s.abbreviation])
);

/** Map from abbreviation to full state name. */
export const ABBREVIATION_TO_STATE_NAME: Record<string, string> = Object.fromEntries(
  US_STATES.map((s) => [s.abbreviation, s.name])
);

// ---------------------------------------------------------------------------
// Severity Classification Labels
// ---------------------------------------------------------------------------

export const SEVERITY_LABELS: Record<string, string> = {
  I: "Serious Health Risk",
  II: "Remote Health Risk",
  III: "Not Likely Harmful",
} as const;

export const SEVERITY_DESCRIPTIONS: Record<string, string> = {
  I: "A situation where there is a reasonable probability that use of or exposure to the product will cause serious adverse health consequences or death.",
  II: "A situation where use of or exposure to the product may cause temporary or medically reversible adverse health consequences, or where the probability of serious adverse health consequences is remote.",
  III: "A situation where use of or exposure to the product is not likely to cause adverse health consequences.",
} as const;

// ---------------------------------------------------------------------------
// Nationwide Detection Keywords
// ---------------------------------------------------------------------------

/** Keywords in distribution text that indicate nationwide distribution. */
export const NATIONWIDE_KEYWORDS = [
  "nationwide",
  "all states",
  "us wide",
  "united states",
  "all 50 states",
  "throughout the united states",
  "distributed nationally",
  "national distribution",
  "across the country",
  "countrywide",
] as const;

// ---------------------------------------------------------------------------
// Folder Color Mapping for Product Categories
// ---------------------------------------------------------------------------

/**
 * Maps each product category to a folder color from the design system.
 * Used for the Phase 1 folder explorer UI and accent inheritance.
 */
export const CATEGORY_FOLDER_COLORS: Record<string, string> = {
  "Dairy & Eggs": "#E6C820",
  "Meat & Poultry": "#E63B2E",
  "Seafood & Fish": "#2B5CE6",
  "Fruits & Vegetables": "#0E8A7D",
  "Grains & Bakery": "#F28C28",
  "Snacks & Candy": "#D94F8A",
  Beverages: "#2B5CE6",
  "Nuts & Seeds": "#F28C28",
  "Prepared/Frozen Meals": "#7B3FA0",
  "Condiments & Sauces": "#E63B2E",
  "Baby Food & Formula": "#D94F8A",
  "Supplements & Vitamins": "#0E8A7D",
  "Pet Food": "#E6C820",
  Other: "#1A1A1E",
} as const;

// ---------------------------------------------------------------------------
// API Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Default date range for dashboard views (last 30 days). */
export const DEFAULT_DAYS_BACK = 30;
