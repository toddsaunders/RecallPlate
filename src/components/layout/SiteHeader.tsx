"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, LayoutDashboard, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/alerts", label: "Alerts", icon: Bell },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-[var(--spacing-page-x-mobile)] py-3 sm:px-[var(--spacing-page-x)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <h1 className="font-display text-2xl text-text-primary">
            RecallPlate
          </h1>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                  "transition-colors duration-[var(--duration-micro)]",
                  active
                    ? "bg-canvas-dark text-text-on-dark"
                    : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-gray-100 hover:text-text-primary sm:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-border bg-surface px-[var(--spacing-page-x-mobile)] py-3 sm:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm",
                      "transition-colors duration-[var(--duration-micro)]",
                      active
                        ? "bg-canvas-dark text-text-on-dark"
                        : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
