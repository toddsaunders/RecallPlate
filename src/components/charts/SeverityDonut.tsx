"use client";

import { useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { SeverityDistribution } from "@/lib/types";
import { ChartTooltip } from "./ChartTooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeverityDonutProps {
  data: SeverityDistribution[];
  /** Click handler for a severity segment. */
  onSegmentClick?: (classification: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Color map
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  I: "#C62828", // red
  II: "#E65100", // amber/orange
  III: "#1565C0", // blue
};

// ---------------------------------------------------------------------------
// Custom Legend
// ---------------------------------------------------------------------------

interface LegendItemProps {
  classification: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

function DonutLegendItem({ classification, label, count, percentage, color }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-3 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-sm text-text-primary">
        Class {classification}: {label}
      </span>
      <span className="ml-auto text-sm font-medium tabular-nums text-text-primary">
        {count}
      </span>
      <span className="text-xs text-text-secondary tabular-nums">
        ({percentage.toFixed(1)}%)
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SeverityDonut({ data, onSegmentClick, className }: SeverityDonutProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        name: `Class ${d.classification}: ${d.label}`,
        color: SEVERITY_COLORS[d.classification] || "#6B7280",
      })),
    [data]
  );

  const totalCount = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  const handleClick = useCallback(
    (_: unknown, index: number) => {
      if (onSegmentClick && chartData[index]) {
        onSegmentClick(chartData[index].classification);
      }
    },
    [onSegmentClick, chartData]
  );

  if (totalCount === 0) {
    return (
      <div className={cn("flex items-center justify-center py-10 text-text-secondary", className)}>
        No severity data available.
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} aria-label="Severity distribution donut chart">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            animationDuration={500}
            onClick={handleClick}
            style={onSegmentClick ? { cursor: "pointer" } : undefined}
          >
            {chartData.map((entry) => (
              <Cell key={entry.classification} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={<ChartTooltip labelOverride={(d) => `Class ${d.classification}: ${d.label}`} />}
          />
          <Legend content={() => null} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend below chart */}
      <div className="mt-2 flex flex-col gap-2">
        {chartData.map((item) => (
          <DonutLegendItem
            key={item.classification}
            classification={item.classification}
            label={item.label}
            count={item.count}
            percentage={item.percentage}
            color={item.color}
          />
        ))}
      </div>
    </div>
  );
}
