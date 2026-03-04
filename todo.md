# RecallPlate -- Execution Plan

## Instructions for All Agents

- **Context**: Read all files in `docs/` before starting any implementation work:
  - `docs/product-spec.md` -- Original product specification
  - `docs/design-system.md` -- Folder-Tab Explorer design system
  - `docs/prd.md` -- Comprehensive PRD (approved 2026-03-03)
- **Completion Tracking**: Check off tasks with `[x]` when complete. Add a brief completion summary beneath each task when done.
- **Acceptance Criteria**: Tasks reference PRD acceptance criteria IDs (D-1, S-1, R-1, E-1, A-1, etc.) where applicable.
- **Agent Roles**:
  - `architect` -- Project structure, database schema, infrastructure, deployment config
  - `backend-principal` -- ETL pipeline, API routes, data normalization, server logic
  - `frontend-principal` -- Pages, components, client-side state, responsive layouts
  - `designer` -- Design system tokens, component styling, animations, accessibility
  - `orchestrator` -- Coordination, QA, integration testing, final review
- **Dependency Notation**: Each task notes whether it can run in parallel with other tasks or must wait for a predecessor.

---

## Phase 1: Project Setup & Infrastructure

**Goal**: Establish the Next.js project, database schema, and development environment. All subsequent phases depend on this.

### Task 1.1: Initialize Next.js Project

- [ ] **Objective**: Create the Next.js application with App Router, TypeScript, and Tailwind CSS.
- **Agent**: `architect`
- **Dependency**: None (first task)
- **Acceptance Criteria**:
  - Next.js project created with App Router (`/app` directory)
  - TypeScript configured with strict mode
  - Tailwind CSS installed and configured with the design system color tokens from `docs/design-system.md`
  - ESLint + Prettier configured
  - `tsconfig.json` path aliases set up (`@/` for `src/`)
  - Git repository initialized with `.gitignore`
  - Project runs locally with `npm run dev`
- **Completion Summary**:

---

### Task 1.2: Database Schema & Prisma Setup

- [ ] **Objective**: Set up PostgreSQL with Prisma ORM. Define the three core models: `RecallEvent`, `AlertSubscriber`, `SyncLog`.
- **Agent**: `architect`
- **Dependency**: Parallel with Task 1.1
- **Acceptance Criteria**:
  - Prisma installed and configured with PostgreSQL provider
  - `RecallEvent` model matches PRD section 5.1 exactly (all fields, types, nullability)
  - `AlertSubscriber` model matches PRD section 5.2 (unique constraint on `email`)
  - `SyncLog` model matches PRD section 5.3
  - Unique constraint on `(source, recall_number)` for `RecallEvent`
  - Indexes defined: `report_date`, `product_category`, `reason_category`, `classification`, `source`, GIN index on `distribution_states`, full-text search index on `product_description`, `recalling_firm`, `reason`
  - `prisma migrate dev` runs successfully
  - Seed script scaffolded (can be empty for now)
- **Completion Summary**:

---

### Task 1.3: Project Structure & Shared Types

- [ ] **Objective**: Establish the directory structure, shared TypeScript types, and constants.
- **Agent**: `architect`
- **Dependency**: Sequential, after Task 1.1
- **Acceptance Criteria**:
  - Directory structure:
    ```
    src/
      app/
        (marketing)/        # Landing/marketing layout (future)
        api/                # API route handlers
          recalls/
          stats/
          states/
          alerts/
          cron/
        recall/[id]/        # Detail page
        search/             # Search page
        alerts/             # Alert signup page
        page.tsx            # Dashboard (home)
        layout.tsx          # Root layout
      components/
        ui/                 # Primitive UI components
        charts/             # Chart components
        map/                # US map components
        cards/              # Card components
        forms/              # Form components
      lib/
        db.ts               # Prisma client singleton
        types.ts            # Shared TypeScript types/interfaces
        constants.ts        # Product categories, reason categories, states list
        utils.ts            # Shared utility functions
      etl/                  # ETL pipeline code
    ```
  - `lib/types.ts`: TypeScript interfaces for `RecallEvent`, `AlertSubscriber`, `SyncLog`, API request/response shapes
  - `lib/constants.ts`: Arrays for the 14 product categories, 7 reason categories, 50 states + DC + PR, severity class labels, nationwide keywords
  - `lib/db.ts`: Prisma client singleton (prevents hot-reload connection leaks)
- **Completion Summary**:

---

### Task 1.4: Environment Configuration

- [ ] **Objective**: Set up environment variables and configuration for all external services.
- **Agent**: `architect`
- **Dependency**: Parallel with Task 1.3
- **Acceptance Criteria**:
  - `.env.example` file with all required variables documented:
    - `DATABASE_URL` (PostgreSQL connection string)
    - `OPENFDA_API_KEY` (openFDA API key)
    - `ANTHROPIC_API_KEY` (for Claude AI summaries)
    - `NEXT_PUBLIC_BASE_URL` (for OG tags and canonical URLs)
  - `.env.local` added to `.gitignore`
  - `lib/env.ts`: Validated env config using `zod` or runtime checks with clear error messages for missing variables
  - Database connection tested successfully
- **Completion Summary**:

---

### Task 1.5: CI & Linting Basics

- [ ] **Objective**: Set up continuous integration and code quality tooling.
- **Agent**: `architect`
- **Dependency**: Sequential, after Task 1.1
- **Acceptance Criteria**:
  - GitHub Actions workflow (or equivalent) for:
    - TypeScript type checking (`tsc --noEmit`)
    - ESLint
    - Prisma schema validation
    - Build (`next build`)
  - `package.json` scripts: `lint`, `type-check`, `build`, `dev`, `db:migrate`, `db:seed`
  - All checks pass on a clean project
- **Completion Summary**:

---

## Phase 2: Data Pipeline & ETL

**Goal**: Build the ETL pipeline that fetches recall data from all three government APIs, normalizes it into the unified schema, generates AI summaries, and writes to the database. This is the backbone of RecallPlate.

**Parallel Note**: Phase 2 can proceed in parallel with Phase 4 (Design System & Components). They have no dependencies on each other until integration in Phase 5.

