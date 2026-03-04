"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartErrorBoundaryProps {
  children: ReactNode;
  fallbackHeight?: string;
  className?: string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chart rendering error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-border bg-gray-50 p-6 text-center",
            this.props.className
          )}
          style={{ minHeight: this.props.fallbackHeight || "200px" }}
          role="alert"
        >
          <AlertCircle
            className="mb-2 h-6 w-6 text-text-secondary"
            aria-hidden="true"
          />
          <p className="mb-1 text-sm font-medium text-text-primary">
            Chart could not be rendered
          </p>
          <p className="mb-3 text-xs text-text-secondary">
            There was an issue displaying this visualization.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary",
              "transition-colors hover:bg-gray-50"
            )}
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
