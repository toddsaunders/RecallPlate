"use client";

import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SEVERITY_LABELS, CATEGORY_FOLDER_COLORS } from "@/lib/constants";
import type { RecallClassification, RecallSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------

interface SeverityBadgeProps {
  classification: RecallClassification;
  className?: string;
}

const SEVERITY_CONFIG: Record<
  RecallClassification,
  { bg: string; text: string; icon: React.ElementType }
> = {
  I: { bg: "bg-severity-i-bg", text: "text-severity-i", icon: AlertTriangle },
  II: { bg: "bg-severity-ii-bg", text: "text-severity-ii", icon: AlertCircle },
  III: { bg: "bg-severity-iii-bg", text: "text-severity-iii", icon: Info },
};

export function SeverityBadge({ classification, className }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[classification];
  const Icon = config.icon;
  const label = SEVERITY_LABELS[classification] || `Class ${classification}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
      role="status"
      aria-label={`Class ${classification}: ${label}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Source Badge
// ---------------------------------------------------------------------------

interface SourceBadgeProps {
  source: RecallSource;
  className?: string;
}

const SOURCE_CONFIG: Record<RecallSource, { bg: string; text: string; icon: React.ElementType }> = {
  FDA: { bg: "bg-source-fda-bg", text: "text-source-fda", icon: ShieldCheck },
  USDA: { bg: "bg-source-usda-bg", text: "text-source-usda", icon: Leaf },
};

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{source}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category Badge
// ---------------------------------------------------------------------------

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const color = CATEGORY_FOLDER_COLORS[category] || "#6B7280";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span>{category}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Reason Badge
// ---------------------------------------------------------------------------

interface ReasonBadgeProps {
  reason: string;
  className?: string;
}

const REASON_COLORS: Record<string, string> = {
  "Bacterial Contamination": "#C62828",
  "Undeclared Allergens": "#E65100",
  "Foreign Material": "#6D4C41",
  "Misbranding/Mislabeling": "#7B3FA0",
  "Chemical Contamination": "#AD1457",
  "Processing Defect": "#1565C0",
  Other: "#6B7280",
};

export function ReasonBadge({ reason, className }: ReasonBadgeProps) {
  const color = REASON_COLORS[reason] || "#6B7280";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span>{reason}</span>
    </span>
  );
}