### Task 2.1: openFDA Food Enforcement API Integration

- [ ] **Objective**: Build the data fetcher for the FDA food enforcement endpoint with pagination and rate limiting.
- **Agent**: `backend-principal`
- **Dependency**: Sequential, after Task 1.2 and Task 1.3
- **Acceptance Criteria** (ref: E-1):
  - Fetcher function calls `https://api.fda.gov/food/enforcement.json`
  - Handles pagination (1000 records per page via `skip` and `limit` params)
  - Supports date-range filtering for incremental syncs (`report_date:[LAST_SYNC+TO+NOW]`)
  - Implements rate limiting: 250ms delay between requests, respects 240 req/min limit with API key
  - Retries on failure: 3 attempts with exponential backoff (ref: E-10)
  - Returns raw API response objects typed with TypeScript interfaces
  - Handles API unreachable gracefully (logs error, does not throw unhandled)
  - Unit tests with mocked API responses
- **Completion Summary**:

---

### Task 2.2: openFDA Animal/Veterinary Enforcement API Integration

- [ ] **Objective**: Build the data fetcher for the FDA animal/veterinary enforcement endpoint (pet food recalls).
- **Agent**: `backend-principal`
- **Dependency**: Parallel with Task 2.1 (same pattern, different endpoint)
- **Acceptance Criteria** (ref: E-1):
  - Fetcher function calls `https://api.fda.gov/animalandveterinary/enforcement.json`
  - Same pagination, rate limiting, and retry logic as Task 2.1
  - Returns raw API response objects
  - Records from this endpoint will be tagged with `source = "FDA"` and routed to `product_category = "Pet Food"` during categorization
  - Unit tests with mocked API responses
- **Completion Summary**:

---

### Task 2.3: USDA FSIS API Integration (with Scraping Fallback)

- [ ] **Objective**: Build the data fetcher for the USDA FSIS recall API, with a scraping fallback for when the API is unavailable or unreliable.
- **Agent**: `backend-principal`
- **Dependency**: Parallel with Task 2.1
- **Acceptance Criteria** (ref: E-1, E-10):
  - Primary: fetcher calls `https://www.fsis.usda.gov/api/recall-api`
  - Fallback: if API returns errors or unexpected format, falls back to scraping `fsis.usda.gov/recalls`
  - Abstracts data source behind a common interface so primary/fallback are interchangeable
  - Implements retry logic: 3 attempts with exponential backoff
  - Returns raw USDA data objects typed with TypeScript interfaces
  - Handles the less-structured USDA response format (field name inconsistencies, missing fields)
  - Unit tests covering both API and scraper paths
- **Completion Summary**:

---

### Task 2.4: Data Normalization & Unified Schema Mapping

- [ ] **Objective**: Build the normalization layer that transforms raw FDA and USDA records into the unified `RecallEvent` schema.
- **Agent**: `backend-principal`
- **Dependency**: Sequential, after Tasks 2.1, 2.2, 2.3
- **Acceptance Criteria** (ref: E-2, E-3, E-4, E-8, E-9):
  - `normalizeFdaRecord(raw)` function maps openFDA fields to `RecallEvent` per Appendix A
  - `normalizeUsdaRecord(raw)` function maps USDA fields to `RecallEvent` per Appendix A
  - Classification extraction: "Class I" -> "I", "Class II" -> "II", "Class III" -> "III"
  - Date parsing handles all known date formats from both APIs
  - `product_category` assigned via keyword matching rules (PRD section 3.5.4, all 14 categories)
  - `reason_category` assigned via keyword matching rules (PRD section 3.5.4, all 7 categories)
  - State parsing function:
    - Handles full state names ("California" -> "CA")
    - Handles abbreviations ("CA" stays "CA")
    - Handles comma-separated lists ("CA, TX, FL")
    - Handles prose ("distributed in the states of California, Texas, and Florida")
    - Detects nationwide keywords ("Nationwide", "all states", "US wide", etc.) and sets `nationwide = true` with all states populated
    - Logs unparseable distribution strings
  - Records from the animal/vet endpoint default to `product_category = "Pet Food"`
  - URL construction for original source links
  - Comprehensive unit tests with real-world data samples from each API
- **Completion Summary**:

---

### Task 2.5: AI Summary Generation

- [ ] **Objective**: Build the AI summary generation service using Claude Opus 4.6 via the Anthropic API.
- **Agent**: `backend-principal`
- **Dependency**: Sequential, after Task 1.4 (needs `ANTHROPIC_API_KEY`)
- **Acceptance Criteria** (ref: E-5, E-6):
  - Function `generateAiSummary(recall: RecallEvent): Promise<string | null>`
  - Uses Claude Opus 4.6 (`claude-opus-4-6`) via the Anthropic API
  - Prompt template matches PRD section 3.5.5 exactly
  - Output: 2-3 sentences, plain English, no jargon, written for a parent
  - Batch mode: processes multiple recalls efficiently (not one API call per recall in series -- use reasonable concurrency)
  - Fallback: if API call fails, returns `null` (does not throw). Logs the failure. (ref: E-6)
  - Cost tracking: logs token usage per batch
  - Only generates summaries for recalls where `ai_summary` is currently `null`
  - Rate limiting to avoid Anthropic API rate limits
  - Unit tests with mocked Anthropic responses
- **Completion Summary**:

---

### Task 2.6: ETL Pipeline Orchestration

- [ ] **Objective**: Build the main ETL orchestrator that coordinates fetching, normalization, AI enrichment, upserting, and logging.
- **Agent**: `backend-principal`
- **Dependency**: Sequential, after Tasks 2.4 and 2.5
- **Acceptance Criteria** (ref: E-1 through E-12):
  - Single entry point function `runSync()` that:
    1. Fetches from all three endpoints (FDA food, FDA animal/vet, USDA FSIS)
    2. Deduplicates against existing records (by `source` + `recall_number`)
    3. Normalizes all records via the mapping functions
    4. Categorizes products and reasons
    5. Generates AI summaries for new/unsummarized recalls
    6. Upserts to database (new records inserted, changed records updated)
    7. Creates `SyncLog` entry with accurate counts (ref: E-11)
  - Re-syncs recent recalls (last 90 days) to catch status changes
  - Handles partial failures: if one source fails, other sources still process
  - Does not delete existing data on any failure (ref: E-10)
  - Transaction safety: uses Prisma transactions where appropriate
  - Logs detailed sync metrics (fetched, upserted, skipped, errors)
  - End-to-end integration test with test database
