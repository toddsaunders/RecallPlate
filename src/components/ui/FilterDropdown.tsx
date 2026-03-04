"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: FilterOption[];
  placeholder: string;
  ariaLabel: string;
  className?: string;
}

export function FilterDropdown({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
}: FilterDropdownProps) {
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

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue === value ? null : optionValue);
      setOpen(false);
    },
    [onChange, value]
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-folder-blue/30",
          open
            ? "border-gray-300 shadow-sm"
            : "border-border hover:border-gray-300 hover:shadow-sm",
          value ? "text-text-primary" : "text-text-secondary"
        )}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="max-w-[140px] truncate">
          {selectedLabel ?? placeholder}
        </span>
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
          className={cn(
            "absolute left-0 z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/[0.06]"
          )}
          role="listbox"
          aria-label={ariaLabel}
        >
          {/* All / clear option */}
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors duration-75",
              !value
                ? "bg-gray-50 font-medium text-text-primary"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            )}
            role="option"
            aria-selected={!value}
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {!value && <Check className="h-3.5 w-3.5" />}
            </span>
            {placeholder}
          </button>

          {/* Divider */}
          <div className="mx-3 my-1 border-t border-gray-100" />

          {/* Options */}
          <div className="max-h-[280px] overflow-y-auto overscroll-contain">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors duration-75",
                    isSelected
                      ? "bg-gray-50 font-medium text-text-primary"
                      : "text-text-primary hover:bg-gray-50"
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
