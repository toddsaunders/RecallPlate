# Design Skill: Folder-Tab Explorer → Data Table

A two-phase UI pattern that opens with a physical-folder navigation metaphor for browsing categories, collections, or segments, then transitions into a structured data table once the user drills into a specific grouping.

---

## Concept

The interface has two distinct modes connected by a single interaction:

**Phase 1 — Folder Explorer.** The landing state. Stacked, overlapping folder tabs fill the viewport. Each tab represents a category (e.g. "Organic Leads," "SB2024 Campaign," "Lost Deals"). Tabs are color-coded, staggered vertically, and use a physical manila-folder silhouette with rounded top edges and notched tab handles. Between the stacked folders, preview metadata peeks through: a record count, a date range, a one-line summary. The whole composition feels archival, tactile, like thumbing through a filing cabinet.

**Phase 2 — Data Table.** Clicking a folder tab triggers an animated open. The selected folder scales up and "unfolds" to fill the content area, revealing a clean, functional data table inside. The folder's color persists as a subtle accent in the table header or sidebar. A breadcrumb trail tracks the path from the explorer root into the current view. Standard table operations (sort, filter, search, bulk select, pagination) are available here.

The transition between phases is the signature moment. It should feel physical: the folder lifts, rotates slightly in perspective, and opens flat to become the table container.

---

## Phase 1: Folder Explorer

### Layout

The folder stack is the entire content area. No sidebar in this phase. The top navigation bar (logo, global search, user avatar) stays fixed.

Folders are rendered as overlapping horizontal bands, each ~60–80px tall, stacked with ~20px vertical offset so every tab label is visible. The stack is vertically scrollable when there are more folders than fit in the viewport.

Each folder tab has a distinctive silhouette: a flat bottom edge, slightly rounded top-left and top-right corners, and a protruding tab handle (the label area) that extends above the folder body. The tab handle is offset horizontally — some left-aligned, some center, some right — to create a staggered, organic feel like real file folders.

### Color System

Each folder gets a distinct, saturated fill color from a curated palette:

| Token | Hex | Usage |
|---|---|---|
| `--folder-red` | `#E63B2E` | High-priority / hot segments |
| `--folder-blue` | `#2B5CE6` | Active campaigns |
| `--folder-teal` | `#0E8A7D` | Organic / evergreen |
| `--folder-orange` | `#F28C28` | Warming / pre-sale |
| `--folder-pink` | `#D94F8A` | Nurture / re-engagement |
| `--folder-purple` | `#7B3FA0` | Closed / archived |
| `--folder-yellow` | `#E6C820` | New / unqualified |
| `--folder-black` | `#1A1A1E` | Special / VIP |

Colors should be bold and fully saturated. The dark background (`#111215` or similar near-black) makes the folders pop. White or light text on folder surfaces.

### Folder Surface Details

Each folder is not just a colored rectangle. The surface carries:

- **Tab label** — the category name, set in a serif or display font (e.g. the same family used for page titles). White text, 18–22px.
- **Preview row** — visible in the gap between folders. Shows: record ID or count, a one-line description in monospace, and a date. This metadata comes from the top record in that folder or from aggregate stats.
- **Texture** — subtle grain or paper-like noise overlay at 3–5% opacity to reinforce the physical metaphor. Optional: faint ruled lines or a stamp/watermark motif.

### Interaction

- **Hover**: The hovered folder lifts slightly (translateY -4px, subtle box-shadow increase). Cursor changes to pointer. The folder's color brightens ~10%.
- **Click**: Triggers the Phase 2 transition (see Transition section).
- **Scroll**: The folder stack scrolls vertically. Consider a slight parallax offset so higher folders move slower, reinforcing depth.

### Responsive Behavior

On narrow viewports (<768px), the folder stack compresses. Tab handles stack vertically with less horizontal offset. The preview metadata rows collapse to just a count badge on each tab.

---

## Transition: Folder Open

This is the signature animation. It should take 400–600ms total, eased with a custom cubic-bezier (e.g. `cubic-bezier(0.22, 1, 0.36, 1)` for a fast-start, soft-land feel).

### Sequence

1. **Lift** (0–150ms): The clicked folder scales up slightly (1.02x), gains a stronger drop shadow, and rises above the stack (z-index bump). Sibling folders begin fading out (opacity 0.3).
2. **Rotate & Expand** (150–400ms): The folder rotates subtly in 3D (rotateX -5deg, perspective 1200px) as if tipping open toward the viewer. Simultaneously, it scales to fill the content area. The folder's color begins transitioning to a header/accent bar.
3. **Settle** (400–600ms): The 3D rotation resolves to flat. The table content fades in from opacity 0. The breadcrumb appears. The folder's tab handle morphs into the page title area.

