/**
 * RecallPlate — Shared Utilities
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names with conflict resolution.
 *
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @example
 *   cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
 *   // => "py-2 px-6 bg-blue-500" (px-4 is overridden by px-6)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date as a human-readable string.
 *
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string (e.g., "Mar 4, 2026")
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Format a Date as a relative time string (e.g., "2 hours ago", "3 days ago").
 *
 * Falls back to an absolute date for anything older than 30 days.
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatDate(d);
}

/**
 * Truncate a string to a maximum length, adding an ellipsis if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1).trimEnd() + "\u2026";
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sleep for a given number of milliseconds.
 * Useful for rate-limiting in ETL pipelines.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parse a JSON string, returning null on failure.
 */
export function safeJsonParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}