- **Completion Summary**:

---

### Task 2.7: Scheduled Sync (Cron/Serverless)

- [ ] **Objective**: Set up the scheduled trigger for the ETL pipeline.
- **Agent**: `backend-principal`
- **Dependency**: Sequential, after Task 2.6
- **Acceptance Criteria** (ref: E-12):
  - API route at `/api/cron/sync` that triggers `runSync()`
  - Protected with a secret token (cron jobs should not be publicly triggerable)
  - Vercel Cron configuration in `vercel.json`:
    ```json
    { "crons": [{ "path": "/api/cron/sync", "schedule": "0 11 * * *" }] }
    ```
    (6:00 AM EST = 11:00 UTC)
  - Fallback: GitHub Actions workflow as alternative trigger
  - Timeout handling: if sync takes too long, log and terminate gracefully
  - Manual trigger capability for development/debugging
  - Sync runs successfully end-to-end against live APIs (manual test)
- **Completion Summary**:

---

### Task 2.8: Initial Data Backfill

- [ ] **Objective**: Run the initial backfill to populate the database with historical recall data.
- **Agent**: `backend-principal`
- **Dependency**: Sequential, after Task 2.7
- **Acceptance Criteria**:
  - Backfill script fetches all recalls from the last 2 years (configurable)
  - Handles openFDA pagination correctly (skip through all pages)
  - Respects rate limits during long-running backfill
  - Generates AI summaries in batches (not all at once)
  - Database populated with historical data
  - `SyncLog` entries created for the backfill run
  - Data quality spot-check: verify 20 random records for correct categorization, state parsing, and summary quality
- **Completion Summary**:

---

## Phase 3: Core API Routes

**Goal**: Build the Next.js API route handlers that serve data to the frontend.

**Parallel Note**: Phase 3 can begin as soon as Phase 1 is complete and Task 2.6 (ETL orchestration) provides data in the database. Tasks 3.1-3.5 can proceed in parallel with each other once the database has data.

### Task 3.1: GET /api/recalls (List with Filters & Pagination)

- [ ] **Objective**: Build the recalls list endpoint with full filtering and pagination support.
- **Agent**: `backend-principal`
- **Dependency**: Sequential, after Task 1.2 (schema) and Task 2.8 (data in DB)
- **Acceptance Criteria** (ref: D-8, D-10, S-3):
  - Route handler at `app/api/recalls/route.ts`
  - Query parameters: `page`, `limit` (max 100), `state`, `category`, `severity`, `source`, `reason`, `start_date`, `end_date`, `sort`, `order`
  - State filter queries `distribution_states` array containment OR `nationwide = true`
  - Response format matches PRD section 6.3 (data array + pagination object)
  - Default sort: `report_date` descending
  - Returns within 500ms for typical queries
  - Input validation and error responses (400 for invalid params, appropriate error messages)
  - Unit tests with various filter combinations
- **Completion Summary**:

---

### Task 3.2: GET /api/recalls/[id] (Single Recall Detail)

- [ ] **Objective**: Build the single recall detail endpoint.
- **Agent**: `backend-principal`
- **Dependency**: Parallel with Task 3.1
- **Acceptance Criteria** (ref: R-1, R-8):
  - Route handler at `app/api/recalls/[id]/route.ts`
  - Returns full `RecallEvent` object with all fields including `ai_summary`
  - Returns 404 with appropriate message for invalid/nonexistent IDs
  - Includes related recalls: up to 6 recalls from the same `recalling_firm` OR same `product_category` + `reason_category`, sorted by date descending (ref: R-7)
  - Unit tests for valid ID, invalid ID, and related recalls logic
- **Completion Summary**:

---

### Task 3.3: GET /api/recalls/stats (Dashboard Aggregations)

- [ ] **Objective**: Build the stats aggregation endpoint for the dashboard.
- **Agent**: `backend-principal`
- **Dependency**: Parallel with Task 3.1
- **Acceptance Criteria** (ref: D-2, D-5):
  - Route handler at `app/api/recalls/stats/route.ts`
  - Query parameters: `state` (optional), `days` (30, 90, 365, or 0 for all time; default 30)
  - Response format matches PRD section 6.3:
    - `total_active`: count of recalls in the time window
    - `by_source`: `{ FDA: number, USDA: number }`
    - `by_severity`: `{ I: number, II: number, III: number }`
    - `by_category`: object with counts per product category
    - `by_reason`: object with counts per reason category
    - `by_state`: object with counts per state (for map data)
    - `top_reason`: most common reason category
    - `timeline`: array of `{ period: string, count: number }` (monthly or weekly buckets)
    - `last_updated`: timestamp of most recent `SyncLog` completion
  - State filter applies to all aggregations when provided
  - Performance: returns within 500ms (use efficient SQL aggregations)
  - Unit tests for different time ranges and state filters
- **Completion Summary**:

---

### Task 3.4: GET /api/recalls/search (Full-Text Search)

- [ ] **Objective**: Build the full-text search endpoint using PostgreSQL search.
- **Agent**: `backend-principal`
- **Dependency**: Parallel with Task 3.1
- **Acceptance Criteria** (ref: S-2, S-11):
  - Route handler at `app/api/recalls/search/route.ts`
  - Query parameter `q` (required, min 2 characters)
  - Uses PostgreSQL full-text search with `plainto_tsquery` across `product_description`, `recalling_firm`, `reason`
  - All filters from Task 3.1 also supported (state, category, severity, etc.)
  - Results ranked by relevance (PostgreSQL `ts_rank`)
  - Same pagination format as `/api/recalls`
  - Returns results within 500ms (ref: S-11)
  - Returns 400 if `q` is missing or less than 2 characters
  - Unit tests for search queries, relevance ranking, and combined search+filters
