"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface USMapProps {
  /** Map of state abbreviation or name to recall count. */
  data: Record<string, number>;
  /** States to highlight (e.g., for a specific recall's distribution). */
  highlightedStates?: string[];
  /** "full" for dashboard, "mini" for detail page inset. */
  size?: "full" | "mini";
  /** Click handler for a state. */
  onStateClick?: (stateId: string, stateName: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// TopoJSON URL (US atlas)
// ---------------------------------------------------------------------------

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// ---------------------------------------------------------------------------
// Color scale — light to dark based on count
// ---------------------------------------------------------------------------

const COLOR_STOPS = [
  "#F5F5F3", // 0 — page bg (no recalls)
  "#E3F2FD", // low
  "#90CAF9", // medium-low
  "#42A5F5", // medium
  "#1E88E5", // medium-high
  "#1565C0", // high
  "#0D47A1", // very high
];

function getColor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return COLOR_STOPS[0];
  const ratio = count / maxCount;
  const index = Math.min(
    Math.floor(ratio * (COLOR_STOPS.length - 1)) + 1,
    COLOR_STOPS.length - 1
  );
  return COLOR_STOPS[index];
}

const HIGHLIGHT_COLOR = "#F28C28";

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface TooltipData {
  name: string;
  count: number;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function USMap({
  data,
  highlightedStates,
  size = "full",
  onStateClick,
  className,
}: USMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const maxCount = useMemo(() => {
    const values = Object.values(data);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [data]);

  const highlightSet = useMemo(
    () => new Set(highlightedStates?.map((s) => s.toUpperCase()) ?? []),
    [highlightedStates]
  );

  const handleMouseEnter = useCallback(
    (geo: { properties: { name: string } }, event: React.MouseEvent) => {
      const name = geo.properties.name;
      const count = data[name] ?? data[name.toUpperCase()] ?? 0;
      setTooltip({ name, count, x: event.clientX, y: event.clientY });
    },
    [data]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const isMini = size === "mini";
  const width = isMini ? 300 : 800;
  const height = isMini ? 200 : 500;

  return (
    <div
      className={cn("relative", className)}
      aria-label={`US map showing recall distribution across states. Maximum count: ${maxCount}.`}
      role="img"
    >
      <ComposableMap
        projection="geoAlbersUsa"
        width={width}
        height={height}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName: string = geo.properties.name;
                const count = data[stateName] ?? data[stateName.toUpperCase()] ?? 0;
                const isHighlighted = highlightSet.has(stateName.toUpperCase());

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHighlighted ? HIGHLIGHT_COLOR : getColor(count, maxCount)}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: isHighlighted ? "#E67E22" : "#90CAF9",
                        outline: "none",
                        cursor: onStateClick ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(event) =>
                      handleMouseEnter(geo, event as unknown as React.MouseEvent)
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={() => onStateClick?.(geo.id as string, stateName)}
                    aria-label={`${stateName}: ${count} recall${count !== 1 ? "s" : ""}`}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-canvas-dark px-3 py-2 text-sm text-text-on-dark shadow-lg"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 28,
          }}
        >
          <span className="font-medium">{tooltip.name}</span>
          <span className="ml-2 text-text-on-dark/70">
            {tooltip.count} recall{tooltip.count !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Legend */}
      {!isMini && (
        <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
          <span>Fewer</span>
          <div className="flex h-3 overflow-hidden rounded">
            {COLOR_STOPS.slice(1).map((color, i) => (
              <div key={i} className="h-full w-5" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span>More</span>
        </div>
      )}
    </div>
  );
}
