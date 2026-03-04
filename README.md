# RecallPlate

The weather app for food safety. RecallPlate combines FDA and USDA food recall data into a single, clean, searchable dashboard.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Database**: PostgreSQL via Prisma 7
- **Charts**: Recharts + react-simple-maps
- **Animations**: Framer Motion
- **AI Summaries**: Anthropic Claude SDK

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase, Neon, or local)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd recallplate

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in all values in .env.local (see below)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for all required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENFDA_API_KEY` | openFDA API key (free) |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI summaries |
| `NEXT_PUBLIC_BASE_URL` | Public URL (e.g., `http://localhost:3000`) |
| `CRON_SECRET` | Secret token for ETL cron trigger |

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run database migrations
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in Vercel
3. Add all environment variables from `.env.example`
4. Deploy

The daily ETL cron job is configured in `vercel.json` and runs at 11:00 UTC.

## Data Sources

- [FDA openFDA API](https://open.fda.gov/) -- Food and animal feed recalls
- [USDA FSIS](https://www.fsis.usda.gov/recalls) -- Meat, poultry, and egg product recalls