- **Completion Summary**:

---

### Task 3.5: POST /api/alerts/subscribe (Email Capture)

- [ ] **Objective**: Build the alert subscription endpoint.
- **Agent**: `backend-principal`
- **Dependency**: Parallel with Task 3.1
- **Acceptance Criteria** (ref: A-2, A-3, A-4):
  - Route handler at `app/api/alerts/subscribe/route.ts`
  - Request body: `{ email: string, state: string, categories?: string[] }`
  - Validation:
    - `email`: required, valid email format (ref: A-4)
    - `state`: required, valid US state abbreviation or "ALL"
    - `categories`: optional, array of valid product category strings
  - Upsert behavior: if email exists, update preferences (ref: A-3)
  - Response: `{ success: true, message: "Subscription created successfully." }` (ref: A-5)
  - Error response: `{ success: false, message: "..." }` with appropriate HTTP status
  - Rate limiting: basic protection against spam submissions
  - Unit tests for valid submission, duplicate email, invalid email, invalid state
- **Completion Summary**:

---

## Phase 4: Design System & Component Library

**Goal**: Implement the Folder-Tab Explorer design system and build reusable UI components. This phase can run in parallel with Phases 2 and 3.

**Parallel Note**: Phase 4 is independent of Phase 2 (ETL) and can proceed alongside it. Components should use mock data initially and be wired to real data in Phase 5.

### Task 4.1: Typography, Color Tokens & CSS Custom Properties

- [ ] **Objective**: Set up the foundational design tokens as CSS custom properties and Tailwind config.
- **Agent**: `designer`
- **Dependency**: Sequential, after Task 1.1 (project exists)
- **Acceptance Criteria**:
  - Google Fonts loaded: serif display font (Instrument Serif or Playfair Display), monospace (DM Mono or JetBrains Mono), sans-serif (DM Sans or Satoshi)
  - CSS custom properties defined in `globals.css` matching design-system.md:
    - All folder colors (`--folder-red` through `--folder-black`)
    - Semantic colors (`--text-primary`, `--text-secondary`, `--text-on-dark`, `--border`, `--surface`, `--page-bg`, `--canvas-dark`, `--success`, `--warning`, `--danger`)
    - Severity badge colors (Class I red, Class II amber, Class III blue)
    - Source badge colors (FDA blue, USDA warm)
  - Tailwind config extended with design system colors, fonts, and spacing
  - Typography scale matches design-system.md (folder labels, page titles, table headers, body text, KPI values)
  - Demo page or Storybook showing all tokens in use
- **Completion Summary**:

---

### Task 4.2: Folder-Tab Explorer Component (Phase 1 of Design System)

- [ ] **Objective**: Build the folder explorer component -- the signature UI element of RecallPlate's landing experience.
- **Agent**: `designer`
- **Dependency**: Sequential, after Task 4.1
- **Acceptance Criteria**:
  - `<FolderExplorer>` component renders stacked, overlapping folder tabs on a dark background (`#111215`)
  - Each folder has:
    - Physical manila-folder silhouette (rounded top edges, notched tab handle) via `clip-path` or SVG
    - Distinct color from the folder palette
    - Tab label in serif font (18-22px)
    - Preview row between folders (record count, date range, one-line summary in monospace)
    - Subtle paper grain texture at 3-5% opacity
  - Tab handles staggered horizontally (some left, center, right aligned)
  - Folder stack is vertically scrollable when content exceeds viewport
  - Hover interaction: folder lifts (translateY -4px), shadow increases, color brightens 10%
  - Click triggers a callback (transition handled in Task 4.3)
  - Keyboard navigation: arrow keys between folders, Enter/Space to open
  - Responsive: tabs compress on mobile (<768px), preview metadata collapses to count badge
  - Accepts data props: array of `{ label, color, count, dateRange, preview }`
- **Completion Summary**:

---

### Task 4.3: Folder-to-Table Transition Animation

- [ ] **Objective**: Implement the signature folder-open animation that transitions from the explorer to the data table view.
- **Agent**: `designer`
- **Dependency**: Sequential, after Task 4.2
- **Acceptance Criteria**:
  - Animation sequence (400-600ms total):
    1. **Lift** (0-150ms): Selected folder scales up (1.02x), stronger shadow, z-index bump. Siblings fade to opacity 0.3.
    2. **Rotate & Expand** (150-400ms): Folder rotates in 3D (rotateX -5deg, perspective 1200px), scales to fill content area. Color transitions to header accent.
    3. **Settle** (400-600ms): 3D rotation resolves flat. Table content fades in. Breadcrumb appears.
  - Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
  - Reverse transition: breadcrumb "back to folders" plays animation in reverse
  - Background transitions from dark (`#111215`) to light (`#F5F5F3`) during animation
  - Implementation: Framer Motion (preferred) or CSS `@keyframes`
  - `prefers-reduced-motion`: all animations disabled, instant state change
  - Smooth at 60fps on mid-range devices
- **Completion Summary**:

---

### Task 4.4: Data Table Component

- [ ] **Objective**: Build the data table component with all cell types defined in the design system.
- **Agent**: `designer`
- **Dependency**: Sequential, after Task 4.1
- **Acceptance Criteria**:
  - `<DataTable>` component with:
    - Column headers: uppercase, 11-12px, letterspaced, muted (`#888`), sortable with arrow icons
    - Row height: 56-64px, bottom border separation (`1px solid #F0F0F0`), hover tint `#FAFAF8`
    - Checkbox column for row selection
    - Selected rows: subtle left-border accent (2-3px) in the folder accent color
  - Cell type components:
    - `<NameCell>` -- primary text (14-15px medium) + secondary text (12-13px muted)
    - `<BadgeCell>` -- color-coded pills (severity, source, reason category)
    - `<DateCell>` -- relative dates for recent ("2h ago"), absolute for older ("Sep 12, 2024")
    - `<TextCell>` -- standard text with truncation
  - Bulk action bar: floating dark bar at viewport bottom when rows selected
  - Sort functionality (click column header to sort)
  - Pagination controls
  - Responsive: single-column card layout on mobile
  - Virtualization support for large datasets (TanStack Virtual or similar)