### Reverse Transition

Clicking the breadcrumb root or a "back to folders" control plays the animation in reverse: the table container shrinks, re-gains the 3D tilt, and settles back into the stack as sibling folders fade back in.

---

## Phase 2: Data Table

Once the folder is open, the interface becomes a functional data workspace. The design here is clean and utilitarian, contrasting with the expressive folder explorer.

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Logo    Breadcrumb: Root / Category Name    🔍  │  ← Fixed top bar
├─────────────────────────────────────────────────┤
│  [Page Title]                    [+ New Record] │
│  [Time filter: Last 7 days ▾]                   │
├────────┬────────┬────────┬──────────────────────┤
│  KPI   │  KPI   │  KPI   │  KPI                 │  ← Summary cards
│  Card  │  Card  │  Card  │  Card                 │
├────────┴────────┴────────┴──────────────────────┤
│  [List] [Board] [Pipeline]    [Group] [Search]  │  ← View toggles
├─────────────────────────────────────────────────┤
│  ☐  NAME      SOURCE    STATUS   SIZE   ...     │  ← Column headers
│  ☐  Record 1  TAG       BADGE    $xxx   ...     │
│  ☐  Record 2  TAG       BADGE    $xxx   ...     │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  [n selected]  [Action] [Action] [Export] [Del] │  ← Bulk action bar
└─────────────────────────────────────────────────┘
```

### Summary Cards

A horizontal row of 3–5 metric cards at the top of the table view. Each card shows:

- A label (e.g. "New," "Closed," "Lost," "Total Closed")
- A large numeric value
- A trend indicator: percentage change badge (green for positive, coral/red for negative) with a tiny sparkline

Cards have a white or very light background, thin 1px border (`#E5E5E5`), and rounded corners (8px). The sparkline is rendered inline as an SVG, ~40x20px, using the folder's accent color.

### Column Headers

- Background: `#FAFAFA` or transparent with a bottom border
- Text: uppercase, 11–12px, letterspaced 0.5–1px, medium weight, muted color (`#888`)
- Sortable columns show a subtle arrow icon on hover

### Table Rows

- Row height: 56–64px, enough for a two-line cell (name + email)
- Alternating background: none. Use a bottom border (`1px solid #F0F0F0`) for separation
- Hover: light background tint (`#FAFAF8`)
- Selection: checkbox left-aligned. Selected rows get a subtle left-border accent (2–3px) in the folder's color

### Cell Types

**Lead / Name cell**: Primary text (name) in 14–15px medium weight, secondary text (email) in 12–13px regular weight, muted color. Clicking the name navigates to detail.

**Source tags**: Pill-shaped badges with a light fill and darker text. "ORGANIC" uses a neutral gray. Campaign sources (e.g. "SB2024") use a warmer tone and include a small external-link icon (↗) indicating the source is clickable.

**Status badges**: Color-coded pills with no border:

| Status | Background | Text Color |
|---|---|---|
| PRE-SALE | `#FFF3E0` (warm cream) | `#E65100` (dark orange) |
| CLOSED | `#E8F5E9` (light green) | `#2E7D32` (dark green) |
| LOST | `#FFEBEE` (light red) | `#C62828` (dark red) |
| CLOSING | `#FFF8E1` (light amber) | `#F57F17` (dark amber) |
| NEW | `#E3F2FD` (light blue) | `#1565C0` (dark blue) |

**Size / Dollar values**: Right-aligned, tabular-nums font variant, 14px. No currency symbol clutter — use "$120,000" format.

**Interest sparkline**: A tiny inline chart (~80x24px) showing engagement trend. Rendered as SVG path. Green stroke for upward, muted gray for flat, red for declining.

**Probability indicator**: A small bar or signal-strength icon with a text label ("HIGH," "MID," "LOW"). HIGH = filled green bars, MID = partially filled amber, LOW = mostly empty red.

**Last Action / Date**: Right-aligned, muted text, 13px. Relative dates for recent ("2h ago"), absolute for older ("Sep 12, 2024").

### Bulk Action Bar

Appears as a floating bar at the bottom of the viewport when 1+ rows are selected. Dark background (`#1A1A1E`), white text, rounded corners (12px), slight drop shadow. Contains:

- Selected count: "[n] selected leads"
- Action buttons: "Engage," "Create group," "Download as .CSV," "Delete leads"
- Buttons are pill-shaped with subtle hover states

### View Toggles

A segmented control for switching between List, Board, and Pipeline views. The active segment has a bottom underline (2px, black) rather than a filled background. Icons accompany each label (list icon, grid icon, funnel icon).

### Search & Filter

