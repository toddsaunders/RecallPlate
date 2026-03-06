"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Single-select props
// ---------------------------------------------------------------------------

interface SingleSelectProps {
  multiple?: false;
  value: string | null;
  onChange: (value: string | null) => void;
  values?: never;
  onValuesChange?: never;
}

// ---------------------------------------------------------------------------
// Multi-select props
// ---------------------------------------------------------------------------

interface MultiSelectProps {
  multiple: true;
  values: string[];
  onValuesChange: (values: string[]) => void;
  value?: never;
  onChange?: never;
}

// ---------------------------------------------------------------------------
// Common props
// ---------------------------------------------------------------------------

type FilterDropdownProps = (SingleSelectProps | MultiSelectProps) & {
  options: FilterOption[];
  placeholder: string;
  ariaLabel: string;
  className?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterDropdown(props: FilterDropdownProps) {
  const { options, placeholder, ariaLabel, className } = props;
  const isMulti = props.multiple === true;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // --- Helpers for both modes ---
  const isSelected = useCallback(
    (optionValue: string) => {
      if (isMulti) return (props as MultiSelectProps).values.includes(optionValue);
      return (props as SingleSelectProps).value === optionValue;
    },
    [isMulti, isMulti ? (props as MultiSelectProps).values : (props as SingleSelectProps).value]
  );

  const hasValue = isMulti
    ? (props as MultiSelectProps).values.length > 0
    : (props as SingleSelectProps).value !== null;

  // Trigger label
  let triggerLabel = placeholder;
  let triggerIcon: React.ReactNode = null;
  if (isMulti) {
    const vals = (props as MultiSelectProps).values;
    if (vals.length === 1) {
      const opt = options.find((o) => o.value === vals[0]);
      triggerLabel = opt?.label ?? placeholder;
      triggerIcon = opt?.icon ?? null;
    } else if (vals.length > 1) {
      triggerLabel = `${vals.length} selected`;
    }
  } else {
    const opt = options.find((o) => o.value === (props as SingleSelectProps).value);
    if (opt) {
      triggerLabel = opt.label;
      triggerIcon = opt.icon ?? null;
    }
  }

  // Select handler
  const handleSelect = useCallback(
    (optionValue: string) => {
      if (isMulti) {
        const mp = props as MultiSelectProps;
        if (mp.values.includes(optionValue)) {
          mp.onValuesChange(mp.values.filter((v) => v !== optionValue));
        } else {
          mp.onValuesChange([...mp.values, optionValue]);
        }
      } else {
        const sp = props as SingleSelectProps;
        sp.onChange(optionValue === sp.value ? null : optionValue);
        setOpen(false);
      }
    },
    [isMulti, props]
  );

  // Clear handler
  const handleClear = useCallback(() => {
    if (isMulti) {
      (props as MultiSelectProps).onValuesChange([]);
    } else {
      (props as SingleSelectProps).onChange(null);
    }
    setOpen(false);
  }, [isMulti, props]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-xs font-medium",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-folder-blue/30",
          open
            ? "border-text-secondary/30 shadow-sm"
            : "border-border hover:border-text-secondary/30 hover:shadow-sm",
          hasValue ? "text-text-primary" : "text-text-secondary"
        )}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {triggerIcon && (
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-text-secondary">
            {triggerIcon}
          </span>
        )}
        <span className="max-w-[140px] truncate">{triggerLabel}</span>
        <ChevronsUpDown
          className={cn(
            "h-3 w-3 shrink-0 text-text-secondary transition-transform duration-150",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-xl bg-surface py-1 shadow-lg ring-1 ring-black/[0.06]"
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable={isMulti}
        >
          {/* All / clear option */}
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors duration-75",
              !hasValue
                ? "bg-border/30 font-medium text-text-primary"
                : "text-text-secondary hover:bg-border/30 hover:text-text-primary"
            )}
            role="option"
            aria-selected={!hasValue}
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {!hasValue && <Check className="h-3.5 w-3.5" />}
            </span>
            {placeholder}
          </button>

          {/* Divider */}
          <div className="mx-3 my-1 border-t border-border" />

          {/* Options */}
          <div className="max-h-[280px] overflow-y-auto overscroll-contain">
            {options.map((option) => {
              const selected = isSelected(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors duration-75",
                    selected
                      ? "bg-border/30 font-medium text-text-primary"
                      : "text-text-primary hover:bg-border/30"
                  )}
                  role="option"
                  aria-selected={selected}
                >
                  {option.icon ? (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-text-secondary">
                      {option.icon}
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.icon && selected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
