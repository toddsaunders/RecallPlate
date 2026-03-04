"use client";

import { useCallback, useState } from "react";
import { Bell, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/lib/constants";
import { subscribeToAlerts } from "@/lib/api";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AlertCTAProps {
  className?: string;
}

export function AlertCTA({ className }: AlertCTAProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isValidEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!state) {
        setError("Please select a state.");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        await subscribeToAlerts({ email, state });
        setSuccess(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, state]
  );

  if (success) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-lg)] border border-success/20 bg-status-completed-bg px-5 py-4",
          className
        )}
      >
        <Check className="h-5 w-5 shrink-0 text-success" />
        <p className="text-sm text-text-primary">
          Subscribed! We will notify you about recalls in your state.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-folder-blue" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text-primary">
          Get notified about recalls in your state
        </h3>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Email */}
        <div className="flex-1">
          <label htmlFor="cta-email" className="sr-only">
            Email address
          </label>
          <input
            id="cta-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="you@example.com"
            required
            className={cn(
              "w-full rounded-md border bg-page-bg px-3 py-2 text-sm text-text-primary",
              "placeholder:text-text-secondary/60",
              "focus:outline-none focus:ring-2 focus:ring-folder-blue/30",
              error ? "border-danger" : "border-border"
            )}
          />
        </div>

        {/* State dropdown */}
        <div className="sm:w-44">
          <label htmlFor="cta-state" className="sr-only">
            State
          </label>
          <select
            id="cta-state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setError(null);
            }}
            required
            className={cn(
              "w-full appearance-none rounded-md border bg-page-bg px-3 py-2 text-sm text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-folder-blue/30",
              error && !state ? "border-danger" : "border-border",
              !state && "text-text-secondary/60"
            )}
          >
            <option value="" disabled>
              Your state
            </option>
            {US_STATES.map((st) => (
              <option key={st.abbreviation} value={st.abbreviation}>
                {st.abbreviation} - {st.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md bg-canvas-dark px-4 py-2 text-sm font-medium text-text-on-dark",
            "transition-colors duration-[var(--duration-micro)]",
            "hover:bg-canvas-dark/90",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "sm:w-auto"
          )}
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-on-dark/30 border-t-text-on-dark" />
          ) : (
            <Bell className="h-3.5 w-3.5" />
          )}
          {submitting ? "..." : "Subscribe"}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
