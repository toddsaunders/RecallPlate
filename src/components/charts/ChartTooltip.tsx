"use client";

/**
 * Shared custom tooltip for all Recharts charts.
 * Shows: label, total recalls, FDA count, USDA count.
 */
interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    payload: Record<string, unknown>;
  }>;
  /** Which field to use as the total count. Defaults to "count". */
  countKey?: string;
  /** Override the label shown at top. */
  labelOverride?: (payload: Record<string, unknown>) => string;
}

export function ChartTooltip({
  active,
  label,
  payload,
  countKey = "count",
  labelOverride,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const total = (data[countKey] as number) ?? 0;
  const fda = (data.fdaCount as number) ?? 0;
  const usda = (data.usdaCount as number) ?? 0;
  const displayLabel = labelOverride ? labelOverride(data) : label;

  return (
    <div className="min-w-[160px] rounded-lg bg-canvas-dark px-3.5 py-2.5 shadow-lg">
      <p className="mb-1.5 text-sm font-semibold text-text-on-dark">{displayLabel}</p>
      <div className="flex flex-col gap-0.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-on-dark/60">Active Recalls</span>
          <span className="font-medium tabular-nums text-text-on-dark">{total}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-on-dark/60">FDA</span>
          <span className="font-medium tabular-nums text-text-on-dark">{fda}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-on-dark/60">USDA</span>
          <span className="font-medium tabular-nums text-text-on-dark">{usda}</span>
        </div>
      </div>
    </div>
  );
}
