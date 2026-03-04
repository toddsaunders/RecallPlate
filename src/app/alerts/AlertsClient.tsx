"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  AlertCircle,
  Mail,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { US_STATES, PRODUCT_CATEGORIES } from "@/lib/constants";
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

export function AlertsClient() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation state
  const [emailTouched, setEmailTouched] = useState(false);
  const [stateTouched, setStateTouched] = useState(false);

  const emailError = emailTouched && !isValidEmail(email) ? "Please enter a valid email address." : null;
  const stateError = stateTouched && !state ? "Please select a state." : null;

  const isFormValid = isValidEmail(email) && !!state;

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEmailTouched(true);
      setStateTouched(true);

      if (!isFormValid) return;

      setSubmitting(true);
      setError(null);

      try {
        await subscribeToAlerts({
          email,
          state,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        });
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
    [email, state, selectedCategories, isFormValid]
  );

  return (
    <div className="min-h-screen bg-page-bg">
      <main className="mx-auto max-w-3xl px-[var(--spacing-page-x-mobile)] py-8 sm:px-[var(--spacing-page-x)]">
        {success ? (
          /* Success state */
          <div className="rounded-[var(--radius-lg)] border border-success/20 bg-status-completed-bg p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-text-primary">
              You are subscribed!
            </h2>
            <p className="mb-6 text-sm text-text-secondary">
              We will send you email alerts when new food recalls match your
              preferences. You can unsubscribe at any time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-canvas-dark px-5 py-2.5 text-sm font-medium text-text-on-dark"
              >
                Back to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                  setState("");
                  setSelectedCategories([]);
                  setEmailTouched(false);
                  setStateTouched(false);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary"
              >
                Subscribe another email
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-folder-blue/10">
                <Bell className="h-7 w-7 text-folder-blue" />
              </div>
              <h2 className="text-page-title mb-2">Get Recall Alerts</h2>
              <p className="text-sm text-text-secondary">
                Receive email notifications when new food recalls are reported
                in your state. Stay informed about the products that matter to
                you.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              {/* Error banner */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-md bg-severity-i-bg px-4 py-3 text-sm text-severity-i">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="mb-5">
                <label
                  htmlFor="alert-email"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <input
                    id="alert-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="you@example.com"
                    required
                    className={cn(
                      "w-full rounded-md border bg-page-bg py-2.5 pl-10 pr-4 text-sm text-text-primary",
                      "placeholder:text-text-secondary/60",
                      "focus:outline-none focus:ring-2 focus:ring-folder-blue/30",
                      emailError ? "border-danger" : "border-border"
                    )}
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-danger">{emailError}</p>
                )}
              </div>

              {/* State */}
              <div className="mb-5">
                <label
                  htmlFor="alert-state"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Your state
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <select
                    id="alert-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    onBlur={() => setStateTouched(true)}
                    required
                    className={cn(
                      "w-full appearance-none rounded-md border bg-page-bg py-2.5 pl-10 pr-8 text-sm text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-folder-blue/30",
                      stateError ? "border-danger" : "border-border",
                      !state && "text-text-secondary/60"
                    )}
                  >
                    <option value="" disabled>
                      Select your state
                    </option>
                    {US_STATES.map((st) => (
                      <option key={st.abbreviation} value={st.abbreviation}>
                        {st.name} ({st.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                {stateError && (
                  <p className="mt-1 text-xs text-danger">{stateError}</p>
                )}
              </div>

              {/* Categories (optional) */}
              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Product categories{" "}
                  <span className="font-normal text-text-secondary">
                    (optional - leave blank for all)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                        "transition-colors duration-[var(--duration-micro)]",
                        selectedCategories.includes(cat)
                          ? "border-folder-teal bg-folder-teal/5 text-folder-teal"
                          : "border-border text-text-secondary hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      <span className="text-xs">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg bg-canvas-dark py-3 text-sm font-medium text-text-on-dark",
                  "transition-colors duration-[var(--duration-micro)]",
                  "hover:bg-canvas-dark/90",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-on-dark/30 border-t-text-on-dark" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Subscribe to Alerts
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
