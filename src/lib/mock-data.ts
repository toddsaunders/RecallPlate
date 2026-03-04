/**
 * RecallPlate — Mock Data
 *
 * Realistic mock data for front-end development while API routes
 * are being built in parallel. This file provides mock recall events,
 * dashboard stats, state counts, category breakdowns, severity
 * distributions, and timeline data.
 */

import type {
  RecallEventSerialized,
  DashboardStats,
  StateRecallCount,
  CategoryBreakdown,
  SeverityDistribution,
  TimelineDataPoint,
  PaginatedResponse,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock Recall Events
// ---------------------------------------------------------------------------

export const MOCK_RECALLS: RecallEventSerialized[] = [
  {
    id: "rec_001",
    source: "FDA",
    recallNumber: "F-0123-2026",
    classification: "I",
    status: "Ongoing",
    productDescription:
      "Organic Baby Spinach, 5oz clamshell packages, distributed under the brand 'Fresh Fields Organics'",
    productCategory: "Fruits & Vegetables",
    reason:
      "Product may be contaminated with Listeria monocytogenes, an organism which can cause serious and sometimes fatal infections in young children, frail or elderly people, and others with weakened immune systems.",
    reasonCategory: "Bacterial Contamination",
    recallingFirm: "Fresh Fields Organics, LLC",
    distributionStates: ["CA", "OR", "WA", "NV", "AZ"],
    nationwide: false,
    reportDate: "2026-02-28T00:00:00.000Z",
    recallInitiationDate: "2026-02-25T00:00:00.000Z",
    city: "Salinas",
    state: "CA",
    quantity: "12,400 units",
    url: "https://www.fda.gov/safety/recalls/example-001",
    aiSummary:
      "Fresh Fields Organics is recalling 12,400 units of organic baby spinach due to potential Listeria contamination. The 5oz clamshell packages were distributed to stores in CA, OR, WA, NV, and AZ. Consumers should not eat this product and should return it for a full refund.",
    createdAt: "2026-02-28T12:00:00.000Z",
    updatedAt: "2026-02-28T12:00:00.000Z",
  },
  {
    id: "rec_002",
    source: "USDA",
    recallNumber: "USDA-012-2026",
    classification: "I",
    status: "Ongoing",
    productDescription:
      "Ready-to-eat chicken salad products, 12oz and 24oz containers, sold at deli counters nationwide",
    productCategory: "Meat & Poultry",
    reason:
      "Products may be contaminated with Salmonella, which can cause foodborne illness.",
    reasonCategory: "Bacterial Contamination",
    recallingFirm: "National Deli Foods Inc.",
    distributionStates: [],
    nationwide: true,
    reportDate: "2026-02-26T00:00:00.000Z",
    recallInitiationDate: "2026-02-24T00:00:00.000Z",
    city: "Chicago",
    state: "IL",
    quantity: "Approximately 45,000 pounds",
    url: "https://www.fsis.usda.gov/recalls/example-002",
    aiSummary:
      "National Deli Foods is recalling approximately 45,000 pounds of ready-to-eat chicken salad due to possible Salmonella contamination. These products were sold at deli counters nationwide in 12oz and 24oz containers. Consumers should discard the product or return it to the store.",
    createdAt: "2026-02-26T12:00:00.000Z",
    updatedAt: "2026-02-26T12:00:00.000Z",
  },
  {
    id: "rec_003",
    source: "FDA",
    recallNumber: "F-0145-2026",
    classification: "II",
    status: "Ongoing",
    productDescription:
      "Artisan Sourdough Bread Loaves, 1lb, containing undeclared milk and wheat allergens",
    productCategory: "Grains & Bakery",
    reason:
      "Product contains undeclared milk and wheat, which are known allergens. People who have an allergy or severe sensitivity to milk or wheat run the risk of serious or life-threatening allergic reaction.",
    reasonCategory: "Undeclared Allergens",
    recallingFirm: "Heritage Bakery Co.",
    distributionStates: ["NY", "NJ", "CT", "PA", "MA"],
    nationwide: false,
    reportDate: "2026-02-20T00:00:00.000Z",
    recallInitiationDate: "2026-02-18T00:00:00.000Z",
    city: "Brooklyn",
    state: "NY",
    quantity: "3,200 loaves",
    url: "https://www.fda.gov/safety/recalls/example-003",
    aiSummary:
      "Heritage Bakery Co. is recalling 3,200 loaves of Artisan Sourdough Bread due to undeclared milk and wheat allergens. Distributed in NY, NJ, CT, PA, and MA. Consumers with milk or wheat allergies should not consume this product.",
    createdAt: "2026-02-20T12:00:00.000Z",
    updatedAt: "2026-02-20T12:00:00.000Z",
  },
  {
    id: "rec_004",
    source: "FDA",
    recallNumber: "F-0167-2026",
    classification: "III",
    status: "Completed",
    productDescription:
      "Premium Mixed Nuts, 16oz cans, mislabeled with incorrect 'Best By' date",
    productCategory: "Nuts & Seeds",
    reason:
      "Product labels contain an incorrect 'Best By' date that could mislead consumers about freshness.",
    reasonCategory: "Misbranding/Mislabeling",
    recallingFirm: "Golden Harvest Snacks",
    distributionStates: ["TX", "OK", "LA", "AR"],
    nationwide: false,
    reportDate: "2025-11-15T00:00:00.000Z",
    recallInitiationDate: "2025-11-12T00:00:00.000Z",
    city: "Dallas",
    state: "TX",
    quantity: "8,500 cans",
    url: "https://www.fda.gov/safety/recalls/example-004",
    aiSummary:
      "Golden Harvest Snacks is recalling 8,500 cans of Premium Mixed Nuts due to incorrect 'Best By' date labeling. Distributed in TX, OK, LA, and AR. This is a low-risk labeling issue; the product itself is not unsafe.",
    createdAt: "2025-11-15T12:00:00.000Z",
    updatedAt: "2025-11-18T12:00:00.000Z",
  },
  {
    id: "rec_005",
    source: "FDA",
    recallNumber: "F-0189-2026",
    classification: "I",
    status: "Ongoing",
    productDescription:
      "Infant Formula Powder, 12.5oz cans, 'TenderStart Premium Infant Formula with Iron'",
    productCategory: "Baby Food & Formula",
    reason:
      "Product may be contaminated with Cronobacter sakazakii, a bacterium that can cause severe illness in infants.",
    reasonCategory: "Bacterial Contamination",
    recallingFirm: "TenderStart Nutrition Inc.",
    distributionStates: [],
    nationwide: true,
    reportDate: "2026-03-01T00:00:00.000Z",
    recallInitiationDate: "2026-02-28T00:00:00.000Z",
    city: "Columbus",
    state: "OH",
    quantity: "28,000 cans",
    url: "https://www.fda.gov/safety/recalls/example-005",
    aiSummary:
      "TenderStart Nutrition is recalling 28,000 cans of infant formula powder due to possible Cronobacter sakazakii contamination. This is a Class I recall — the most serious type. Parents should stop using this product immediately and contact their pediatrician.",
    createdAt: "2026-03-01T12:00:00.000Z",
    updatedAt: "2026-03-01T12:00:00.000Z",
  },
  {
    id: "rec_006",
    source: "USDA",
    recallNumber: "USDA-018-2026",
    classification: "II",
    status: "Ongoing",
    productDescription:
      "Frozen Beef Patties, 2lb boxes, 'Rancher's Choice 100% Angus Beef Patties'",
    productCategory: "Meat & Poultry",
    reason:
      "Products may contain pieces of hard plastic from a packaging equipment malfunction.",
    reasonCategory: "Foreign Material",
    recallingFirm: "Rancher's Choice Meats",
    distributionStates: ["CO", "WY", "MT", "NE", "KS", "SD", "ND"],
    nationwide: false,
    reportDate: "2026-02-22T00:00:00.000Z",
    recallInitiationDate: "2026-02-20T00:00:00.000Z",
    city: "Denver",
    state: "CO",
    quantity: "15,000 pounds",
    url: "https://www.fsis.usda.gov/recalls/example-006",
    aiSummary:
      "Rancher's Choice Meats is recalling 15,000 pounds of frozen beef patties that may contain hard plastic pieces from a packaging equipment malfunction. Distributed in CO, WY, MT, NE, KS, SD, and ND.",
    createdAt: "2026-02-22T12:00:00.000Z",
    updatedAt: "2026-02-22T12:00:00.000Z",
  },
  {
    id: "rec_007",
    source: "FDA",
    recallNumber: "F-0201-2026",
    classification: "II",
    status: "Ongoing",
    productDescription:
      "Organic Whole Milk Yogurt, 32oz containers, 'Mountain Meadow Organic Plain Yogurt'",
    productCategory: "Dairy & Eggs",
    reason:
      "Product contains undeclared tree nuts (almonds) from cross-contamination during production.",
    reasonCategory: "Undeclared Allergens",
    recallingFirm: "Mountain Meadow Dairy",
    distributionStates: ["VT", "NH", "ME", "MA", "CT", "RI"],
    nationwide: false,
    reportDate: "2025-10-18T00:00:00.000Z",
    recallInitiationDate: "2025-10-16T00:00:00.000Z",
    city: "Burlington",
    state: "VT",
    quantity: "5,600 containers",
    url: "https://www.fda.gov/safety/recalls/example-007",
    aiSummary:
      "Mountain Meadow Dairy is recalling 5,600 containers of organic whole milk yogurt due to undeclared almond allergens from cross-contamination. Distributed across New England states.",
    createdAt: "2025-10-18T12:00:00.000Z",
    updatedAt: "2025-10-18T12:00:00.000Z",
  },
  {
    id: "rec_008",
    source: "FDA",
    recallNumber: "F-0215-2026",
    classification: "I",
    status: "Ongoing",
    productDescription:
      "Smoked Salmon Fillets, vacuum-sealed 8oz packages, 'Pacific Catch Wild Smoked Sockeye'",
    productCategory: "Seafood & Fish",
    reason:
      "Product may be contaminated with Clostridium botulinum, the bacterium that causes botulism.",
    reasonCategory: "Bacterial Contamination",
    recallingFirm: "Pacific Catch Seafood Co.",
    distributionStates: ["WA", "OR", "CA", "AK", "HI"],
    nationwide: false,
    reportDate: "2026-03-02T00:00:00.000Z",
    recallInitiationDate: "2026-03-01T00:00:00.000Z",
    city: "Seattle",
    state: "WA",
    quantity: "6,200 packages",
    url: "https://www.fda.gov/safety/recalls/example-008",
    aiSummary:
      "Pacific Catch Seafood Co. is recalling 6,200 packages of smoked salmon fillets due to potential Clostridium botulinum contamination. This is a Class I recall. Consumers in WA, OR, CA, AK, and HI should dispose of the product immediately.",
    createdAt: "2026-03-02T12:00:00.000Z",
    updatedAt: "2026-03-02T12:00:00.000Z",
  },
  {
    id: "rec_009",
    source: "FDA",
    recallNumber: "F-0230-2026",
    classification: "II",
    status: "Completed",
    productDescription:
      "Vitamin D3 Supplements, 60-count bottles, '5000 IU softgels' by VitaWell",
    productCategory: "Supplements & Vitamins",
    reason:
      "Potency testing revealed that some bottles may contain up to 2x the labeled dose of Vitamin D3.",
    reasonCategory: "Processing Defect",
    recallingFirm: "VitaWell Nutrition",
    distributionStates: ["FL", "GA", "SC", "NC", "AL"],
    nationwide: false,
    reportDate: "2025-08-10T00:00:00.000Z",
    recallInitiationDate: "2025-08-08T00:00:00.000Z",
    city: "Tampa",
    state: "FL",
    quantity: "18,000 bottles",
    url: "https://www.fda.gov/safety/recalls/example-009",
    aiSummary:
      "VitaWell Nutrition is recalling 18,000 bottles of Vitamin D3 supplements because some may contain double the labeled dose. Distributed in FL, GA, SC, NC, and AL.",
    createdAt: "2025-08-10T12:00:00.000Z",
    updatedAt: "2025-08-14T12:00:00.000Z",
  },
  {
    id: "rec_010",
    source: "FDA",
    recallNumber: "F-0245-2026",
    classification: "II",
    status: "Ongoing",
    productDescription:
      "Organic Peanut Butter, 16oz jars, 'Simply Natural Creamy Organic Peanut Butter'",
    productCategory: "Condiments & Sauces",
    reason:
      "Product may contain small metal fragments from a processing line malfunction.",
    reasonCategory: "Foreign Material",
    recallingFirm: "Simply Natural Foods Corp.",
    distributionStates: ["OH", "MI", "IN", "KY", "WV"],
    nationwide: false,
    reportDate: "2025-12-12T00:00:00.000Z",
    recallInitiationDate: "2025-12-10T00:00:00.000Z",
    city: "Cincinnati",
    state: "OH",
    quantity: "9,800 jars",
    url: "https://www.fda.gov/safety/recalls/example-010",
    aiSummary:
      "Simply Natural Foods is recalling 9,800 jars of organic peanut butter that may contain small metal fragments. Distributed in OH, MI, IN, KY, and WV.",
    createdAt: "2025-12-12T12:00:00.000Z",
    updatedAt: "2025-12-12T12:00:00.000Z",
  },
  {
    id: "rec_011",
    source: "FDA",
    recallNumber: "F-0260-2026",
    classification: "III",
    status: "Completed",
    productDescription:
      "Sparkling Lemonade, 12-pack of 12oz cans, 'Sunny Sip Sparkling Lemonade'",
    productCategory: "Beverages",
    reason:
      "Product labels do not list sulfites as an ingredient, which is required for consumers with sulfite sensitivity.",
    reasonCategory: "Misbranding/Mislabeling",
    recallingFirm: "Sunny Sip Beverage Co.",
    distributionStates: ["GA", "FL", "SC", "TN", "AL", "MS"],
    nationwide: false,
    reportDate: "2025-07-05T00:00:00.000Z",
    recallInitiationDate: "2025-07-03T00:00:00.000Z",
    city: "Atlanta",
    state: "GA",
    quantity: "22,000 12-packs",
    url: "https://www.fda.gov/safety/recalls/example-011",
    aiSummary:
      "Sunny Sip Beverage Co. is recalling 22,000 12-packs of sparkling lemonade due to undeclared sulfites on the label. Low health risk for most consumers.",
    createdAt: "2025-07-05T12:00:00.000Z",
    updatedAt: "2025-07-10T12:00:00.000Z",
  },
  {
    id: "rec_012",
    source: "FDA",
    recallNumber: "F-0275-2026",
    classification: "I",
    status: "Ongoing",
    productDescription:
      "Grain-Free Premium Dog Food, 30lb bags, 'PawPure Grain-Free Adult Formula'",
    productCategory: "Pet Food",
    reason:
      "Product may contain elevated levels of aflatoxin, a toxin produced by mold that can be harmful to pets.",
    reasonCategory: "Chemical Contamination",
    recallingFirm: "PawPure Pet Nutrition",
    distributionStates: [],
    nationwide: true,
    reportDate: "2026-03-03T00:00:00.000Z",
    recallInitiationDate: "2026-03-02T00:00:00.000Z",
    city: "Kansas City",
    state: "MO",
    quantity: "50,000 bags",
    url: "https://www.fda.gov/safety/recalls/example-012",
    aiSummary:
      "PawPure Pet Nutrition is recalling 50,000 bags of grain-free dog food due to elevated aflatoxin levels. Distributed nationwide. Pet owners should stop feeding this product immediately.",
    createdAt: "2026-03-03T12:00:00.000Z",
    updatedAt: "2026-03-03T12:00:00.000Z",
  },
  {
    id: "rec_013",
    source: "USDA",
    recallNumber: "USDA-025-2026",
    classification: "II",
    status: "Ongoing",
    productDescription:
      "Frozen Turkey Sausage Links, 12oz packages, 'Heartland Farms Turkey Breakfast Links'",
    productCategory: "Meat & Poultry",
    reason:
      "Products contain undeclared soy protein, a known allergen not listed on the label.",
    reasonCategory: "Undeclared Allergens",
    recallingFirm: "Heartland Farms Processing",
    distributionStates: ["IA", "MN", "WI", "IL", "MO", "NE"],
    nationwide: false,
    reportDate: "2025-09-08T00:00:00.000Z",
    recallInitiationDate: "2025-09-06T00:00:00.000Z",
    city: "Des Moines",
    state: "IA",
    quantity: "20,000 pounds",
    url: "https://www.fsis.usda.gov/recalls/example-013",
    aiSummary:
      "Heartland Farms Processing is recalling 20,000 pounds of frozen turkey sausage links due to undeclared soy protein. Distributed in IA, MN, WI, IL, MO, and NE.",
    createdAt: "2025-09-08T12:00:00.000Z",
    updatedAt: "2025-09-08T12:00:00.000Z",
  },
  {
    id: "rec_014",
    source: "FDA",
    recallNumber: "F-0290-2026",
    classification: "I",
    status: "Ongoing",
    productDescription:
      "Frozen Prepared Burrito Bowls, 10oz trays, 'QuickBite Southwest Chicken Bowl'",
    productCategory: "Prepared/Frozen Meals",
    reason:
      "Product may be contaminated with E. coli O157:H7 due to a contaminated ingredient.",
    reasonCategory: "Bacterial Contamination",
    recallingFirm: "QuickBite Frozen Foods LLC",
    distributionStates: ["AZ", "NM", "TX", "CO", "UT", "NV"],
    nationwide: false,
    reportDate: "2026-03-04T00:00:00.000Z",
    recallInitiationDate: "2026-03-03T00:00:00.000Z",
    city: "Phoenix",
    state: "AZ",
    quantity: "35,000 trays",
    url: "https://www.fda.gov/safety/recalls/example-014",
    aiSummary:
      "QuickBite Frozen Foods is recalling 35,000 trays of frozen burrito bowls due to potential E. coli O157:H7 contamination. This is a Class I recall. Consumers in AZ, NM, TX, CO, UT, and NV should not eat this product.",
    createdAt: "2026-03-04T12:00:00.000Z",
    updatedAt: "2026-03-04T12:00:00.000Z",
  },
  {
    id: "rec_015",
    source: "FDA",
    recallNumber: "F-0305-2026",
    classification: "II",
    status: "Ongoing",
    productDescription:
      "Trail Mix Snack Packs, 1.5oz individual bags, 'Trailhead Adventure Mix' sold in variety packs",
    productCategory: "Snacks & Candy",
    reason:
      "Product contains undeclared cashews, which are a tree nut allergen not listed on the outer packaging.",
    reasonCategory: "Undeclared Allergens",
    recallingFirm: "Trailhead Snacks Inc.",
    distributionStates: ["WA", "OR", "ID", "MT"],
    nationwide: false,
    reportDate: "2026-02-25T00:00:00.000Z",
    recallInitiationDate: "2026-02-23T00:00:00.000Z",
    city: "Portland",
    state: "OR",
    quantity: "14,000 variety packs",
    url: "https://www.fda.gov/safety/recalls/example-015",
    aiSummary:
      "Trailhead Snacks is recalling 14,000 variety packs of trail mix due to undeclared cashews on the outer packaging. Distributed in WA, OR, ID, and MT.",
    createdAt: "2026-02-25T12:00:00.000Z",
    updatedAt: "2026-02-25T12:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Mock Dashboard Stats
// ---------------------------------------------------------------------------

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalActiveRecalls: 142,
  fdaCount: 98,
  usdaCount: 44,
  topReasonCategory: "Bacterial Contamination",
  lastUpdated: "2026-03-04T08:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Mock State Recall Counts
// ---------------------------------------------------------------------------

export const MOCK_STATE_COUNTS: StateRecallCount[] = [
  { state: "California", count: 28, fdaCount: 19, usdaCount: 9 },
  { state: "Texas", count: 22, fdaCount: 14, usdaCount: 8 },
  { state: "New York", count: 19, fdaCount: 13, usdaCount: 6 },
  { state: "Florida", count: 17, fdaCount: 12, usdaCount: 5 },
  { state: "Illinois", count: 14, fdaCount: 9, usdaCount: 5 },
  { state: "Pennsylvania", count: 12, fdaCount: 8, usdaCount: 4 },
  { state: "Ohio", count: 11, fdaCount: 7, usdaCount: 4 },
  { state: "Georgia", count: 10, fdaCount: 7, usdaCount: 3 },
  { state: "Michigan", count: 9, fdaCount: 6, usdaCount: 3 },
  { state: "North Carolina", count: 8, fdaCount: 5, usdaCount: 3 },
  { state: "New Jersey", count: 8, fdaCount: 6, usdaCount: 2 },
  { state: "Washington", count: 7, fdaCount: 5, usdaCount: 2 },
  { state: "Oregon", count: 7, fdaCount: 5, usdaCount: 2 },
  { state: "Virginia", count: 6, fdaCount: 4, usdaCount: 2 },
  { state: "Massachusetts", count: 6, fdaCount: 4, usdaCount: 2 },
  { state: "Arizona", count: 6, fdaCount: 4, usdaCount: 2 },
  { state: "Colorado", count: 5, fdaCount: 3, usdaCount: 2 },
  { state: "Indiana", count: 5, fdaCount: 3, usdaCount: 2 },
  { state: "Tennessee", count: 5, fdaCount: 3, usdaCount: 2 },
  { state: "Missouri", count: 4, fdaCount: 3, usdaCount: 1 },
  { state: "Minnesota", count: 4, fdaCount: 3, usdaCount: 1 },
  { state: "Wisconsin", count: 4, fdaCount: 2, usdaCount: 2 },
  { state: "Maryland", count: 3, fdaCount: 2, usdaCount: 1 },
  { state: "Alabama", count: 3, fdaCount: 2, usdaCount: 1 },
  { state: "South Carolina", count: 3, fdaCount: 2, usdaCount: 1 },
  { state: "Louisiana", count: 3, fdaCount: 2, usdaCount: 1 },
  { state: "Kentucky", count: 3, fdaCount: 2, usdaCount: 1 },
  { state: "Connecticut", count: 2, fdaCount: 1, usdaCount: 1 },
  { state: "Iowa", count: 2, fdaCount: 1, usdaCount: 1 },
  { state: "Oklahoma", count: 2, fdaCount: 1, usdaCount: 1 },
  { state: "Nevada", count: 2, fdaCount: 2, usdaCount: 0 },
  { state: "Kansas", count: 2, fdaCount: 1, usdaCount: 1 },
  { state: "Utah", count: 2, fdaCount: 1, usdaCount: 1 },
  { state: "Arkansas", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "Mississippi", count: 1, fdaCount: 0, usdaCount: 1 },
  { state: "Nebraska", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "New Mexico", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "Idaho", count: 1, fdaCount: 0, usdaCount: 1 },
  { state: "Montana", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "Vermont", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "New Hampshire", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "Maine", count: 1, fdaCount: 0, usdaCount: 1 },
  { state: "Hawaii", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "West Virginia", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "Rhode Island", count: 1, fdaCount: 1, usdaCount: 0 },
  { state: "Delaware", count: 0, fdaCount: 0, usdaCount: 0 },
  { state: "South Dakota", count: 0, fdaCount: 0, usdaCount: 0 },
  { state: "North Dakota", count: 0, fdaCount: 0, usdaCount: 0 },
  { state: "Wyoming", count: 0, fdaCount: 0, usdaCount: 0 },
  { state: "Alaska", count: 0, fdaCount: 0, usdaCount: 0 },
];

// ---------------------------------------------------------------------------
// Mock Category Breakdown
// ---------------------------------------------------------------------------

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: "Meat & Poultry", count: 32, fdaCount: 12, usdaCount: 20, color: "#E63B2E" },
  { category: "Fruits & Vegetables", count: 24, fdaCount: 20, usdaCount: 4, color: "#0E8A7D" },
  { category: "Dairy & Eggs", count: 18, fdaCount: 14, usdaCount: 4, color: "#E6C820" },
  { category: "Grains & Bakery", count: 14, fdaCount: 11, usdaCount: 3, color: "#F28C28" },
  { category: "Seafood & Fish", count: 12, fdaCount: 9, usdaCount: 3, color: "#2B5CE6" },
  { category: "Snacks & Candy", count: 10, fdaCount: 9, usdaCount: 1, color: "#D94F8A" },
  { category: "Prepared/Frozen Meals", count: 9, fdaCount: 4, usdaCount: 5, color: "#7B3FA0" },
  { category: "Condiments & Sauces", count: 7, fdaCount: 6, usdaCount: 1, color: "#E63B2E" },
  { category: "Baby Food & Formula", count: 5, fdaCount: 5, usdaCount: 0, color: "#D94F8A" },
  { category: "Supplements & Vitamins", count: 4, fdaCount: 4, usdaCount: 0, color: "#0E8A7D" },
  { category: "Beverages", count: 3, fdaCount: 3, usdaCount: 0, color: "#2B5CE6" },
  { category: "Nuts & Seeds", count: 2, fdaCount: 2, usdaCount: 0, color: "#F28C28" },
  { category: "Pet Food", count: 1, fdaCount: 1, usdaCount: 0, color: "#E6C820" },
  { category: "Other", count: 1, fdaCount: 0, usdaCount: 1, color: "#1A1A1E" },
];

// ---------------------------------------------------------------------------
// Mock Severity Distribution
// ---------------------------------------------------------------------------

export const MOCK_SEVERITY_DISTRIBUTION: SeverityDistribution[] = [
  {
    classification: "I",
    label: "Serious Health Risk",
    count: 48,
    fdaCount: 30,
    usdaCount: 18,
    percentage: 33.8,
  },
  {
    classification: "II",
    label: "Remote Health Risk",
    count: 68,
    fdaCount: 45,
    usdaCount: 23,
    percentage: 47.9,
  },
  {
    classification: "III",
    label: "Not Likely Harmful",
    count: 26,
    fdaCount: 23,
    usdaCount: 3,
    percentage: 18.3,
  },
];

// ---------------------------------------------------------------------------
// Mock Timeline Data (last 30 days)
// ---------------------------------------------------------------------------

function generateTimelineData(): TimelineDataPoint[] {
  const points: TimelineDataPoint[] = [];
  const now = new Date("2026-03-04");

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const classI = Math.floor(Math.random() * 4) + 1;
    const classII = Math.floor(Math.random() * 6) + 2;
    const classIII = Math.floor(Math.random() * 3);
    const total = classI + classII + classIII;
    const fdaCount = Math.floor(total * 0.65) + Math.floor(Math.random() * 2);
    const usdaCount = total - fdaCount;

    points.push({
      date: dateStr,
      count: total,
      fdaCount: Math.max(0, fdaCount),
      usdaCount: Math.max(0, usdaCount),
      classI,
      classII,
      classIII,
    });
  }

  return points;
}

export const MOCK_TIMELINE_DATA: TimelineDataPoint[] = generateTimelineData();

// ---------------------------------------------------------------------------
// Helper: Convert state counts array to map
// ---------------------------------------------------------------------------

export interface StateMapEntry {
  count: number;
  fdaCount: number;
  usdaCount: number;
}

export function stateCountsToMap(counts: StateRecallCount[]): Record<string, StateMapEntry> {
  const map: Record<string, StateMapEntry> = {};
  for (const { state, count, fdaCount, usdaCount } of counts) {
    map[state] = { count, fdaCount, usdaCount };
  }
  return map;
}

// ---------------------------------------------------------------------------
// Helper: Create paginated response
// ---------------------------------------------------------------------------

export function paginateMockRecalls(
  recalls: RecallEventSerialized[],
  page: number,
  limit: number
): PaginatedResponse<RecallEventSerialized> {
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = recalls.slice(start, end);

  return {
    data,
    total: recalls.length,
    page,
    limit,
    totalPages: Math.ceil(recalls.length / limit),
  };
}
