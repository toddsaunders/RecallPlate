import { Suspense } from "react";
import { SearchClient } from "./SearchClient";

export const metadata = {
  title: "Search Recalls - RecallPlate",
  description:
    "Search FDA and USDA food recalls by product, brand, company, or category. Filter by state, severity, and date range.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-text-primary" />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
