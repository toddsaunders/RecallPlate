# RecallPlate -- Product Requirements Document

**Version:** 1.0
**Last Updated:** 2026-03-03
**Status:** Draft
**Author:** Product Management

---

## Table of Contents

1. [Product Vision & Goals](#1-product-vision--goals)
2. [Target Users & Personas](#2-target-users--personas)
3. [Core Requirements & Features](#3-core-requirements--features)
4. [User Flows](#4-user-flows)
5. [Data Model & Schema](#5-data-model--schema)
6. [Technical Architecture](#6-technical-architecture)
7. [Design Principles](#7-design-principles)
8. [Acceptance Criteria](#8-acceptance-criteria)
9. [Success Metrics](#9-success-metrics)
10. [Phase Roadmap](#10-phase-roadmap)
11. [Open Questions & Risks](#11-open-questions--risks)
12. [Decisions Log](#12-decisions-log)

---

## 1. Product Vision & Goals

### Vision

RecallPlate is the "weather app for food safety" -- a consumer-facing web application that answers one question: **"Is my food safe?"**

It combines FDA and USDA food recall data into a single, clean, searchable dashboard. No product like this exists today. The current landscape is fragmented across government websites built in the early 2000s, a basic mobile app with poor UX, and abandoned open-source projects. RecallPlate fills that gap by delivering a modern, trustworthy, information-dense experience that treats food safety data as a public utility.

### Problem Statement

Today, a parent who hears about a food recall has no single place to check whether the products in their kitchen are affected. They must navigate between the FDA website, the USDA FSIS website, and various news articles -- each with different formats, different search mechanisms, and different levels of detail. The government language is dense and hard to parse quickly. There is no way to filter by state, by product category, or to get plain-English explanations of what the recall means.

### Goals for V1

| Goal | Description |
|------|-------------|
| **Unified Data** | Merge FDA food enforcement, USDA FSIS, and FDA animal/veterinary enforcement data into a single normalized database |
| **Instant Answers** | Let a user determine in under 30 seconds whether a specific product or product category has been recalled |
| **Geographic Relevance** | Let users filter recalls by the states where products were distributed |
| **Plain-English Clarity** | Translate dense government recall language into 2-3 sentence AI-generated summaries that a parent can scan in 10 seconds |
| **Visual Dashboard** | Provide high-level recall trend data through a map, timeline, category breakdown, and severity distribution |
| **Alert Foundation** | Capture email subscribers with state preferences so the alert system is ready to activate in V2 |
| **Performance** | Dashboard loads in under 2 seconds; search returns results in under 500ms |

### Non-Goals for V1

- Email/push alert delivery (V2)
- Personalized watchlists (V2)
- Barcode/UPC scanning (V3)
- CDC outbreak tracking (V3)
- Canadian recall data (out of scope entirely)
- Developer API (V3)
- Embeddable widgets (V2)
- Grocery loyalty card integration (long-term exploration)

---

## 2. Target Users & Personas

### Primary Persona: "Safety-Conscious Parent"

| Attribute | Detail |
|-----------|--------|
| **Name** | Sarah M. |
| **Age** | 34 |
| **Occupation** | Marketing manager, mother of two (ages 3 and 6) |
| **Technical Comfort** | Uses apps daily; comfortable with web search but not technical |
| **Context** | Hears about a recall on the news or social media. Wants to immediately check if the products in her kitchen are affected. Especially concerned about baby food, snacks, and pet food (family dog). |
| **Pain Points** | Government recall pages are confusing and hard to search. Doesn't know which agency covers which products. Recall language is jargon-heavy. No single source of truth. |
| **Jobs to Be Done** | (1) Check if a specific product is recalled. (2) Browse recent recalls in her state. (3) Understand the severity -- "Should I throw this out or is it fine?" (4) Sign up to be notified about future recalls. |
| **Success Criteria** | Finds the answer to "Is this recalled?" in under 30 seconds. Understands the severity without Googling medical terms. |

### Primary Persona: "Health-Aware Consumer"

| Attribute | Detail |
|-----------|--------|
| **Name** | Marcus T. |
| **Age** | 28 |
| **Occupation** | Software engineer, lives alone, cooks frequently |
| **Technical Comfort** | Highly technical; values fast, well-designed tools |
| **Context** | Follows food safety news casually. Wants to periodically check what's been recalled, browse by category, and understand trends. Interested in data visualization. |
| **Pain Points** | Existing government sites feel outdated and slow. No way to see trends or patterns. Wants a dashboard, not a list. |
| **Jobs to Be Done** | (1) Browse the dashboard to see what's happening in food safety. (2) Search for specific brands or products. (3) Explore recall trends by category and severity over time. (4) Share interesting findings. |
| **Success Criteria** | Dashboard gives a clear picture of current recall landscape within 10 seconds of landing. Filters work intuitively. |

### Secondary Personas (Future Phases)

| Persona | Description | Phase |
|---------|-------------|-------|
| **Journalist / Researcher** | Needs to quickly pull recall data for a story. Wants export, trends, and shareable state scorecards. | V2 |
| **Food Industry Professional** | QA/compliance staff monitoring competitor recalls and category trends. Wants alerts and API access. | V2/V3 |
| **Personal Injury Attorney** | Researches recall history for litigation. Needs historical data, company search, and detail pages with source links. | V2 |
| **Insurance Underwriter** | Assesses food safety risk for coverage decisions. Needs trend data and company recall history. | V3 |

---

## 3. Core Requirements & Features

### 3.1 Dashboard (Home Page) -- `/`

The landing experience. Provides a high-level view of food recall activity in the US.

#### 3.1.1 Hero / Summary Stats

A top-of-page summary bar with key metrics.

| Stat | Definition | Display |
|------|------------|---------|
| **Active Recalls** | Total recalls with `status = "Ongoing"` reported in the last 30 days | Large number with label |
| **FDA Count** | Subset of active recalls where `source = "FDA"` | Smaller number with FDA badge |
| **USDA Count** | Subset of active recalls where `source = "USDA"` | Smaller number with USDA badge |
| **Top Reason** | Most common `reason_category` in the last 30 days | Text with icon |
| **Last Updated** | Timestamp of most recent ETL sync | Small text, e.g., "Updated Mar 3, 2026 at 6:00 AM EST" |

**Behavior:**
- Stats refresh on page load (served from pre-computed database queries, not live API calls).
- Stats should be server-rendered for SEO and performance.

#### 3.1.2 US Map Choropleth

An interactive map of the United States, color-coded by recall density.

| Requirement | Detail |
|-------------|--------|
| **Data** | Number of recalls where each state appears in `distribution_states` OR `nationwide = true` |
| **Color Scale** | Sequential scale (light to dark) representing low to high recall volume. Exact palette defined in design system. |
| **Interaction** | Hover: tooltip showing state name and recall count. Click: filters all dashboard data to that state. |
| **Time Range Toggle** | Segmented control with options: Last 30 days, 90 days, 12 months, All time. Default: 30 days. |
| **Nationwide** | Nationwide recalls count toward every state. |
| **States** | All 50 US states + DC + Puerto Rico + US territories if data exists. |
| **Library** | `react-simple-maps` (preferred for simplicity) or Leaflet. |

#### 3.1.3 Timeline Chart

A line or area chart showing recall volume over time.

| Requirement | Detail |
|-------------|--------|
| **X-axis** | Time (monthly buckets for 12-month view, weekly for 90-day) |
| **Y-axis** | Recall count |
| **Default View** | Last 12 months, monthly granularity |
| **Filters** | Product category (dropdown), severity class (checkbox: I, II, III) |
| **Interaction** | Hover: tooltip with exact count for that period. Click a data point: navigates to search results for that time period. |
| **Library** | Recharts |

#### 3.1.4 Product Category Breakdown

A horizontal bar chart showing recall count by normalized product category.

| Requirement | Detail |
|-------------|--------|
| **Data** | Count of recalls per `product_category` within the selected time range |
| **Sort** | Descending by count |
| **Interaction** | Click a bar: filters the Recent Recalls Feed (below) to that category |
| **Categories Shown** | All 14 normalized categories. Categories with zero recalls are hidden. |

#### 3.1.5 Severity Distribution

A visual breakdown of Class I / II / III recalls.

| Requirement | Detail |
|-------------|--------|
| **Visualization** | Donut chart or segmented horizontal bar |
| **Labels** | Class I = "Serious Health Risk" (red), Class II = "Remote Health Risk" (amber/yellow), Class III = "Not Likely Harmful" (blue/gray) |
| **Data** | Percentages and counts within the selected time range |
| **Interaction** | Click a segment: filters Recent Recalls Feed to that severity |

#### 3.1.6 Recent Recalls Feed

A scrollable, card-based list of the most recent recalls.

| Requirement | Detail |
|-------------|--------|
| **Default** | 20 most recent recalls, sorted by `report_date` descending |
| **Card Contents** | Product description (truncated to 2 lines), recalling firm, reason category badge, severity badge (color-coded), report date, source badge ("FDA" or "USDA") |
| **Interaction** | Click card: navigates to `/recall/[id]` detail page |
| **Pagination** | "Load more" button at bottom (loads next 20) |
| **Filtering** | Responds to state selection (map click), category selection (bar chart click), severity selection (donut click) |

### 3.2 Search -- `/search`

A dedicated search experience for answering "Is this product recalled?"

#### 3.2.1 Search Input

| Requirement | Detail |
|-------------|--------|
| **Input Type** | Single text input with placeholder: "Search products, brands, or companies..." |
| **Behavior** | Debounced search (300ms delay after last keystroke). Minimum 2 characters to trigger search. |
| **Implementation** | PostgreSQL full-text search across `product_description`, `recalling_firm`, and `reason` fields. Use `ts_vector` and `ts_query` with `plainto_tsquery` for natural-language input. |
| **URL State** | Search query and all filters are reflected in the URL query string (e.g., `/search?q=chicken&state=TX&severity=I`) for shareability and bookmarking. |

#### 3.2.2 Filters

All filters are applied additively (AND logic). Multiple selections within a single filter use OR logic.

| Filter | Type | Options |
|--------|------|---------|
| **State** | Type-ahead dropdown | All 50 states + DC + territories. Multiple selection allowed. Filters on `distribution_states` contains selected state OR `nationwide = true`. |
| **Product Category** | Multi-select checkboxes | All 14 normalized categories |
| **Severity Class** | Checkbox group | Class I ("Serious"), Class II ("Remote"), Class III ("Low Risk") |
| **Date Range** | Date picker (start/end) | Defaults to last 12 months. Filters on `report_date`. |
| **Source** | Toggle or checkbox | FDA, USDA, or both (default: both) |
| **Reason Category** | Multi-select dropdown | All 7 normalized reason categories |

#### 3.2.3 Results

| Requirement | Detail |
|-------------|--------|
| **Layout** | Card list, same format as Recent Recalls Feed |
| **Sort** | Default: newest first (`report_date` descending). Option to sort by severity. |
| **Result Count** | Display total matching results at top: "Showing X of Y results" |
| **Pagination** | 20 results per page. "Load more" or numbered pagination. |
| **Empty State** | Illustration + "No matching recalls found. Try adjusting your filters or search terms." |
| **Performance** | Results return in under 500ms |

### 3.3 Recall Detail Page -- `/recall/[id]`

Every recall gets a permanent, shareable URL.

#### 3.3.1 Page Layout

| Section | Content |
|---------|---------|
| **Header** | Product description (full text), severity badge (large, color-coded), source badge (FDA/USDA) |
| **AI Summary** | 2-3 sentence plain-English summary in a highlighted card. Format: what product, what's wrong with it, what you should do. Generated by Claude Opus 4.6 at ETL time. |
| **Details Table** | Key-value pairs: Recalling Firm, City/State, Recall Number, Classification (with plain-English label), Status, Report Date, Recall Initiation Date, Quantity Recalled |
| **Reason** | Original reason text from the source, preceded by the normalized reason category badge |
| **Distribution** | List of states as badges/chips. If `nationwide = true`, show "Nationwide" badge. Include a mini US map with affected states highlighted. |
| **Source Link** | Button: "View on [FDA/USDA] website" linking to the original source URL |
| **Related Recalls** | Horizontal scroll or grid of up to 6 related recalls. Matching logic: same `recalling_firm` OR same `product_category` + `reason_category`, sorted by date descending. |

#### 3.3.2 SEO Requirements

| Requirement | Detail |
|-------------|--------|
| **Title Tag** | `[Product Description] Recall - RecallPlate` |
| **Meta Description** | AI summary text (truncated to 160 characters) |
| **Open Graph** | Title, description, and a generated OG image showing product name, severity, and date |
| **Structured Data** | JSON-LD `GovernmentService` or `Article` schema for search engine indexing |

### 3.4 Alert System (V1 -- Email Capture Only) -- `/alerts`

V1 ships with email capture. No email delivery until V2.

#### 3.4.1 Signup Form

| Field | Type | Validation |
|-------|------|------------|
| **Email** | Text input | Required. Valid email format. |
| **State** | Dropdown | Required. All 50 states + DC. "All States" option available. |
| **Product Categories** | Multi-select checkboxes | Optional. Default: all categories. |

#### 3.4.2 Backend

| Requirement | Detail |
|-------------|--------|
| **Storage** | `AlertSubscriber` table in PostgreSQL |
| **Schema** | `id`, `email`, `state`, `categories` (string array), `created_at`, `verified` (boolean, default false) |
| **Duplicate Handling** | If email already exists, update preferences (upsert) |
| **Confirmation** | Display success message: "You're signed up! We'll notify you when new recalls match your preferences." No email verification in V1. |
| **Privacy** | Store emails securely. Do not share or sell. Display a brief privacy note on the form. |

#### 3.4.3 Alert Signup CTA (Embedded)

In addition to the dedicated `/alerts` page, display a compact CTA in:
- Dashboard sidebar or footer
- Recall detail page bottom
- Search results (when results > 0)

Format: "Get notified about recalls in your state" with email input and state dropdown inline.

### 3.5 Data Pipeline / ETL

The ETL pipeline is the backbone of RecallPlate. It runs on a schedule, pulls data from external APIs, normalizes it, enriches it with AI summaries, and writes it to the database.

#### 3.5.1 Data Sources

| Source | Endpoint | Coverage |
|--------|----------|----------|
| **openFDA Food Enforcement** | `https://api.fda.gov/food/enforcement.json` | FDA-regulated food products (non-meat, non-poultry, non-egg) |
| **USDA FSIS Recall API** | `https://www.fsis.usda.gov/api/recall-api` | Meat, poultry, and egg products |
| **openFDA Animal/Vet Enforcement** | `https://api.fda.gov/animalandveterinary/enforcement.json` | Pet food and animal feed recalls |

#### 3.5.2 Sync Schedule

| Phase | Frequency |
|-------|-----------|
| **V1 Launch** | Once daily at 6:00 AM EST |
| **V1.1** | Every 6 hours |

#### 3.5.3 ETL Pipeline Steps

```
1. FETCH     -- Pull latest records from all three API endpoints
2. DEDUPE    -- Check recall_number + source against existing database records
3. NORMALIZE -- Map raw fields to unified RecallEvent schema
4. CATEGORIZE -- Assign product_category and reason_category using rule-based matching
5. ENRICH    -- Generate ai_summary for new recalls via Claude Opus 4.6 (Anthropic API, batch mode)
6. UPSERT    -- Write new records, update changed records
7. LOG       -- Record sync status, record counts, and any parsing failures
```

#### 3.5.4 Categorization Rules

**Product Category Assignment:**
Use keyword matching against `product_description` to assign one of the 14 normalized categories. Rules are applied in priority order (first match wins). Examples:

| Keywords (case-insensitive) | Category |
|-----------------------------|----------|
| milk, cheese, yogurt, butter, cream, dairy, egg | Dairy & Eggs |
| beef, pork, chicken, turkey, meat, sausage, ham, bacon, poultry, lamb | Meat & Poultry |
| salmon, tuna, shrimp, fish, crab, lobster, seafood, oyster | Seafood & Fish |
| apple, banana, lettuce, spinach, tomato, fruit, vegetable, salad, berry | Fruits & Vegetables |
| bread, wheat, flour, cereal, rice, pasta, bakery, grain, oat | Grains & Bakery |
| chip, cookie, candy, chocolate, snack, cracker, popcorn | Snacks & Candy |
| juice, soda, water, tea, coffee, drink, beverage | Beverages |
| almond, peanut, cashew, walnut, nut, seed, pistachio | Nuts & Seeds |
| frozen, meal, dinner, pizza, entree, prepared, ready-to-eat | Prepared/Frozen Meals |
| sauce, dressing, ketchup, mustard, mayo, condiment, spice, seasoning | Condiments & Sauces |
| baby, infant, formula, toddler | Baby Food & Formula |
| supplement, vitamin, mineral, protein powder, dietary | Supplements & Vitamins |
| dog, cat, pet, animal, kibble, treat (pet) | Pet Food |
| _(no match)_ | Other |

**Reason Category Assignment:**
Use keyword matching against `reason_for_recall` / `reason`:

| Keywords (case-insensitive) | Category |
|-----------------------------|----------|
| salmonella, listeria, e. coli, botulism, bacteria, clostridium, campylobacter, norovirus, hepatitis | Bacterial Contamination |
| undeclared, allergen, allergy, milk, soy, wheat, peanut, tree nut, egg, shellfish, sesame (when in context of labeling) | Undeclared Allergens |
| metal, glass, plastic, wood, rubber, bone, foreign, object, material, fragment | Foreign Material |
| misbrand, mislabel, mispackag, incorrect label, wrong label, labeling | Misbranding/Mislabeling |
| chemical, pesticide, lead, mercury, arsenic, cadmium, toxin, mycotoxin, aflatoxin | Chemical Contamination |
| processing, undercooked, temperature, undercook, contamination during processing | Processing Defect |
| _(no match)_ | Other |

#### 3.5.5 AI Summary Generation

| Requirement | Detail |
|-------------|--------|
| **Model** | Claude Opus 4.6 (`claude-opus-4-6`) via Anthropic API |
| **Timing** | Batch at ETL time. Only generate for new recalls (not previously summarized). |
| **Prompt Template** | See below |
| **Output** | 2-3 sentences. Plain English. No jargon. Written for a parent. |
| **Fallback** | If API call fails, store `ai_summary = null`. Render detail page without summary section. Retry on next ETL run. |
| **Cost Control** | Use batch API mode. Estimated ~2-5 new recalls per day = negligible cost. |

**Prompt Template:**

```
You are writing a plain-English recall summary for a consumer-facing food safety website.
Given the following recall data, write a 2-3 sentence summary that a parent can read in
10 seconds. Explain: (1) what the product is, (2) what is wrong with it, and (3) what the
consumer should do. Do not use government jargon. Be clear and direct.

Product: {product_description}
Company: {recalling_firm}
Reason: {reason}
Classification: Class {classification}
Distribution: {distribution_states or "Nationwide"}
```

#### 3.5.6 State Normalization

Distribution state data from both APIs is often free-text (e.g., "Nationwide", "CA, TX, FL", "distributed in the states of California, Texas, and Florida"). The ETL must:

1. Parse free-text distribution fields.
2. Match state names (full and abbreviated) to standard two-letter abbreviations.
3. If "nationwide", "all states", "US wide", or similar is detected, set `nationwide = true` and populate `distribution_states` with all 50 states + DC.
4. Log unparseable distribution strings for manual review.

#### 3.5.7 Error Handling & Logging

| Scenario | Handling |
|----------|----------|
| API unreachable | Retry 3 times with exponential backoff. Log failure. Do not delete existing data. |
| Rate limit hit | Pause and retry after the rate limit window (60 seconds for openFDA). |
| Unparseable record | Log the raw record and skip. Do not halt the entire sync. |
| Duplicate recall number | Upsert (update existing record with new data if fields changed). |
| AI summary failure | Set `ai_summary = null`. Log. Retry on next sync. |
| Sync metadata | Store in a `SyncLog` table: `id`, `started_at`, `completed_at`, `source`, `records_fetched`, `records_upserted`, `errors`, `status` |

---

## 4. User Flows

### 4.1 Flow: Discovering a Recall from the Dashboard

```
User lands on RecallPlate.com (/)
  |
  v
Sees Dashboard: summary stats, US map, timeline, category chart, severity donut, recent feed
  |
  v
Notices severity donut shows spike in Class I recalls
  |
  v
Clicks "Class I" segment on severity donut
  |
  v
Recent Recalls Feed filters to show only Class I recalls
  |
  v
Scans card list, sees a recall for a product they purchased
  |
  v
Clicks the recall card
  |
  v
Recall Detail Page loads (/recall/[id])
  |
  v
Reads AI summary: "This [product] by [company] has been recalled due to [reason].
If you purchased this product in [states], do not eat it. Discard or return to the store."
  |
  v
Sees distribution map -- confirms their state is affected
  |
  v
Clicks "View on FDA website" for official source
  |
  v
Scrolls down, sees alert CTA: "Get notified about recalls in your state"
  |
  v
Enters email + selects state --> Subscriber created
```

### 4.2 Flow: Searching for a Specific Product

```
User navigates to /search (or uses search icon in header)
  |
  v
Types "peanut butter" into search input
  |
  v
Debounced search triggers after 300ms
  |
  v
Results appear: cards showing peanut butter recalls, newest first
  |
  v
User applies filter: State = "Texas", Severity = "Class I"
  |
  v
Results narrow. URL updates to /search?q=peanut+butter&state=TX&severity=I
  |
  v
User clicks a result card
  |
  v
Recall Detail Page loads with full information and AI summary
  |
  v
User copies the URL and sends it to a family member
```

### 4.3 Flow: Browsing by State

```
User lands on Dashboard (/)
  |
  v
Clicks their state (e.g., California) on the US map
  |
  v
All dashboard components filter to show only recalls affecting California:
  - Summary stats update to CA-only counts
  - Timeline shows CA recall trends
  - Category breakdown shows CA-specific categories
  - Recent Recalls Feed shows only recalls distributed to CA
  |
  v
User scrolls through Recent Recalls Feed
  |
  v
Clicks "Load more" to see additional results
  |
  v
Clicks a recall card of interest --> navigates to detail page
```

### 4.4 Flow: Signing Up for Alerts

```
User sees alert CTA (on Dashboard, detail page, or search results)
  |
  v
Clicks "Get notified" or navigates to /alerts
  |
  v
Alert signup form loads:
  - Email input
  - State dropdown (required)
  - Product category checkboxes (optional)
  |
  v
User enters email, selects "Florida", checks "Baby Food & Formula" and "Pet Food"
  |
  v
Submits form
  |
  v
Backend upserts subscriber record
  |
  v
Success message: "You're signed up! We'll notify you when new recalls match your preferences."
  |
  v
(V2: email verification + digest delivery activates)
```

### 4.5 Flow: Pet Owner Checking Pet Food Recalls

```
User navigates to /search
  |
  v
Types brand name of their dog food
  |
  v
Results show pet food recalls matching that brand
  |
  v
User applies filter: Product Category = "Pet Food"
  |
  v
Browses results, clicks a recall card
  |
  v
Detail page shows recall info with AI summary written in consumer-friendly language
  |
  v
User signs up for alerts with "Pet Food" category selected
```

---

## 5. Data Model & Schema

### 5.1 Core Entity: `RecallEvent`

This is the unified schema that all data sources normalize into.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | No | Internal unique ID, generated at upsert time |
| `source` | `enum ("FDA", "USDA")` | No | Origin agency. Pet food records from openFDA animal/vet endpoint use `source = "FDA"`. |
| `recall_number` | `string` | No | Original recall number from the source agency |
| `classification` | `enum ("I", "II", "III")` | No | Severity class |
| `status` | `string` | No | "Ongoing", "Completed", or "Terminated" |
| `product_description` | `text` | No | Full product description from the source |
| `product_category` | `string` | No | One of 14 normalized categories (see section 3.5.4) |
| `reason` | `text` | No | Original reason for recall from the source |
| `reason_category` | `string` | No | One of 7 normalized reason categories (see section 3.5.4) |
| `recalling_firm` | `string` | No | Company name |
| `distribution_states` | `string[]` | No | Array of two-letter state abbreviations |
| `nationwide` | `boolean` | No | True if distributed nationwide. Default: false. |
| `report_date` | `date` | No | When the recall was reported/published |
| `recall_initiation_date` | `date` | Yes | When the recall was initiated by the firm |
| `city` | `string` | Yes | Recalling firm city |
| `state` | `string` | Yes | Recalling firm state (two-letter abbreviation) |
| `quantity` | `string` | Yes | Amount recalled (free-text: "5,000 lbs", "12,000 units") |
| `url` | `string` | Yes | Link to original source on FDA/USDA website |
| `ai_summary` | `text` | Yes | Plain-English summary generated by Claude. Null if generation failed. |
| `created_at` | `timestamp` | No | When the record was first inserted |
| `updated_at` | `timestamp` | No | When the record was last updated |

**Unique Constraint:** `(source, recall_number)` -- prevents duplicates across syncs.

**Indexes:**
- `report_date` (for sorting and date range queries)
- `product_category` (for category filtering)
- `reason_category` (for reason filtering)
- `classification` (for severity filtering)
- `source` (for source filtering)
- `distribution_states` (GIN index for array containment queries)
- Full-text search index on `product_description`, `recalling_firm`, `reason`

### 5.2 Entity: `AlertSubscriber`

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | No | Unique subscriber ID |
| `email` | `string` | No | Subscriber email address |
| `state` | `string` | No | Two-letter state abbreviation or "ALL" |
| `categories` | `string[]` | No | Array of product category strings. Empty array = all categories. |
| `verified` | `boolean` | No | Default: false. For future email verification. |
| `created_at` | `timestamp` | No | Signup timestamp |
| `updated_at` | `timestamp` | No | Last preference update |

**Unique Constraint:** `email` -- upsert behavior on duplicate.

### 5.3 Entity: `SyncLog`

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | No | Unique log entry ID |
| `source` | `string` | No | "FDA_FOOD", "FDA_ANIMAL", or "USDA" |
| `started_at` | `timestamp` | No | When the sync started |
| `completed_at` | `timestamp` | Yes | When the sync finished (null if still running or failed) |
| `records_fetched` | `integer` | No | Total records pulled from the API |
| `records_upserted` | `integer` | No | Records written to database (new + updated) |
| `records_skipped` | `integer` | No | Records skipped (duplicates with no changes) |
| `errors` | `integer` | No | Count of records that failed to parse |
| `error_details` | `jsonb` | Yes | Array of error objects with record identifiers and error messages |
| `status` | `string` | No | "running", "completed", "failed" |

### 5.4 Normalized Categories Reference

**Product Categories (14):**
1. Dairy & Eggs
2. Meat & Poultry
3. Seafood & Fish
4. Fruits & Vegetables
5. Grains & Bakery
6. Snacks & Candy
7. Beverages
8. Nuts & Seeds
9. Prepared/Frozen Meals
10. Condiments & Sauces
11. Baby Food & Formula
12. Supplements & Vitamins
13. Pet Food
14. Other

**Reason Categories (7):**
1. Bacterial Contamination
2. Undeclared Allergens
3. Foreign Material
4. Misbranding/Mislabeling
5. Chemical Contamination
6. Processing Defect
7. Other

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js (App Router) | Server components for performance and SEO. API routes for backend. Industry standard. |
| **Language** | TypeScript | Type safety across the full stack. Catches schema drift early. |
| **Database** | PostgreSQL (via Supabase, Neon, or Railway) | Mature, reliable. Excellent full-text search. Array column support for `distribution_states`. GIN indexes. |
| **ORM** | Prisma or Drizzle | Type-safe database access. Schema migrations. Prisma preferred for its mature ecosystem. |
| **Hosting** | Vercel | Native Next.js support. Edge functions. Global CDN. Simple deployment. |
| **Styling** | Tailwind CSS | Utility-first, fast development, consistent design system. |
| **Charts** | Recharts | React-native charting. Simple API. Good defaults. Sufficient for V1. |
| **Map** | react-simple-maps | Lightweight US choropleth. No Mapbox/Google Maps dependency. No API key needed. |
| **AI** | Anthropic API (Claude Opus 4.6) | AI summary generation at ETL time. Batch processing. |
| **Search** | PostgreSQL full-text search | No external dependency for V1. Upgrade to Algolia if needed in V2. |
| **Cron/Scheduling** | Vercel Cron Jobs or GitHub Actions | Trigger daily ETL sync. |

### 6.2 Architecture Diagram

```
+------------------+      +------------------+      +------------------+
|   openFDA Food   |      |    USDA FSIS     |      |  openFDA Animal  |
|   Enforcement    |      |   Recall API     |      |  /Vet Enforce.   |
+--------+---------+      +--------+---------+      +--------+---------+
         |                          |                          |
         +------------+-------------+--------------------------+
                      |
                      v
         +---------------------------+
         |      ETL Pipeline         |
         |  (Serverless Function /   |
         |   Vercel Cron Job)        |
         |                           |
         |  1. Fetch from APIs       |
         |  2. Deduplicate           |
         |  3. Normalize schema      |
         |  4. Categorize            |
         |  5. Generate AI summaries |
         |  6. Upsert to DB          |
         |  7. Log sync status       |
         +-------------+-------------+
                       |
                       v
         +---------------------------+
         |     PostgreSQL Database   |
         |  (Supabase / Neon)        |
         |                           |
         |  - recall_events          |
         |  - alert_subscribers      |
         |  - sync_logs              |
         +-------------+-------------+
                       |
                       v
         +---------------------------+
         |     Next.js Application   |
         |  (Vercel)                 |
         |                           |
         |  API Routes:              |
         |  - /api/recalls           |
         |  - /api/recalls/[id]      |
         |  - /api/recalls/search    |
         |  - /api/recalls/stats     |
         |  - /api/subscribers       |
         |                           |
         |  Pages (App Router):      |
         |  - / (Dashboard)          |
         |  - /search                |
         |  - /recall/[id]           |
         |  - /alerts                |
         +---------------------------+
                       |
                       v
              +----------------+
              |    Vercel CDN  |
              |  (Global Edge) |
              +----------------+
```

### 6.3 API Routes

All API routes are Next.js Route Handlers under `/app/api/`.

#### `GET /api/recalls`

List recalls with pagination and filtering.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page (max 100) |
| `state` | string | -- | Filter by state abbreviation (checks `distribution_states` contains) |
| `category` | string | -- | Filter by `product_category` |
| `severity` | string | -- | Filter by `classification` ("I", "II", "III") |
| `source` | string | -- | Filter by `source` ("FDA", "USDA") |
| `reason` | string | -- | Filter by `reason_category` |
| `start_date` | string (ISO date) | -- | Filter `report_date >= start_date` |
| `end_date` | string (ISO date) | -- | Filter `report_date <= end_date` |
| `sort` | string | "report_date" | Sort field |
| `order` | string | "desc" | Sort direction ("asc" or "desc") |

**Response:**
```json
{
  "data": [RecallEvent],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1234,
    "total_pages": 62
  }
}
```

#### `GET /api/recalls/[id]`

Get a single recall by ID.

**Response:** Full `RecallEvent` object with all fields including `ai_summary`.

#### `GET /api/recalls/search`

Full-text search with filters.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | -- | Search query (required, min 2 characters) |
| All filters from `/api/recalls` | -- | -- | Same filtering options |

**Response:** Same format as `/api/recalls` with results ranked by relevance.

#### `GET /api/recalls/stats`

Aggregated statistics for the dashboard.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | string | -- | Filter stats to a specific state |
| `days` | integer | 30 | Time window (30, 90, 365, or 0 for all time) |

**Response:**
```json
{
  "total_active": 47,
  "by_source": { "FDA": 32, "USDA": 15 },
  "by_severity": { "I": 12, "II": 28, "III": 7 },
  "by_category": { "Dairy & Eggs": 8, "Meat & Poultry": 12, ... },
  "by_reason": { "Bacterial Contamination": 15, ... },
  "by_state": { "CA": 34, "TX": 28, ... },
  "top_reason": "Bacterial Contamination",
  "timeline": [
    { "period": "2026-02", "count": 23 },
    { "period": "2026-01", "count": 31 },
    ...
  ],
  "last_updated": "2026-03-03T06:00:00Z"
}
```

#### `POST /api/subscribers`

Create or update an alert subscriber.

**Request Body:**
```json
{
  "email": "parent@example.com",
  "state": "FL",
  "categories": ["Baby Food & Formula", "Pet Food"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully."
}
```

**Validation:**
- `email`: Required, valid email format
- `state`: Required, valid US state abbreviation or "ALL"
- `categories`: Optional, array of valid product category strings

### 6.4 Data Pipeline Implementation

The ETL pipeline runs as either:
- **Option A:** Vercel Cron Job (configured in `vercel.json`) triggering an API route `/api/cron/sync`
- **Option B:** GitHub Actions workflow on a cron schedule, calling a serverless function

**openFDA Pagination:**
- openFDA returns max 1000 results per request via `limit` and `skip` parameters.
- The ETL must paginate through all results. Use `skip=0&limit=1000`, then `skip=1000&limit=1000`, etc., until fewer than 1000 results are returned.
- Apply date filter to only fetch recalls since the last successful sync: `report_date:[LAST_SYNC_DATE+TO+NOW]`.

**USDA FSIS Handling:**
- The USDA API is less structured. If the API is unavailable or returns inconsistent data, fall back to scraping the FSIS recalls page.
- Distribution state data often appears as free-text strings. The ETL must include a robust state-parsing function.

**Rate Limiting:**
- openFDA: 240 requests/minute with API key. Implement request throttling with a 250ms delay between requests.
- USDA: Monitor for rate limits. Implement exponential backoff.

---

## 7. Design Principles

> **Full design system specification:** See `docs/design-system.md` for the complete Folder-Tab Explorer → Data Table design skill with color tokens, typography, motion specs, and implementation notes.

### 7.1 Core UX Principles

| Principle | Description |
|-----------|-------------|
| **Trustworthy** | The app must feel like a public health tool, not a startup product. No dark patterns, no growth hacks. Transparent sourcing. |
| **Scannable** | Users should be able to assess their risk within 10 seconds of landing on any page. Severity badges, color coding, and AI summaries enable this. |
| **Information-Dense Without Clutter** | Pack data into the dashboard without overwhelming. Use hierarchy, whitespace, and progressive disclosure. |
| **Mobile-First** | Design for phone screens first. Most users will arrive via a link from social media or a news article on their phone. |
| **Accessible** | WCAG AA compliance minimum. All color-coded information must also have text labels. Charts must have data tables as alternatives. All interactive elements must be keyboard-navigable. |
| **Fast** | Perceived performance matters. Server-render the dashboard. Skeleton loading states for async content. No spinners lasting more than 1 second for primary content. |
| **Tactile & Physical** | The folder-tab metaphor brings a physical, archival quality to data exploration. Hover lifts, parallax scrolls, and the signature folder-open animation make browsing feel tangible. |

### 7.2 Visual Design Direction — Folder-Tab Explorer Pattern

RecallPlate uses a **two-phase UI pattern**: a folder explorer landing view that transitions into structured data tables on drill-down.

#### Phase 1: Folder Explorer (Landing/Dashboard)

The landing experience presents recall categories as **stacked, overlapping folder tabs** against a dark canvas (`#111215`). Each folder represents a product category or recall grouping (e.g., "Dairy & Eggs," "Meat & Poultry," "Pet Food"). The physical manila-folder silhouette uses rounded top edges and notched tab handles, with metadata peeking through between tabs (recall count, date range, severity indicators).

**Folder Colors** — each category gets a distinct, saturated color:

| Token | Hex | RecallPlate Usage |
|---|---|---|
| `--folder-red` | `#E63B2E` | Class I severity / Bacterial Contamination |
| `--folder-blue` | `#2B5CE6` | Seafood & Fish / FDA source |
| `--folder-teal` | `#0E8A7D` | Fruits & Vegetables |
| `--folder-orange` | `#F28C28` | Meat & Poultry / USDA source |
| `--folder-pink` | `#D94F8A` | Baby Food & Formula |
| `--folder-purple` | `#7B3FA0` | Supplements & Vitamins |
| `--folder-yellow` | `#E6C820` | Snacks & Candy / Grains & Bakery |
| `--folder-black` | `#1A1A1E` | Class I urgent / VIP alerts |

**Folder surface details:** Tab label (category name in serif font), preview row (recall count + most recent recall in monospace), subtle paper grain texture at 3-5% opacity.

**Interactions:** Hover lifts folder (translateY -4px, shadow increase, 10% brighten). Click triggers Phase 2 transition.

#### Phase 2: Data Table (Recall List/Detail)

Clicking a folder triggers the **signature transition** (400-600ms): the folder lifts, rotates in 3D perspective (rotateX -5deg), and unfolds flat to become the data table container. Background shifts from dark (`#111215`) to light (`#F5F5F3`). The folder's color persists as accent throughout the table view.

The data table phase includes:
- **Summary cards** row: 3-5 metric cards (active recalls, severity breakdown, trend sparklines)
- **Column headers**: Uppercase, 11-12px, letterspaced, muted (`#888`)
- **Table rows**: 56-64px height, bottom border separation, hover tint `#FAFAF8`
- **Severity badges**: Color-coded pills — Class I: `#FFEBEE`/`#C62828` (red), Class II: `#FFF3E0`/`#E65100` (orange), Class III: `#E3F2FD`/`#1565C0` (blue)
- **Source tags**: Pill-shaped — FDA (blue tint), USDA (warm tint)
- **Bulk action bar**: Floating dark bar at viewport bottom when rows selected

**Reverse transition:** Breadcrumb "back to folders" plays the animation in reverse — table shrinks, regains 3D tilt, settles back into the folder stack.

### 7.3 Typography

Two-font pairing bridging the archival folder aesthetic with clean table UI:

| Role | Font | Weight | Size |
|---|---|---|---|
| Folder tab labels | Serif display (Instrument Serif, Playfair Display, or EB Garamond) | Regular or Italic | 18–22px |
| Page titles | Same serif display | Regular | 28–36px |
| Preview metadata (between folders) | Monospace (DM Mono, JetBrains Mono, or IBM Plex Mono) | Regular | 12–13px |
| Table headers | Sans-serif (DM Sans, Satoshi, or General Sans) | Medium | 11–12px, uppercase |
| Table body text | Same sans-serif | Regular | 14–15px |
| Secondary / muted text | Same sans-serif | Regular | 12–13px |
| KPI values | Same sans-serif | Semibold | 24–28px |

### 7.4 Color & Theme

| Token | Hex | Usage |
|---|---|---|
| `--canvas-dark` | `#111215` | Phase 1 (Explorer) background |
| `--page-bg` | `#F5F5F3` | Phase 2 (Table) page background |
| `--surface` | `#FFFFFF` | Card and table backgrounds |
| `--text-primary` | `#1A1A1E` | Body text in table |
| `--text-secondary` | `#6B7280` | Muted labels, emails, dates |
| `--text-on-dark` | `#FFFFFF` | Text on folder surfaces |
| `--border` | `#E5E5E5` | Table row dividers, card borders |
| `--success` | `#16A34A` | Positive trends, resolved status |
| `--warning` | `#F59E0B` | Class II severity, amber indicators |
| `--danger` | `#DC2626` | Class I severity, negative trends |

### 7.5 Motion & Animation

| Context | Behavior | Timing |
|---|---|---|
| **Folder hover** | translateY -4px, shadow increase, 10% brighten | 150ms ease-out |
| **Folder open** | Lift → 3D rotate → expand to fill → settle flat | 400-600ms `cubic-bezier(0.22, 1, 0.36, 1)` |
| **Table hover states** | Background tint on row | 150ms ease-out |
| **Bulk action bar** | Slide up from bottom | 200ms ease-out |
| **Sort arrow** | Rotation | 100ms ease-out |
| **Reduced motion** | All animations disabled, instant state changes | Respect `prefers-reduced-motion` |

### 7.6 Responsive Breakpoints

| Breakpoint | Width | Layout Adjustments |
|------------|-------|-------------------|
| **Mobile** | < 768px | Folder tabs compress vertically, tab handles stack with less horizontal offset, preview metadata collapses to count badge. Table single column. |
| **Tablet** | 768px - 1024px | Two-column grid for summary cards. Side-by-side filters and results on search. |
| **Desktop** | > 1024px | Full folder stack with horizontal offset variety. Full dashboard grid. Sidebar filters on search. |

### 7.7 Accessibility Requirements

| Requirement | Standard |
|-------------|----------|
| **Color Contrast** | All text meets WCAG AA (4.5:1 normal text, 3:1 large text and icons) |
| **Color Independence** | Severity and category info never conveyed by color alone. Always paired with text labels. Status badges use icon or pattern for colorblind users. |
| **Keyboard Navigation** | Folder tabs navigable with arrow keys, Enter/Space to open. Table rows support Space for checkbox, Shift+arrow for range. All interactive elements focusable. |
| **Focus Indicators** | 2px offset focus rings using the folder accent color |
| **Screen Reader** | Charts have `aria-label` and alt data tables. Map has state-by-state text summary. Bulk action bar announced when it appears. |
| **Reduced Motion** | Respect `prefers-reduced-motion`. Disable folder transition, chart animations, parallax. |
| **Semantic HTML** | Proper heading hierarchy, landmark regions, form labels |

### 7.8 Iconography

Consistent line-icon set: **Lucide** (preferred) or Phosphor. 20px default, 1.5px stroke.

Key icons: search (magnifying glass), add (plus-circle), external link (arrow-northeast), sort (chevron up/down), checkbox (square/checked-square), list view, board view, filter/funnel, more options (three-dots), download, trash, severity indicators, FDA/USDA source badges.

---

## 8. Acceptance Criteria

### 8.1 Dashboard

| ID | Criteria |
|----|----------|
| D-1 | Given a user navigates to `/`, the dashboard loads with all components (stats, map, timeline, categories, severity, recent feed) within 2 seconds |
| D-2 | Given recalls exist in the database, summary stats display correct counts for the last 30 days |
| D-3 | Given the user hovers over a state on the map, a tooltip displays the state name and recall count |
| D-4 | Given the user clicks a state on the map, all dashboard components filter to show only recalls affecting that state |
| D-5 | Given the user selects a different time range (30d, 90d, 12mo, all), the map and all charts update accordingly |
| D-6 | Given the user clicks a product category bar, the Recent Recalls Feed filters to that category |
| D-7 | Given the user clicks a severity segment, the Recent Recalls Feed filters to that severity class |
| D-8 | Given the Recent Recalls Feed is showing results, each card displays: product description, firm, reason badge, severity badge, date, source badge |
| D-9 | Given the user clicks a recall card in the feed, they navigate to `/recall/[id]` |
| D-10 | Given more than 20 recalls match the current filters, a "Load more" button appears and loads the next 20 |
| D-11 | Given no recalls match the current filter combination, a meaningful empty state is displayed |

### 8.2 Search

| ID | Criteria |
|----|----------|
| S-1 | Given the user navigates to `/search`, the search input is focused and ready for typing |
| S-2 | Given the user types at least 2 characters and pauses for 300ms, search results appear |
| S-3 | Given search results are displayed, each result card matches the format of the Recent Recalls Feed cards |
| S-4 | Given the user applies a state filter, only recalls distributed to that state (or nationwide) are shown |
| S-5 | Given the user applies multiple filters (e.g., state + category + severity), all filters apply with AND logic |
| S-6 | Given the user selects multiple values within a single filter (e.g., two categories), those values apply with OR logic |
| S-7 | Given search query and filters are applied, the URL query string updates to reflect the current state |
| S-8 | Given a user loads a URL with query parameters (e.g., `/search?q=chicken&state=TX`), the search executes with those parameters pre-filled |
| S-9 | Given no results match the query and filters, an empty state message is displayed with guidance |
| S-10 | Given results are returned, the total count is displayed (e.g., "Showing 20 of 147 results") |
| S-11 | Given the search is executed, results return within 500ms |

### 8.3 Recall Detail Page

| ID | Criteria |
|----|----------|
| R-1 | Given a valid recall ID, the page at `/recall/[id]` loads with full recall details |
| R-2 | Given the recall has an AI summary, it is displayed in a highlighted card at the top of the page |
| R-3 | Given the recall has `ai_summary = null`, the summary section is hidden (no error, no empty card) |
| R-4 | Given the recall affects specific states, those states are displayed as badges and highlighted on a mini US map |
| R-5 | Given the recall is nationwide, a "Nationwide" badge is displayed and all states are highlighted on the map |
| R-6 | Given the recall has a source URL, a "View on [FDA/USDA] website" button links to the original source |
| R-7 | Given related recalls exist (same firm or same category + reason), up to 6 are displayed in a "Related Recalls" section |
| R-8 | Given an invalid recall ID, a 404 page is displayed |
| R-9 | Given the page is loaded, the `<title>` tag includes the product description and "RecallPlate" |
| R-10 | Given the page is shared on social media, Open Graph metadata renders a preview with product name, severity, and date |

### 8.4 Alert System

| ID | Criteria |
|----|----------|
| A-1 | Given the user navigates to `/alerts`, a signup form is displayed with email, state dropdown, and category checkboxes |
| A-2 | Given the user submits a valid email and state, a subscriber record is created in the database |
| A-3 | Given the user submits an email that already exists, the existing record is updated (upsert) |
| A-4 | Given the user submits an invalid email, a validation error is displayed |
| A-5 | Given successful submission, a success message is displayed |
| A-6 | Given the alert CTA is embedded on the dashboard, detail page, and search results, each CTA functions correctly |

### 8.5 Data Pipeline

| ID | Criteria |
|----|----------|
| E-1 | Given the ETL runs, it fetches records from all three API endpoints (FDA food, FDA animal/vet, USDA FSIS) |
| E-2 | Given new recalls are fetched, each is normalized into the `RecallEvent` schema with all required fields populated |
| E-3 | Given a recall's `product_description` matches keyword rules, the correct `product_category` is assigned |
| E-4 | Given a recall's `reason` matches keyword rules, the correct `reason_category` is assigned |
| E-5 | Given a new recall is upserted, an AI summary is generated via Claude Opus 4.6 and stored |
| E-6 | Given the AI summary API call fails, `ai_summary` is set to null and the record is still saved |
| E-7 | Given a recall already exists in the database (same source + recall_number), it is updated (not duplicated) |
| E-8 | Given distribution state text contains full state names, they are correctly parsed to two-letter abbreviations |
| E-9 | Given distribution text indicates "Nationwide", `nationwide` is set to true and `distribution_states` is populated with all states |
| E-10 | Given an API is unreachable, the ETL retries 3 times, logs the failure, and does not delete existing data |
| E-11 | Given the ETL completes, a `SyncLog` record is created with accurate counts and status |
| E-12 | Given the ETL is scheduled, it runs at least once every 24 hours |

---

## 9. Success Metrics

### 9.1 V1 Launch KPIs

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| **Dashboard Load Time** | < 2 seconds (P95) | Vercel Analytics / Lighthouse |
| **Search Response Time** | < 500ms (P95) | Server-side timing logs |
| **Data Freshness** | Recalls appear within 24 hours of government publication | Compare `report_date` of newest record to current date |
| **Email Capture Conversion** | > 5% of unique visitors submit an email | Subscriber count / unique visitor count |
| **Mobile Lighthouse Score** | > 90 (Performance, Accessibility, Best Practices) | Lighthouse CI in deployment pipeline |
| **Uptime** | > 99.5% | Vercel / uptime monitoring service |
| **ETL Success Rate** | > 95% of syncs complete without errors | `SyncLog` status = "completed" / total syncs |
| **Data Completeness** | > 95% of recalls have all required fields populated (non-null) | Database query on required fields |
| **AI Summary Coverage** | > 90% of recalls have a non-null `ai_summary` | Database query |

### 9.2 Engagement Metrics (Post-Launch Tracking)

| Metric | Description |
|--------|-------------|
| **Daily Active Users** | Unique visitors per day |
| **Search Usage Rate** | % of sessions that include a search |
| **Recall Detail Page Views** | Average detail pages viewed per session |
| **Map Interaction Rate** | % of sessions that include a map click |
| **Filter Usage** | Most commonly used filters (state, category, severity) |
| **Bounce Rate** | % of sessions with only one page view |
| **Avg. Session Duration** | Time spent on site per session |
| **Return Visitor Rate** | % of visitors who return within 30 days |
| **Alert Signup Funnel** | CTA impression -> form view -> submission |

### 9.3 Data Quality Metrics

| Metric | Target |
|--------|--------|
| **Categorization Accuracy** | > 90% of recalls assigned to the correct product category (spot-check 50 records per month) |
| **State Parsing Accuracy** | > 95% of distribution state fields correctly parsed (check `error_details` in SyncLog) |
| **AI Summary Quality** | Spot-check 20 summaries per month for accuracy, readability, and appropriate tone |

---

## 10. Phase Roadmap

### Phase 1 (V1) -- "Ship It"

**Goal:** Deliver a functional, well-designed product that combines FDA + USDA recall data into a single dashboard with search, detail pages, and alert capture.

**Scope:**
- Combined FDA food + USDA FSIS + FDA animal/vet data pipeline with daily sync
- Dashboard: summary stats, US map choropleth, timeline chart, category breakdown, severity distribution, recent recalls feed
- Search: full-text search with filters (state, category, severity, date range, source, reason)
- Recall detail pages with AI summaries, distribution map, related recalls
- Email capture for alerts (signup form only, no delivery)
- Responsive web application deployed on Vercel
- Brand identity and design system applied
- PostgreSQL database with full-text search
- SEO: meta tags, Open Graph, structured data on detail pages

**Timeline Target:** 4-6 weeks from development start

---

### Phase 2 -- "Engage"

**Goal:** Activate the subscriber base, add personalization, and expand distribution.

**Features:**
- Email alert delivery: daily or weekly digest by state/category preferences
- Email verification flow for subscribers
- Personalized watchlist: "My State" + "My Categories" saved per user
- Embeddable widget for news sites and blogs (iframe or script embed)
- Social sharing: shareable state-level recall scorecards with OG images
- SEO-optimized category landing pages (e.g., `/category/dairy-eggs`) and state landing pages (e.g., `/state/california`)
- RSS feed for recalls (filterable by state/category)
- Algolia integration for faster, typo-tolerant search (if PostgreSQL search proves insufficient)
- Improved ETL frequency (every 6 hours)
- User accounts (optional, for managing alert preferences)

**Timeline Target:** V1 + 6-8 weeks

---

### Phase 3 -- "Expand"

**Goal:** Expand functionality, data sources, and audience.

**Features:**
- UPC/barcode scanner: mobile camera input to check if a specific product is recalled
- CDC outbreak tracking integration (FoodNet / NORS data)
- Historical trend analysis and annual "State of Food Safety" reports
- Public API for developers (rate-limited, free tier)
- Enhanced pet food recall section with breed-specific relevance
- Integration with grocery loyalty card APIs (long-term exploration)
- Advanced analytics: company recall history pages, category deep-dives
- Internationalization groundwork (structure for future non-US markets)

**Timeline Target:** V2 + 3-6 months

---

## 11. Open Questions & Risks

### 11.1 Open Questions

| ID | Question | Impact | Owner |
|----|----------|--------|-------|
| Q-1 | Is `recallplate.com` available? What about `.org`? | Brand/launch | Product |
| Q-2 | Should the map default to the user's state via browser geolocation? | UX for first-time visitors. Privacy implications. Adds complexity. Could default to "All States" with a prompt to select. | Product/Design |
| Q-3 | What is the exact prompt and model configuration for AI summaries? Current plan: Claude Opus 4.6 (`claude-opus-4-6`). Need to finalize the system prompt and test output quality. | AI summary quality | Engineering |
| Q-4 | How do we handle USDA FSIS API instability? The API has historically been unreliable. Do we build a scraper as backup from day one, or treat it as a known risk? | Data completeness for meat/poultry | Engineering |
| Q-5 | What is the expected database size after initial backfill? openFDA has data from 2004. Do we backfill all history or start from a recent date (e.g., last 2 years)? | ETL complexity, storage costs, initial load time | Engineering |
| Q-6 | How do we handle recalls that span both FDA and USDA jurisdictions (rare, but possible)? | Data deduplication | Engineering |
| Q-7 | Should V1 include a "About / How This Works" page explaining data sources, update frequency, and limitations? | User trust | Product |

### 11.2 Technical Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **USDA FSIS API is unreliable or changes format** | High | Medium | Build scraper as fallback. Monitor API health. Abstract data fetching behind an interface so sources can be swapped. |
| **Distribution state parsing fails on edge cases** | Medium | High | Build comprehensive test suite with real-world examples. Log all unparseable strings. Manual review queue. |
| **openFDA rate limiting during backfill** | Medium | Medium | Implement request throttling (250ms delay). Use date-range pagination. Run backfill during off-peak hours. |
| **AI summary generation costs escalate** | Low | Low | ~2-5 new recalls/day. At Claude Opus 4.6 pricing, cost is negligible. Monitor via Anthropic dashboard. Batch API mode reduces costs further. |
| **Product categorization accuracy is low** | Medium | Medium | Start with keyword rules. Log uncategorized items. Plan for ML-based categorization in V2 if rule accuracy is below 85%. |
| **Database size grows faster than expected** | Low | Low | PostgreSQL handles millions of rows easily. Partition by year if needed. Monitor query performance. |
| **Vercel cold start latency for API routes** | Medium | Low | Use Edge Runtime where possible. Implement ISR (Incremental Static Regeneration) for dashboard stats. |

### 11.3 Data Quality Concerns

| Concern | Description | Mitigation |
|---------|-------------|------------|
| **Inconsistent product descriptions** | FDA and USDA describe similar products differently. A "chicken nugget" recall might be described in wildly different ways. | Categorization rules must be broad. Log "Other" categorizations for review. |
| **Missing distribution states** | Some recalls do not specify distribution states, or use vague language like "various states." | If states cannot be parsed, set `distribution_states = []` and `nationwide = false`. Display as "Distribution unknown" on the UI. |
| **Stale recall status** | Recall status may change (e.g., "Ongoing" to "Completed") but APIs may not update promptly. | Full re-sync of recent recalls (last 90 days) on each ETL run, not just new records. |
| **Duplicate recalls across sources** | A product recall could theoretically appear in both FDA and USDA data. | Deduplicate on `recall_number` + `source`. Accept that some products may have separate but related recalls in each system. |

---

## 12. Decisions Log

This section records key product and technical decisions that have been finalized.

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| DEC-1 | **US-only data. No Canadian recalls.** | Keeps V1 scope manageable. Canadian recall data (CFIA) has a different structure and would require a separate normalization pipeline. Can revisit in V3+. | 2026-03-03 |
| DEC-2 | **Include pet food recalls in V1.** | Pet food recalls use the same openFDA API structure (animal/veterinary enforcement endpoint) and normalize into the same schema. Minimal additional engineering effort. Pet owners are a significant audience. Add "Pet Food" as a product category. | 2026-03-03 |
| DEC-3 | **Generate AI summaries at ETL time, not on-the-fly.** | On-the-fly generation would add latency to page loads and create unpredictable API costs. ETL-time generation is batch-friendly, allows quality review, and keeps page loads instant. | 2026-03-03 |
| DEC-4 | **Use Claude Opus 4.6 (`claude-opus-4-6`) for AI summaries.** | High-quality output for consumer-facing text. Anthropic API is reliable and cost-effective at the expected volume (2-5 recalls/day). | 2026-03-03 |
| DEC-5 | **PostgreSQL full-text search for V1 (not Algolia).** | Avoids external dependency and cost. PostgreSQL's `tsvector`/`tsquery` with GIN indexes is sufficient for the expected data volume (tens of thousands of records). Upgrade to Algolia in V2 if search quality or speed is insufficient. | 2026-03-03 |
| DEC-6 | **Pre-cached data with scheduled refresh (not real-time API proxying).** | Both source APIs are rate-limited and slow. Pre-caching gives instant page loads, enables data enrichment (AI summaries, categorization), and removes runtime dependency on government API availability. | 2026-03-03 |
| DEC-7 | **V1 alert system is email capture only (no delivery).** | Building a full email delivery system (templates, sending infrastructure, unsubscribe, bounce handling) would delay V1 significantly. Capturing subscribers early builds the list for V2 activation. | 2026-03-03 |
| DEC-8 | **App Router (not Pages Router) for Next.js.** | App Router is the current standard for Next.js. Server Components provide better performance and SEO. Route Handlers replace API routes cleanly. | 2026-03-03 |
| DEC-9 | **Daily ETL sync for V1, with 6-hour sync planned for V1.1.** | Daily is sufficient for launch since government agencies typically publish recalls during business hours. 6-hour sync improves freshness without significant infrastructure changes. | 2026-03-03 |
| DEC-10 | **Three data sources in V1: openFDA food, openFDA animal/vet, USDA FSIS.** | Covers the full spectrum of FDA-regulated and USDA-regulated food products, plus pet food. Three sources into one unified schema is the core value proposition. | 2026-03-03 |

---

## Appendix A: Source API Field Mapping

### openFDA Food Enforcement -> RecallEvent

| openFDA Field | RecallEvent Field | Transform |
|---------------|-------------------|-----------|
| `recall_number` | `recall_number` | Direct |
| `classification` | `classification` | Extract Roman numeral: "Class I" -> "I" |
| `status` | `status` | Direct |
| `product_description` | `product_description` | Direct |
| -- | `product_category` | Keyword categorization |
| `reason_for_recall` | `reason` | Direct |
| -- | `reason_category` | Keyword categorization |
| `recalling_firm` | `recalling_firm` | Direct |
| `distribution_pattern` | `distribution_states`, `nationwide` | Parse free text to state array |
| `report_date` | `report_date` | Parse date string |
| `recall_initiation_date` | `recall_initiation_date` | Parse date string |
| `city` | `city` | Direct |
| `state` | `state` | Direct |
| `product_quantity` | `quantity` | Direct |
| (constructed) | `url` | Build URL from recall_number |
| -- | `source` | "FDA" (hardcoded) |

### openFDA Animal/Vet Enforcement -> RecallEvent

Same mapping as FDA Food Enforcement above, with:
- `source` = "FDA"
- Categorization rules should route to `product_category = "Pet Food"` for this endpoint

### USDA FSIS -> RecallEvent

| USDA Field | RecallEvent Field | Transform |
|------------|-------------------|-----------|
| Recall number | `recall_number` | Direct |
| Classification | `classification` | Extract Roman numeral |
| Current status | `status` | Map to "Ongoing"/"Completed"/"Terminated" |
| Product name/description | `product_description` | Direct |
| -- | `product_category` | Keyword categorization (likely "Meat & Poultry" for most) |
| Reason | `reason` | Direct |
| -- | `reason_category` | Keyword categorization |
| Company name | `recalling_firm` | Direct |
| Distribution states | `distribution_states`, `nationwide` | Parse (often requires more complex parsing than FDA) |
| Date | `report_date` | Parse date |
| -- | `recall_initiation_date` | May not be available; set to null |
| -- | `city` | May not be available |
| -- | `state` | May not be available |
| Pounds recalled | `quantity` | Format as string (e.g., "5,000 lbs") |
| (constructed) | `url` | Build URL from recall page |
| -- | `source` | "USDA" (hardcoded) |

---

## Appendix B: State Abbreviation Reference

The state parser must handle full names, abbreviations, and common variations. The canonical list of valid values for `distribution_states`:

```
AL, AK, AZ, AR, CA, CO, CT, DE, DC, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME,
MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, PR,
RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY
```

Puerto Rico (PR) and DC are included. Other territories (GU, VI, AS, MP) should be supported if they appear in the data.

**Nationwide Detection Keywords:** "nationwide", "all states", "us wide", "united states", "all 50 states", "distributed nationally", "national distribution"