- **Completion Summary**:

---

### Task 4.5: Summary Cards Component

- [ ] **Objective**: Build the summary/KPI cards component for the dashboard and table views.
- **Agent**: `designer`
- **Dependency**: Parallel with Task 4.4
- **Acceptance Criteria**:
  - `<SummaryCards>` component renders a horizontal row of 3-5 metric cards
  - Each card shows:
    - Label text (e.g., "Active Recalls", "Class I")
    - Large numeric value (24-28px semibold)
    - Trend indicator: percentage change badge (green positive, red negative)
    - Optional inline sparkline (~40x20px SVG)
  - Cards: white/light background, 1px border (`#E5E5E5`), 8px rounded corners
  - Equal-width flex layout with 16px gap
  - Responsive: 2-column grid on tablet, single column stack on mobile
  - Accepts data props: array of `{ label, value, change, sparklineData?, accentColor? }`
- **Completion Summary**:

---

### Task 4.6: Badge Components (Severity, Source, Category, Reason)

- [ ] **Objective**: Build all badge/pill components used throughout the application.
- **Agent**: `designer`
- **Dependency**: Sequential, after Task 4.1 (needs color tokens)
- **Acceptance Criteria**:
  - `<SeverityBadge class="I" | "II" | "III">`:
    - Class I: red pill (`#FFEBEE` bg, `#C62828` text) + "Serious Health Risk" label
    - Class II: amber pill (`#FFF3E0` bg, `#E65100` text) + "Remote Health Risk" label
    - Class III: blue pill (`#E3F2FD` bg, `#1565C0` text) + "Not Likely Harmful" label
    - Includes icon/pattern for colorblind accessibility
  - `<SourceBadge source="FDA" | "USDA">`: pill-shaped with distinct colors
  - `<CategoryBadge category={string}>`: pill with category-appropriate color
  - `<ReasonBadge reason={string}>`: pill with reason-category color
  - All badges: accessible contrast (4.5:1 minimum), text labels always present (not color-only)
  - Consistent sizing and spacing across all badge types
- **Completion Summary**:

---

### Task 4.7: US Map Choropleth Component

- [ ] **Objective**: Build the interactive US map choropleth for the dashboard and mini-maps.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Task 4.1
- **Acceptance Criteria** (ref: D-3, D-4):
  - `<USMap>` component using `react-simple-maps`
  - Full-size variant (dashboard): all 50 states + DC + PR
  - Mini variant (recall detail page): smaller, non-interactive, highlights specific states
  - Color scale: sequential light-to-dark based on recall count per state
  - Hover: tooltip with state name and recall count (ref: D-3)
  - Click: calls `onStateClick(stateCode)` callback (ref: D-4)
  - Nationwide recalls count toward every state
  - `aria-label` on the map and state-by-state text summary for screen readers
  - Responsive: scales down on mobile
  - Accepts props: `data: Record<string, number>`, `highlightedStates?: string[]`, `size?: "full" | "mini"`, `onStateClick?: (state: string) => void`
- **Completion Summary**:

---

### Task 4.8: Timeline & Chart Components

- [ ] **Objective**: Build the chart components for the dashboard (timeline, category breakdown, severity distribution).
- **Agent**: `frontend-principal`
- **Dependency**: Parallel with Task 4.7
- **Acceptance Criteria**:
  - `<TimelineChart>` -- line/area chart (Recharts):
    - X-axis: time periods (monthly/weekly)
    - Y-axis: recall count
    - Hover tooltip with exact count
    - Click data point to navigate to search for that period
    - Filter dropdowns: product category, severity class
  - `<CategoryBreakdown>` -- horizontal bar chart (Recharts):
    - Bars sorted descending by count
    - Clickable bars (filter recent recalls feed)
    - Hide categories with zero recalls
  - `<SeverityDonut>` -- donut chart (Recharts):
    - Three segments: Class I (red), II (amber), III (blue)
    - Labels with plain-English severity descriptions
    - Clickable segments (filter recent recalls feed)
    - Shows percentages and counts
  - All charts: `aria-label` descriptions, responsive sizing
  - `prefers-reduced-motion`: disable chart animations
- **Completion Summary**:

---

### Task 4.9: Recall Card Component

- [ ] **Objective**: Build the recall card used in the Recent Recalls Feed and Search Results.
- **Agent**: `designer`
- **Dependency**: Sequential, after Task 4.6 (needs badge components)
- **Acceptance Criteria** (ref: D-8, S-3):
  - `<RecallCard>` component displays:
    - Product description (truncated to 2 lines)
    - Recalling firm name
    - Reason category badge
    - Severity badge (color-coded)
    - Report date (relative for recent, absolute for older)
    - Source badge (FDA/USDA)
  - Clickable: entire card is a link to `/recall/[id]`
  - Hover state: subtle elevation/shadow change
  - Responsive: full-width on mobile, card grid on desktop
  - Skeleton loading state variant
  - Accepts props matching `RecallEvent` type
- **Completion Summary**:

---

## Phase 5: Dashboard (Home Page)

**Goal**: Assemble the dashboard page using the components from Phase 4 and data from Phase 3.

**Dependency**: Requires Phase 3 (API routes) and Phase 4 (components) to be substantially complete.

### Task 5.1: Dashboard Page Layout & Server Components

- [ ] **Objective**: Build the dashboard page (`/`) with server-rendered summary stats and layout.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 3.3 and 4.5
- **Acceptance Criteria** (ref: D-1, D-2):
  - Page at `app/page.tsx` (server component)
  - Server-side data fetching from `/api/recalls/stats`
  - Summary stats bar at top: Active Recalls count, FDA/USDA breakdown, Top Reason, Last Updated
  - Stats are server-rendered for SEO and performance (ref: D-1)
  - Layout grid: map + timeline on top row, categories + severity on second row, recent feed below
  - Responsive layout: single-column stack on mobile, grid on desktop
  - Loading skeletons while client components hydrate
  - Page loads within 2 seconds (ref: D-1)
