import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "RecallPlate — Food Safety Dashboard",
  description:
    "RecallPlate combines FDA and USDA food recall data into a single, clean, searchable dashboard. The weather app for food safety.",
  keywords: [
    "food recall",
    "FDA recall",
    "USDA recall",
    "food safety",
    "recall search",
    "food contamination",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="flex min-h-dvh flex-col">
        {/* Skip to content link (accessibility) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-canvas-dark focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-on-dark focus:shadow-lg"
        >
          Skip to main content
        </a>

        <SiteHeader />

        <div id="main-content" className="flex-1">
          {children}
        </div>

        <SiteFooter />
      </body>
    </html>
  );
}
