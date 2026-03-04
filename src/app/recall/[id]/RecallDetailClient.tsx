"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  Hash,
  Package,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ABBREVIATION_TO_STATE_NAME } from "@/lib/constants";
import type { RecallEventSerialized, RecallClassification, RecallSource } from "@/lib/types";
import { SeverityBadge, SourceBadge, ReasonBadge, CategoryBadge } from "@/components/ui/Badge";
import { RecallCard, RecallCardSkeleton } from "@/components/cards/RecallCard";
import { USMap } from "@/components/map/USMap";
import { AlertCTA } from "@/components/forms/AlertCTA";
import { fetchRelatedRecalls } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecallDetailClientProps {
  recall: RecallEventSerialized;
}

// ---------------------------------------------------------------------------
// Detail Row
// ---------------------------------------------------------------------------

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-text-primary">{children}</dd>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecallDetailClient({ recall }: RecallDetailClientProps) {
  const [related, setRelated] = useState<RecallEventSerialized[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Fetch related recalls
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchRelatedRecalls(
          recall.id,
          recall.productCategory,
          6
        );
        if (!cancelled) setRelated(data);
      } catch (err) {
        console.error("Failed to load related recalls:", err);
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [recall.id, recall.productCategory]);

  // Build distribution map data
  const distributionMapData: Record<string, { count: number; fdaCount: number; usdaCount: number }> = {};
  if (recall.nationwide) {
    // Highlight all states lightly
  } else {
    for (const abbr of recall.distributionStates) {
      const name = ABBREVIATION_TO_STATE_NAME[abbr];
      if (name) distributionMapData[name] = { count: 1, fdaCount: recall.source === "FDA" ? 1 : 0, usdaCount: recall.source === "USDA" ? 1 : 0 };
    }
  }

  return (
    <div className="min-h-screen bg-page-bg">
      <main className="mx-auto max-w-5xl px-[var(--spacing-page-x-mobile)] py-6 sm:px-[var(--spacing-page-x)]">
        {/* Badges row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SeverityBadge classification={recall.classification as RecallClassification} />
          <SourceBadge source={recall.source as RecallSource} />
          <CategoryBadge category={recall.productCategory} />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              recall.status === "Ongoing"
                ? "bg-status-ongoing-bg text-status-ongoing"
                : recall.status === "Completed"
                  ? "bg-status-completed-bg text-status-completed"
                  : "bg-status-terminated-bg text-status-terminated"
            )}
          >
            {recall.status}
          </span>
        </div>

        {/* Product description (title) */}
        <h1 className="text-page-title mb-6 text-text-primary">
          {recall.productDescription}
        </h1>

        {/* AI Summary */}
        {recall.aiSummary && (
          <section className="mb-6 rounded-[var(--radius-lg)] border border-folder-purple/20 bg-folder-purple/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles
                className="h-4 w-4 text-folder-purple"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-folder-purple">
                AI Summary
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-text-primary">
              {recall.aiSummary}
            </p>
          </section>
        )}

        {/* Details grid */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Details table */}
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Recall Details
            </h2>
            <dl>
              <DetailRow icon={Building2} label="Recalling Firm">
                {recall.recallingFirm}
              </DetailRow>
              {recall.city && recall.state && (
                <DetailRow icon={MapPin} label="Location">
                  {recall.city}, {recall.state}
                </DetailRow>
              )}
              <DetailRow icon={Hash} label="Recall Number">
                <span className="font-mono text-xs">{recall.recallNumber}</span>
              </DetailRow>
              <DetailRow icon={AlertTriangle} label="Classification">
                Class {recall.classification} -{" "}
                {recall.classification === "I"
                  ? "Serious Health Risk"
                  : recall.classification === "II"
                    ? "Remote Health Risk"
                    : "Not Likely Harmful"}
              </DetailRow>
              <DetailRow icon={Package} label="Status">
                {recall.status}
              </DetailRow>
              <DetailRow icon={Calendar} label="Report Date">
                {formatDate(recall.reportDate)}
              </DetailRow>
              {recall.recallInitiationDate && (
                <DetailRow icon={Calendar} label="Initiation Date">
                  {formatDate(recall.recallInitiationDate)}
                </DetailRow>
              )}
              {recall.quantity && (
                <DetailRow icon={Package} label="Quantity">
                  {recall.quantity}
                </DetailRow>
              )}
            </dl>
          </section>

          {/* Right: Reason + Distribution */}
          <div className="flex flex-col gap-6">
            {/* Reason section */}
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">
                Reason for Recall
              </h2>
              <div className="mb-3">
                <ReasonBadge reason={recall.reasonCategory} />
              </div>
              <p className="text-sm leading-relaxed text-text-primary">
                {recall.reason}
              </p>
            </section>

            {/* Distribution section */}
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">
                Distribution
              </h2>
              {recall.nationwide ? (
                <p className="mb-3 text-sm font-medium text-folder-orange">
                  Nationwide Distribution
                </p>
              ) : (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {recall.distributionStates.map((st) => (
                    <span
                      key={st}
                      className="inline-flex rounded-md bg-folder-blue/10 px-2 py-0.5 text-xs font-medium text-folder-blue"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              )}
              <USMap
                data={distributionMapData}
                highlightedStates={
                  recall.nationwide ? undefined : recall.distributionStates
                }
                size="mini"
              />
            </section>
          </div>
        </div>

        {/* External link */}
        {recall.url && (
          <div className="mb-6">
            <a
              href={recall.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary",
                "shadow-[var(--shadow-card)] transition-all duration-[var(--duration-micro)]",
                "hover:shadow-[var(--shadow-card-hover)]"
              )}
            >
              <ExternalLink className="h-4 w-4" />
              View on {recall.source === "FDA" ? "FDA" : "USDA"} Website
            </a>
          </div>
        )}

        {/* Alert CTA */}
        <div className="mb-8">
          <AlertCTA />
        </div>

        {/* Related Recalls */}
        {(loadingRelated || related.length > 0) && (
          <section className="mb-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">
              Related Recalls
            </h2>
            {loadingRelated ? (
              <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <RecallCardSkeleton key={i} />
                ))}
              </div>
            ) : related.length > 0 ? (
              <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <RecallCard key={r.id} recall={r} />
                ))}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}
