import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecallDetailClient } from "./RecallDetailClient";
import { MOCK_RECALLS } from "@/lib/mock-data";
import type { RecallEventSerialized } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RecallDetailPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Data fetching (server-side)
// ---------------------------------------------------------------------------

async function getRecall(id: string): Promise<RecallEventSerialized | null> {
  // When the API is ready, this will use:
  //   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  //   const res = await fetch(`${baseUrl}/api/recalls/${id}`, { next: { revalidate: 300 } });
  //   if (!res.ok) return null;
  //   return res.json();

  // For now, use mock data
  return MOCK_RECALLS.find((r) => r.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// SEO: generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: RecallDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const recall = await getRecall(id);

  if (!recall) {
    return {
      title: "Recall Not Found - RecallPlate",
    };
  }

  const title = `${recall.productDescription} Recall - RecallPlate`;
  const description =
    recall.aiSummary ||
    `Class ${recall.classification} ${recall.source} food recall: ${recall.productDescription} by ${recall.recallingFirm}. ${recall.reasonCategory}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/recall/${recall.id}`,
    },
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${recall.productDescription} Recall`,
        description,
        datePublished: recall.reportDate,
        dateModified: recall.updatedAt,
        author: {
          "@type": "Organization",
          name: recall.source === "FDA" ? "U.S. Food and Drug Administration" : "U.S. Department of Agriculture",
        },
        publisher: {
          "@type": "Organization",
          name: "RecallPlate",
          url: "https://recallplate.com",
        },
      }),
    },
    alternates: {
      canonical: `/recall/${recall.id}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function RecallDetailPage({
  params,
}: RecallDetailPageProps) {
  const { id } = await params;
  const recall = await getRecall(id);

  if (!recall) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${recall.productDescription} Recall`,
            description:
              recall.aiSummary ||
              `Class ${recall.classification} ${recall.source} food recall by ${recall.recallingFirm}.`,
            datePublished: recall.reportDate,
            dateModified: recall.updatedAt,
            author: {
              "@type": "Organization",
              name:
                recall.source === "FDA"
                  ? "U.S. Food and Drug Administration"
                  : "U.S. Department of Agriculture",
            },
            publisher: {
              "@type": "Organization",
              name: "RecallPlate",
              url: "https://recallplate.com",
            },
          }),
        }}
      />
      <RecallDetailClient recall={recall} />
    </>
  );
}
