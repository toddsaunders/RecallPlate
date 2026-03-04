"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { cn, formatDate, truncate } from "@/lib/utils";
import { SeverityBadge, SourceBadge, ReasonBadge } from "@/components/ui/Badge";
import type { RecallEventSerialized, RecallClassification, RecallSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecallCardProps {
  recall: RecallEventSerialized;
  className?: string;
}

interface RecallCardSkeletonProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function RecallCardSkeleton({ className }: RecallCardSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] border border-border bg-surface p-5",
        "shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <div className="h-5 w-20 rounded-full bg-gray-200" />
        <div className="h-5 w-14 rounded-full bg-gray-200" />
      </div>
      <div className="mb-2 h-4 w-full rounded bg-gray-200" />
      <div className="mb-4 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mb-3 h-3 w-1/2 rounded bg-gray-100" />
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 rounded-full bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecallCard
// ---------------------------------------------------------------------------

export function RecallCard({ recall, className }: RecallCardProps) {
  return (
    <Link
      href={`/recall/${recall.id}`}
      className={cn(
        "group block rounded-[var(--radius-md)] border border-border bg-surface p-5",
        "shadow-[var(--shadow-card)]",
        "transition-shadow duration-[var(--duration-micro)] ease-out",
        "hover:shadow-[var(--shadow-card-hover)]",
        "focus-visible:ring-2 focus-visible:ring-folder-blue focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Top row: badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SeverityBadge classification={recall.classification as RecallClassification} />
        <SourceBadge source={recall.source as RecallSource} />
      </div>

      {/* Product description (2 line clamp) */}
      <p className="mb-2 text-table-body leading-snug font-medium text-text-primary line-clamp-2">
        {recall.productDescription}
      </p>

      {/* Firm name */}
      <p className="text-secondary-label mb-3">
        {truncate(recall.recallingFirm, 60)}
      </p>

      {/* Bottom row: reason + date */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ReasonBadge reason={recall.reasonCategory} />
        <span className="text-secondary-label inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDate(recall.reportDate)}
        </span>
      </div>
    </Link>
  );
}