- Search input: right-aligned, minimal — just an icon and placeholder text, expanding on focus
- Group toggle: a switch control to enable row grouping by a selected column
- Filter button: if present, opens a dropdown/popover for column-specific filtering

---

## Typography

Use a two-font pairing that bridges the archival folder aesthetic with the clean table UI:

| Role | Font | Weight | Size |
|---|---|---|---|
| Folder tab labels | Serif display (e.g. "Instrument Serif," "Playfair Display," or "EB Garamond") | Regular or Italic | 18–22px |
| Page titles | Same serif display | Regular | 28–36px |
| Preview metadata (between folders) | Monospace (e.g. "DM Mono," "JetBrains Mono," "IBM Plex Mono") | Regular | 12–13px |
| Table headers | Sans-serif (e.g. "DM Sans," "Satoshi," "General Sans") | Medium | 11–12px, uppercase |
| Table body text | Same sans-serif | Regular | 14–15px |
| Secondary / muted text | Same sans-serif | Regular | 12–13px |
| KPI values | Same sans-serif | Semibold | 24–28px |

The serif on folder labels and page titles gives warmth and personality. The monospace in preview rows reinforces the archival/index-card feel. The sans in the table keeps things scannable and functional.

---

## Color & Theme

### Background

- Phase 1 (Explorer): Dark. `#111215` or `#0D0D0F`. The folders are the color; the background recedes.
- Phase 2 (Table): Light. `#FFFFFF` content area with a `#FAFAFA` or `#F5F5F3` page background. The transition from dark to light happens during the folder-open animation.

### Accent Inheritance

The opened folder's color becomes the accent for Phase 2. It appears in: the breadcrumb highlight, the selected-row left border, sparkline strokes, and the "+ New Record" button. This creates continuity between the two phases.

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#1A1A1E` | Body text in table |
| `--text-secondary` | `#6B7280` | Muted labels, emails, dates |
| `--text-on-dark` | `#FFFFFF` | Text on folder surfaces |
| `--border` | `#E5E5E5` | Table row dividers, card borders |
| `--surface` | `#FFFFFF` | Card and table backgrounds |
| `--page-bg` | `#F5F5F3` | Page background (Phase 2) |
| `--canvas-dark` | `#111215` | Phase 1 background |
| `--success` | `#16A34A` | Positive trends, closed status |
| `--warning` | `#F59E0B` | Amber indicators |
| `--danger` | `#DC2626` | Negative trends, lost status, delete actions |

---

## Motion Principles

- **Phase 1 is expressive.** Hover lifts, parallax scroll, the folder-open sequence — these should feel tactile and slightly dramatic.
- **Phase 2 is restrained.** Table interactions use quick, functional transitions: 150ms fades for hover states, 200ms slide for the bulk action bar, 100ms for sort-arrow rotation.
- **The transition bridges both.** It's the one moment where the UI gets theatrical. Make it count, then get out of the way.

Easing: Use `cubic-bezier(0.22, 1, 0.36, 1)` for the folder open/close. Use `ease-out` for micro-interactions in the table.

---

## Spacing & Grid

- Page-level horizontal padding: 24–32px (desktop), 16px (mobile)
- Folder stack gap: 16–20px vertical offset between tabs
- Summary card row: 16px gap between cards, cards are equal-width flex children
- Table cell padding: 12–16px horizontal, vertically centered
- Bulk action bar: 16px internal padding, 24px from viewport bottom

---

## Iconography

Use a consistent line-icon set (Lucide, Phosphor, or similar). 20px default, 1.5px stroke.

Key icons: search (magnifying glass), add (plus in circle), external link (arrow-northeast), sort (chevron up/down), checkbox (square / checked square), list view, board view, pipeline/funnel, more options (three dots), download, trash.

---

## Accessibility

- Folder tabs are keyboard-navigable (arrow keys to move between tabs, Enter/Space to open)
- Focus rings are visible on all interactive elements — 2px offset, using the folder accent color
- Table rows support keyboard selection (Space to toggle checkbox, Shift+arrow for range)
- Status badges use icon or pattern in addition to color for colorblind users
- Minimum contrast: 4.5:1 for body text, 3:1 for large text and icons
- The bulk action bar is announced to screen readers when it appears

---

## Implementation Notes

- Render folder tabs as a scrollable flex column with `position: sticky` on the top nav
- Use CSS `clip-path` or SVG for the folder-tab silhouette shape (the notched handle)
- The transition can be orchestrated with CSS `@keyframes` or a library like Framer Motion / GSAP
- Table virtualization (e.g. TanStack Virtual) is recommended if datasets exceed ~200 rows
- Sparklines can be lightweight inline SVGs — no charting library needed
- The folder color should be stored as a data attribute on each category, consumed as a CSS custom property for accent inheritance
