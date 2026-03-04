"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import type { TimelineDataPoint } from "@/lib/types";
import { ChartTooltip } from "./ChartTooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineChartProps {
  data: TimelineDataPoint[];
  /** Filter by classification. If not set, shows total count. */
  filter?: "all" | "I" | "II" | "III";
  onFilterChange?: (filter: "all" | "I" | "II" | "III") => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Filter Buttons
// ---------------------------------------------------------------------------

const FILTERS = [
  { value: "all" as const, label: "All" },
  { value: "I" as const, label: "Class I" },
  { value: "II" as const, label: "Class II" },
  { value: "III" as const, label: "Class III" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelineChart({
  data,
  filter = "all",
  onFilterChange,
  className,
}: TimelineChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayCount:
        filter === "all"
          ? d.count
          : filter === "I"
            ? d.classI
            : filter === "II"
              ? d.classII
              : d.classIII,
    }));
  }, [data, filter]);

  const areaColor =
    filter === "I"
      ? "var(--color-severity-i)"
      : filter === "II"
        ? "var(--color-severity-ii)"
        : filter === "III"
          ? "var(--color-severity-iii)"
          : "var(--color-folder-blue)";

  return (
    <div className={cn("w-full", className)} aria-label="Recall timeline chart">
      {/* Filter controls */}
      {onFilterChange && (
        <div className="mb-4 flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-[var(--duration-micro)]",
                filter === f.value
                  ? "bg-canvas-dark text-text-on-dark"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={areaColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border)"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#888" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#888" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<ChartTooltip countKey="displayCount" />}
          />
          <Area
            type="monotone"
            dataKey="displayCount"
            name="Recalls"
            stroke={areaColor}
            strokeWidth={2}
            fill="url(#areaGradient)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
