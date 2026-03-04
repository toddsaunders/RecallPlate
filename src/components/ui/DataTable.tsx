"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnDef<T> {
  id: string;
  header: string;
  /** Accessor function to get the cell value from a row. */
  accessor: (row: T) => React.ReactNode;
  /** If provided, the column is sortable. Returns a comparable value. */
  sortValue?: (row: T) => string | number | Date;
  /** Column width hint as CSS value. */
  width?: string;
  /** Right-align column content (useful for numbers). */
  align?: "left" | "center" | "right";
  /** Hide this column on mobile. */
  hideOnMobile?: boolean;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Unique key accessor for each row. */
  getRowId: (row: T) => string;
  /** Current sort state. */
  sort?: SortState | null;
  onSort?: (sort: SortState) => void;
  /** Currently selected row IDs. */
  selectedIds?: Set<string>;
  onSelect?: (ids: Set<string>) => void;
  /** Pagination. */
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  /** Accent color for selected row left border. */
  accentColor?: string;
  /** Show loading skeleton. */
  loading?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Sort Icon
// ---------------------------------------------------------------------------

function SortIcon({ direction }: { direction?: SortDirection }) {
  if (!direction) {
    return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />;
  }
  return direction === "asc" ? (
    <ChevronUp className="h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5" />
  );
}

// ---------------------------------------------------------------------------
// Skeleton Row
// ---------------------------------------------------------------------------

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className="border-b border-[#F0F0F0]">
      <td className="px-[var(--spacing-cell-x)] py-4">
        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
      </td>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-[var(--spacing-cell-x)] py-4">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Mobile Card
// ---------------------------------------------------------------------------

function MobileCard<T>({
  row,
  columns,
  rowId,
  selected,
  onToggle,
  accentColor,
}: {
  row: T;
  columns: ColumnDef<T>[];
  rowId: string;
  selected: boolean;
  onToggle: () => void;
  accentColor?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border bg-surface p-4",
        selected ? "border-l-[3px]" : "border-border"
      )}
      style={selected ? { borderLeftColor: accentColor || "var(--color-folder-blue)" } : undefined}
    >
      <div className="mb-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-border"
          aria-label={`Select row ${rowId}`}
        />
      </div>
      <dl className="space-y-2">
        {columns.map((col) => (
          <div key={col.id} className="flex items-start justify-between gap-2">
            <dt className="text-table-header shrink-0">{col.header}</dt>
            <dd className="text-right text-sm">{col.accessor(row)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export function DataTable<T>({
  columns,
  data,
  getRowId,
  sort,
  onSort,
  selectedIds,
  onSelect,
  pagination,
  onPageChange,
  accentColor,
  loading = false,
  className,
}: DataTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const selected = selectedIds ?? internalSelected;
  const setSelected = onSelect ?? setInternalSelected;

  const allSelected = useMemo(
    () => data.length > 0 && data.every((row) => selected.has(getRowId(row))),
    [data, selected, getRowId]
  );

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map(getRowId)));
    }
  }, [allSelected, data, getRowId, setSelected]);

  const toggleRow = useCallback(
    (id: string) => {
      const next = new Set(selected);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setSelected(next);
    },
    [selected, setSelected]
  );

  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSort) return;
      if (sort?.columnId === columnId) {
        onSort({
          columnId,
          direction: sort.direction === "asc" ? "desc" : "asc",
        });
      } else {
        onSort({ columnId, direction: "asc" });
      }
    },
    [onSort, sort]
  );

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {/* Checkbox column */}
              <th className="w-12 px-[var(--spacing-cell-x)] py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border"
                  aria-label="Select all rows"
                />
              </th>
              {columns.map((col) => {
                const isSortable = !!col.sortValue;
                const isSorted = sort?.columnId === col.id;
                return (
                  <th
                    key={col.id}
                    className={cn(
                      "text-table-header px-[var(--spacing-cell-x)] py-3",
                      col.align === "right" ? "text-right" : "text-left",
                      isSortable && "cursor-pointer select-none",
                      col.hideOnMobile && "hidden md:table-cell"
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={isSortable ? () => handleSort(col.id) : undefined}
                    aria-sort={
                      isSorted
                        ? sort!.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isSortable && (
                        <SortIcon direction={isSorted ? sort!.direction : undefined} />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} colCount={columns.length} />
                ))
              : data.map((row) => {
                  const id = getRowId(row);
                  const isSelected = selected.has(id);
                  return (
                    <tr
                      key={id}
                      className={cn(
                        "border-b border-[#F0F0F0] transition-colors duration-[var(--duration-micro)]",
                        "hover:bg-[#FAFAF8]",
                        isSelected && "border-l-[3px]"
                      )}
                      style={
                        isSelected
                          ? { borderLeftColor: accentColor || "var(--color-folder-blue)" }
                          : undefined
                      }
                    >
                      <td className="px-[var(--spacing-cell-x)] py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="h-4 w-4 rounded border-border"
                          aria-label={`Select row ${id}`}
                        />
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={cn(
                            "px-[var(--spacing-cell-x)] py-3 text-table-body",
                            col.align === "right" && "text-right",
                            col.hideOnMobile && "hidden md:table-cell"
                          )}
                        >
                          {col.accessor(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-[var(--radius-md)] bg-gray-100"
              />
            ))
          : data.map((row) => {
              const id = getRowId(row);
              return (
                <MobileCard
                  key={id}
                  row={row}
                  columns={columns}
                  rowId={id}
                  selected={selected.has(id)}
                  onToggle={() => toggleRow(id)}
                  accentColor={accentColor}
                />
              );
            })}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border px-1 pt-4">
          <span className="text-secondary-label">
            Page {pagination.page} of {totalPages} ({pagination.total} results)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className={cn(
                "flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm",
                "transition-colors duration-[var(--duration-micro)]",
                "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              disabled={pagination.page >= totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className={cn(
                "flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm",
                "transition-colors duration-[var(--duration-micro)]",
                "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              )}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
