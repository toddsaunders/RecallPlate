"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SummaryCardData {
  label: string;
  value: string | number;
  change?: number;
  sparklineData?: number[];
  accentColor?: string;
}

interface SummaryCardsProps {
  cards: SummaryCardData[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline Sparkline SVG
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color = "var(--color-text-secondary)",
  width = 48,
  height = 20,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Trend Badge
// ---------------------------------------------------------------------------

function TrendBadge({ change }: { change: number }) {
  const isPositive = change > 0;
  const isZero = change === 0;

  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isZero
    ? "text-text-secondary bg-gray-100"
    : isPositive
      ? "text-danger bg-red-50"
      : "text-success bg-green-50";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colorClass
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>
        {isPositive ? "+" : ""}
        {change}%
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary Cards
// ---------------------------------------------------------------------------

export function SummaryCards({ cards, className }: SummaryCardsProps) {
  return (
    <div
      className={cn(
        "grid gap-[var(--spacing-card-gap)]",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-none",
        className
      )}
      style={{
        /* On large screens: equal-width flex children matching the card count */
        gridTemplateColumns: undefined,
      }}
    >
      <div className="hidden lg:flex lg:gap-[var(--spacing-card-gap)]">
        {cards.map((card) => (
          <SummaryCard key={card.label} card={card} />
        ))}
      </div>
      {/* Mobile / tablet grid */}
      <div className="contents lg:hidden">
        {cards.map((card) => (
          <SummaryCard key={card.label} card={card} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ card }: { card: SummaryCardData }) {
  const accentColor = card.accentColor || "var(--color-text-secondary)";

  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4",
        "shadow-[var(--shadow-card)]"
      )}
    >
      <span className="text-secondary-label">{card.label}</span>

      <div className="flex items-end justify-between gap-3">
        <span className="text-kpi-value text-text-primary">{card.value}</span>

        <div className="flex flex-col items-end gap-1.5">
          {card.change !== undefined && <TrendBadge change={card.change} />}
          {card.sparklineData && card.sparklineData.length > 1 && (
            <Sparkline data={card.sparklineData} color={accentColor} />
          )}
        </div>
      </div>
    </div>
  );
}
