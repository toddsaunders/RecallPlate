"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FolderData {
  id: string;
  label: string;
  color: string;
  count: number;
  dateRange: string;
  preview: string;
}

interface FolderExplorerProps {
  folders: FolderData[];
  onFolderClick: (folder: FolderData) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Tab handle offset pattern: stagger left / center / right
// ---------------------------------------------------------------------------

const TAB_OFFSETS = ["left", "center", "right"] as const;
type TabOffset = (typeof TAB_OFFSETS)[number];

function getTabOffset(index: number): TabOffset {
  return TAB_OFFSETS[index % TAB_OFFSETS.length];
}

function tabOffsetClass(offset: TabOffset): string {
  switch (offset) {
    case "left":
      return "left-[8%]";
    case "center":
      return "left-[35%]";
    case "right":
      return "left-[62%]";
  }
}

// ---------------------------------------------------------------------------
// Single folder tab
// ---------------------------------------------------------------------------

interface FolderTabProps {
  folder: FolderData;
  index: number;
  focused: boolean;
  onClick: () => void;
  onFocus: () => void;
}

function FolderTab({ folder, index, focused, onClick, onFocus }: FolderTabProps) {
  const offset = getTabOffset(index);

  return (
    <button
      type="button"
      role="tab"
      aria-label={`${folder.label} — ${folder.count} recalls, ${folder.dateRange}`}
      tabIndex={focused ? 0 : -1}
      onClick={onClick}
      onFocus={onFocus}
      className={cn(
        "group relative w-full cursor-pointer border-none bg-transparent p-0 text-left",
        "transition-transform duration-[var(--duration-micro)] ease-out",
        "hover:-translate-y-1 focus-visible:-translate-y-1"
      )}
      style={{ zIndex: index }}
    >
      {/* Tab handle (the protruding label) */}
      <div
        className={cn(
          "absolute -top-7 h-8 rounded-t-lg px-5 py-1",
          "flex items-center gap-2",
          tabOffsetClass(offset)
        )}
        style={{ backgroundColor: folder.color }}
      >
        <span className="text-folder-label text-white whitespace-nowrap">
          {folder.label}
        </span>
      </div>

      {/* Folder body */}
      <div
        className={cn(
          "relative mt-1 rounded-sm px-5 py-4",
          "shadow-[var(--shadow-folder)]",
          "transition-shadow duration-[var(--duration-micro)] ease-out",
          "group-hover:shadow-[var(--shadow-folder-hover)]",
          "group-focus-visible:shadow-[var(--shadow-folder-hover)]"
        )}
        style={{
          backgroundColor: folder.color,
          /* Subtle paper grain overlay */
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      >
        {/* Preview metadata row */}
        <div className="flex items-center gap-4">
          <span className="text-preview text-white/80">
            {folder.count} recall{folder.count !== 1 ? "s" : ""}
          </span>
          <span className="text-preview text-white/50">|</span>
          <span className="text-preview text-white/60">{folder.dateRange}</span>
          <span className="text-preview hidden text-white/60 sm:inline">
            — {folder.preview}
          </span>
        </div>
      </div>

      {/* Mobile: count badge only */}
      <span
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 sm:hidden",
          "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5",
          "bg-white/20 text-xs font-medium text-white"
        )}
      >
        {folder.count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// FolderExplorer
// ---------------------------------------------------------------------------

export function FolderExplorer({ folders, onFolderClick, className }: FolderExplorerProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let nextIndex = focusedIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIndex = Math.min(focusedIndex + 1, folders.length - 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIndex = Math.max(focusedIndex - 1, 0);
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = folders.length - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onFolderClick(folders[focusedIndex]);
          return;
        default:
          return;
      }

      setFocusedIndex(nextIndex);

      // Focus the target tab button
      const container = listRef.current;
      if (container) {
        const buttons = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons[nextIndex]?.focus();
      }
    },
    [focusedIndex, folders, onFolderClick]
  );

  if (folders.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-20 text-text-secondary", className)}>
        <p className="text-preview">No categories available.</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Recall categories"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex flex-col gap-[var(--spacing-folder-gap)] overflow-y-auto pt-8 pb-4",
        "px-[var(--spacing-page-x-mobile)] sm:px-[var(--spacing-page-x)]",
        className
      )}
    >
      {folders.map((folder, i) => (
        <FolderTab
          key={folder.id}
          folder={folder}
          index={i}
          focused={focusedIndex === i}
          onClick={() => onFolderClick(folder)}
          onFocus={() => setFocusedIndex(i)}
        />
      ))}
    </div>
  );
}