- **Completion Summary**:

---

### Task 5.2: US Map Integration with State Filtering

- [ ] **Objective**: Integrate the map component with dashboard state filtering.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 4.7 and 5.1
- **Acceptance Criteria** (ref: D-3, D-4, D-5):
  - Map displays recall density per state from stats API data
  - Hover shows tooltip with state name and count (ref: D-3)
  - Click a state: all dashboard components filter to that state (ref: D-4)
  - Time range toggle (30d / 90d / 12mo / all time) updates map and all charts (ref: D-5)
  - "Clear filter" option to return to national view
  - Selected state is visually highlighted
  - State selection persists across chart/feed interactions
- **Completion Summary**:

---

### Task 5.3: Charts Integration (Timeline, Categories, Severity)

- [ ] **Objective**: Wire the chart components to live data and interactive filtering.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 4.8 and 5.1
- **Acceptance Criteria** (ref: D-5, D-6, D-7):
  - Timeline chart displays data from the stats API timeline array
  - Category breakdown chart displays `by_category` data
  - Severity donut displays `by_severity` data
  - All charts respond to time range toggle (ref: D-5)
  - All charts respond to state filter (from map click)
  - Click category bar: filters Recent Recalls Feed to that category (ref: D-6)
  - Click severity segment: filters Recent Recalls Feed to that severity (ref: D-7)
  - Loading states while data fetches
- **Completion Summary**:

---

### Task 5.4: Recent Recalls Feed with Filtering & Pagination

- [ ] **Objective**: Build the recent recalls feed with dynamic filtering from other dashboard components and pagination.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 4.9 and 3.1
- **Acceptance Criteria** (ref: D-8, D-9, D-10, D-11):
  - Displays 20 most recent recalls as `RecallCard` components (ref: D-8)
  - Each card links to `/recall/[id]` (ref: D-9)
  - "Load more" button at bottom loads next 20 (ref: D-10)
  - Responds to state filter (map click), category filter (bar click), severity filter (donut click)
  - Multiple filters combine with AND logic
  - Empty state when no recalls match filters (ref: D-11)
  - Loading skeleton during data fetch
  - Smooth scroll behavior when loading more
- **Completion Summary**:

---

### Task 5.5: Folder Explorer Integration -- Categories as Folders

- [ ] **Objective**: Integrate the folder explorer as an alternative dashboard navigation, where each folder represents a product category.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 4.2, 4.3, and 5.4
- **Acceptance Criteria**:
  - Folder explorer shows product categories as individual folders
  - Each folder displays: category name, recall count, most recent recall preview
  - Folder colors mapped to category-specific colors from the palette
  - Clicking a folder triggers the signature transition animation
  - After transition: data table shows recalls filtered to that category
  - Breadcrumb "Back to categories" triggers reverse transition
  - Dark background (Phase 1) transitions to light background (Phase 2) during animation
  - Accessible: keyboard navigation between folders, screen reader announces category information
  - Toggle or route to switch between "Dashboard view" and "Explorer view"
- **Completion Summary**:

---

## Phase 6: Search Page

**Goal**: Build the dedicated search experience at `/search`.

**Dependency**: Requires Task 3.4 (search API) and Phase 4 components (cards, badges).

### Task 6.1: Search Page Layout & Input

- [ ] **Objective**: Build the search page with the search input, filter panel, and results area.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 3.4 and 4.9
- **Acceptance Criteria** (ref: S-1, S-2):
  - Page at `app/search/page.tsx`
  - Search input: focused on page load (ref: S-1), placeholder "Search products, brands, or companies..."
  - Debounced search: 300ms delay after last keystroke, minimum 2 characters (ref: S-2)
  - Results area below search input
  - Responsive layout: filters in sidebar on desktop, collapsible panel on mobile
- **Completion Summary**:

---

### Task 6.2: Filter Panel

- [ ] **Objective**: Build the search filter panel with all filter types.
- **Agent**: `frontend-principal`
- **Dependency**: Parallel with Task 6.1
- **Acceptance Criteria** (ref: S-4, S-5, S-6):
  - Filter components:
    - State: type-ahead dropdown, multiple selection (ref: S-4)
    - Product Category: multi-select checkboxes
    - Severity Class: checkbox group (I, II, III with plain-English labels)
    - Date Range: date picker (start/end), default last 12 months
    - Source: toggle/checkbox (FDA, USDA, both)
    - Reason Category: multi-select dropdown
  - Filters apply with AND logic across filter types (ref: S-5)
  - Multiple selections within a filter use OR logic (ref: S-6)
  - "Clear all filters" button
  - Filter selections visually indicated (badges/chips showing active filters)
- **Completion Summary**:

---

### Task 6.3: Search Results & URL State

- [ ] **Objective**: Display search results and sync all query/filter state with the URL.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 6.1 and 6.2
- **Acceptance Criteria** (ref: S-7, S-8, S-9, S-10):
  - Results displayed as `RecallCard` list (same format as dashboard feed)
  - Total count displayed: "Showing X of Y results" (ref: S-10)
  - Default sort: newest first. Option to sort by severity.
  - URL query string reflects current search and filter state (ref: S-7)
    - Example: `/search?q=chicken&state=TX&severity=I`
  - Loading a URL with query params pre-fills search and filters, executes search (ref: S-8)
  - Empty state: illustration + "No matching recalls found. Try adjusting your filters or search terms." (ref: S-9)
  - Pagination: "Load more" button or numbered pagination, 20 per page
  - Browser back/forward navigation works correctly with URL state
- **Completion Summary**:

---

## Phase 7: Recall Detail Page

**Goal**: Build the individual recall detail page at `/recall/[id]`.

**Dependency**: Requires Task 3.2 (detail API) and Phase 4 components.

### Task 7.1: Recall Detail Page Layout

