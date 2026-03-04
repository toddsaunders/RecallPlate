"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import type { CategoryBreakdown as CategoryBreakdownData } from "@/lib/types";
import { ChartTooltip } from "./ChartTooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryBreakdownProps {
  data: CategoryBreakdownData[];
  /** Click handler for a category bar. */
  onCategoryClick?: (category: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryBreakdown({
  data,
  onCategoryClick,
  className,
}: CategoryBreakdownProps) {
  const sortedData = useMemo(
    () =>
      [...data]
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count),
    [data]
  );

  const barHeight = 36;
  const chartHeight = Math.max(sortedData.length * barHeight + 40, 100);

  return (
    <div
      className={cn("w-full", className)}
      aria-label="Category breakdown chart"
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#888" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={140}
            tick={{ fontSize: 12, fill: "var(--color-text-primary)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<ChartTooltip labelOverride={(d) => d.category as string} />}
            cursor={{ fill: "var(--color-page-bg)" }}
          />
          <Bar
            dataKey="count"
            name="Recalls"
            radius={[0, 4, 4, 0]}
            barSize={20}
            animationDuration={500}
            onClick={(_data, index) => {
              if (onCategoryClick && typeof index === "number" && sortedData[index]) {
                onCategoryClick(sortedData[index].category);
              }
            }}
            style={onCategoryClick ? { cursor: "pointer" } : undefined}
          >
            {sortedData.map((entry) => (
              <Cell key={entry.category} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