- [ ] **Objective**: Build the recall detail page with all required sections.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Tasks 3.2, 4.6, and 4.7
- **Acceptance Criteria** (ref: R-1, R-2, R-3, R-4, R-5, R-6):
  - Page at `app/recall/[id]/page.tsx` (server component for SEO)
  - Header: product description (full text), severity badge (large), source badge
  - AI Summary card: highlighted card with 2-3 sentence summary (ref: R-2)
  - If `ai_summary` is null, summary section is hidden entirely (ref: R-3)
  - Details table: key-value pairs for firm, city/state, recall number, classification, status, dates, quantity
  - Reason section: normalized reason badge + original reason text
  - Distribution section:
    - State badges/chips (ref: R-4)
    - "Nationwide" badge if applicable (ref: R-5)
    - Mini US map with affected states highlighted
  - Source link button: "View on [FDA/USDA] website" (ref: R-6)
  - 404 page for invalid recall IDs (ref: R-8)
  - Loading skeleton during data fetch
- **Completion Summary**:

---

### Task 7.2: Related Recalls Section

- [ ] **Objective**: Build the related recalls section at the bottom of the detail page.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Task 7.1
- **Acceptance Criteria** (ref: R-7):
  - Horizontal scroll or grid of up to 6 related recalls
  - Related = same `recalling_firm` OR same `product_category` + `reason_category`
  - Sorted by date descending
  - Each related recall rendered as a compact card linking to its detail page
  - If no related recalls found, section is hidden
  - Loading state while fetching
- **Completion Summary**:

---

### Task 7.3: SEO (Meta Tags, OG, Structured Data)

- [ ] **Objective**: Implement SEO requirements for the recall detail page.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Task 7.1
- **Acceptance Criteria** (ref: R-9, R-10):
  - `<title>`: "[Product Description] Recall - RecallPlate" (ref: R-9)
  - Meta description: AI summary text truncated to 160 characters
  - Open Graph tags: title, description, and generated OG image with product name, severity, and date (ref: R-10)
  - Structured data: JSON-LD (`GovernmentService` or `Article` schema)
  - Canonical URL set correctly
  - OG image generation: either static template or dynamic via `next/og` (Vercel OG Image Generation)
  - Test with social media preview tools (Twitter Card Validator, Facebook Debugger)
- **Completion Summary**:

---

## Phase 8: Alert System

**Goal**: Build the email capture alert system (signup only, no delivery in V1).

**Dependency**: Requires Task 3.5 (subscribe API).

### Task 8.1: Alert Signup Page

- [ ] **Objective**: Build the dedicated alert signup page at `/alerts`.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Task 3.5
- **Acceptance Criteria** (ref: A-1, A-2, A-4, A-5):
  - Page at `app/alerts/page.tsx`
  - Form with:
    - Email input (required, validated) (ref: A-4)
    - State dropdown (required, all 50 states + DC + "All States")
    - Product category multi-select checkboxes (optional, defaults to all)
  - Submits to `POST /api/alerts/subscribe` (ref: A-2)
  - Success state: "You're signed up! We'll notify you when new recalls match your preferences." (ref: A-5)
  - Error state: shows validation errors inline
  - Privacy note on the form
  - Client-side validation before submission
  - Loading state during submission
- **Completion Summary**:

---

### Task 8.2: Embedded Alert CTAs

- [ ] **Objective**: Build compact alert signup CTAs embedded on other pages.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Task 8.1
- **Acceptance Criteria** (ref: A-6):
  - `<AlertCTA>` compact component: "Get notified about recalls in your state" with inline email + state dropdown
  - Embedded on:
    - Dashboard (sidebar or footer area)
    - Recall detail page (bottom of page)
    - Search results (when results > 0)
  - Each CTA submits to the same API endpoint
  - Success/error states handled inline
  - Does not duplicate the full `/alerts` page form -- compact single-row design
  - All three placements functional (ref: A-6)
- **Completion Summary**:

---

## Phase 9: Polish, Performance & Launch

**Goal**: Final quality assurance, performance optimization, accessibility audit, and deployment.

**Dependency**: All previous phases substantially complete.

### Task 9.1: Responsive Testing & Mobile Polish

- [ ] **Objective**: Test and polish the responsive experience across all breakpoints.
- **Agent**: `designer`
- **Dependency**: Sequential, after Phases 5-8
- **Acceptance Criteria**:
  - All pages tested at three breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
  - Folder explorer compresses correctly on mobile (tabs stack, preview metadata collapses)
  - Dashboard charts stack vertically on mobile
  - Data table switches to card layout on mobile
  - Search filters collapse into an expandable panel on mobile
  - Map scales and remains interactive on small screens
  - All touch targets minimum 44x44px
  - No horizontal scrolling on any page at any breakpoint
  - Tested on real devices (iPhone, Android) or accurate emulators
- **Completion Summary**:

---

### Task 9.2: Performance Optimization (Lighthouse >90)

- [ ] **Objective**: Optimize performance to meet the >90 Lighthouse score target across all pages.
- **Agent**: `architect`
- **Dependency**: Sequential, after Task 9.1
- **Acceptance Criteria**:
  - Dashboard loads in under 2 seconds (P95) (ref: D-1)
  - Search returns results in under 500ms (ref: S-11)
  - Lighthouse Performance score >90 on mobile
  - Lighthouse Best Practices score >90
  - Image optimization: all images use `next/image` with proper sizing
  - Font optimization: font-display swap, preload critical fonts
  - Bundle analysis: no unnecessary large dependencies
  - Server components used where possible (minimize client JS)
  - ISR or caching strategy for dashboard data (avoid re-fetching on every page load)
  - Code splitting for heavy components (charts, map)
- **Completion Summary**:

---

### Task 9.3: Accessibility Audit (WCAG AA)

- [ ] **Objective**: Conduct a full accessibility audit and fix all issues to meet WCAG AA compliance.
- **Agent**: `designer`
- **Dependency**: Parallel with Task 9.2
- **Acceptance Criteria**:
  - Lighthouse Accessibility score >90
  - All text meets 4.5:1 contrast ratio (normal text) and 3:1 (large text, icons)
  - Color is never the sole means of conveying information (severity badges have text labels, charts have data tables)
  - All interactive elements keyboard-navigable with visible focus indicators (2px offset focus rings)
  - Folder tabs: arrow key navigation, Enter/Space to open
  - Table rows: Space for checkbox, Shift+arrow for range selection
  - Charts have `aria-label` and alternative data tables
  - Map has state-by-state text summary
  - All form inputs have associated labels
  - Proper heading hierarchy (h1 -> h2 -> h3, no skips)
  - Landmark regions defined (`<main>`, `<nav>`, `<aside>`)
  - Screen reader testing with VoiceOver (macOS)
  - `prefers-reduced-motion` respected: all animations disabled
- **Completion Summary**:

---

### Task 9.4: Error Boundaries & Loading States

- [ ] **Objective**: Implement error boundaries and loading states across all pages and components.
- **Agent**: `frontend-principal`
- **Dependency**: Parallel with Task 9.2
- **Acceptance Criteria**:
  - React error boundaries on all page-level components
  - Graceful fallback UI when components error (not blank screens)
  - Loading skeletons for:
    - Dashboard summary cards
    - Chart areas
    - Map
    - Recall feed / search results
    - Recall detail page
  - Error states for:
    - API failures (user-friendly error messages)
    - Network errors
    - 404 pages (recall not found, page not found)
  - No spinners lasting more than 1 second for primary content
  - `loading.tsx` and `error.tsx` files in App Router for each route segment
- **Completion Summary**:

---

### Task 9.5: Global Navigation & Layout

- [ ] **Objective**: Build the global navigation bar, footer, and overall app shell.
- **Agent**: `frontend-principal`
- **Dependency**: Sequential, after Phase 5 (dashboard done)
- **Acceptance Criteria**:
  - Top navigation bar (fixed):
    - RecallPlate logo/wordmark (links to `/`)
    - Navigation links: Dashboard, Search, Alerts
    - Search icon (quick access to `/search`)
  - Footer:
    - "Data sourced from FDA and USDA" attribution
    - Links: About (placeholder), Privacy (placeholder)
    - Last updated timestamp
  - Mobile: hamburger menu or bottom tab navigation
  - Active page indicator in navigation
  - Consistent across all pages
- **Completion Summary**:

---

### Task 9.6: Vercel Deployment & Domain Configuration

- [ ] **Objective**: Deploy the application to Vercel and configure the production domain.
- **Agent**: `architect`
- **Dependency**: Sequential, after Tasks 9.2, 9.3, 9.4
- **Acceptance Criteria**:
  - Vercel project created and connected to Git repository
  - Environment variables configured in Vercel dashboard (DATABASE_URL, OPENFDA_API_KEY, ANTHROPIC_API_KEY, NEXT_PUBLIC_BASE_URL)
  - Production build succeeds on Vercel
  - Vercel Cron Job configured for daily ETL sync
  - Custom domain configured (recallplate.com or alternative)
  - SSL/HTTPS working
  - Preview deployments working for PRs
  - Production deployment accessible and functional
- **Completion Summary**:

---

### Task 9.7: Final QA Pass

- [ ] **Objective**: End-to-end QA testing of all features, user flows, and acceptance criteria.
- **Agent**: `orchestrator`
- **Dependency**: Sequential, after all other Phase 9 tasks
- **Acceptance Criteria**:
  - All PRD acceptance criteria verified:
    - Dashboard: D-1 through D-11
    - Search: S-1 through S-11
    - Recall Detail: R-1 through R-10
    - Alerts: A-1 through A-6
    - ETL: E-1 through E-12
  - User flows tested end-to-end (PRD section 4):
    - Flow 4.1: Discovering a recall from the dashboard
    - Flow 4.2: Searching for a specific product
    - Flow 4.3: Browsing by state
    - Flow 4.4: Signing up for alerts
    - Flow 4.5: Pet owner checking pet food recalls
  - Cross-browser testing: Chrome, Safari, Firefox
  - Mobile testing: iOS Safari, Android Chrome
  - Data quality spot-check: 20 records verified for correctness
  - Performance verified on production: <2s dashboard, <500ms search
  - No console errors on any page
  - All links functional (no 404s)
  - ETL cron running successfully in production
- **Completion Summary**:

---

## Dependency & Parallelism Map

```
Phase 1 (Setup)
  |
  +-- Phase 2 (ETL)          ← Can run in PARALLEL with Phase 4
  |     |
  |     +-- Phase 3 (APIs)   ← Needs Phase 1 + data from Phase 2
  |
  +-- Phase 4 (Design/UI)    ← Can run in PARALLEL with Phase 2
        |
        +-- Phase 5 (Dashboard) ← Needs Phase 3 + Phase 4
        |
        +-- Phase 6 (Search)    ← Needs Task 3.4 + Phase 4
        |
        +-- Phase 7 (Detail)    ← Needs Task 3.2 + Phase 4
        |
        +-- Phase 8 (Alerts)    ← Needs Task 3.5 + Phase 4

Phase 9 (Polish & Launch) ← After all above
```

**Maximum Parallelism Opportunities**:
- Phase 2 (backend-principal) + Phase 4 (designer / frontend-principal) run simultaneously
- Within Phase 3: Tasks 3.1-3.5 all run in parallel
- Within Phase 4: Tasks 4.4, 4.5, 4.7, 4.8 can run in parallel after Task 4.1
- Phases 6, 7, 8 can run in parallel with each other (after their dependencies)
- Tasks 9.2, 9.3, 9.4 can run in parallel

---

## Progress Summary

| Phase | Total Tasks | Completed | Status |
|-------|-------------|-----------|--------|
| Phase 1: Setup & Infrastructure | 5 | 0 | Not Started |
| Phase 2: Data Pipeline & ETL | 8 | 0 | Not Started |
| Phase 3: Core API Routes | 5 | 0 | Not Started |
| Phase 4: Design System & Components | 9 | 0 | Not Started |
| Phase 5: Dashboard | 5 | 0 | Not Started |
| Phase 6: Search Page | 3 | 0 | Not Started |
| Phase 7: Recall Detail Page | 3 | 0 | Not Started |
| Phase 8: Alert System | 2 | 0 | Not Started |
| Phase 9: Polish & Launch | 7 | 0 | Not Started |
| **Total** | **47** | **0** | **Not Started** |
