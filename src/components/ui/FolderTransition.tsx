"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { FolderExplorer, type FolderData } from "./FolderExplorer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FolderTransitionProps {
  folders: FolderData[];
  /** Render the table/detail content once a folder is open. */
  children: (folder: FolderData) => React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const EASING = [0.22, 1, 0.36, 1] as const;

function useFolderVariants(prefersReduced: boolean | null) {
  return useMemo(() => {
    if (prefersReduced) {
      return {
        explorer: { opacity: 1 },
        exitExplorer: { opacity: 0 },
        table: { opacity: 1 },
        exitTable: { opacity: 0 },
      };
    }
    return {
      explorer: { opacity: 1, scale: 1, rotateX: 0 },
      exitExplorer: {
        opacity: 0,
        scale: 1.02,
        rotateX: -5,
        transition: { duration: 0.4, ease: EASING },
      },
      table: {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        transition: { duration: 0.5, ease: EASING },
      },
      exitTable: {
        opacity: 0,
        scale: 0.96,
        rotateX: 5,
        transition: { duration: 0.4, ease: EASING },
      },
    };
  }, [prefersReduced]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FolderTransition({ folders, children, className }: FolderTransitionProps) {
  const prefersReduced = useReducedMotion();
  const variants = useFolderVariants(prefersReduced);
  const [openFolder, setOpenFolder] = useState<FolderData | null>(null);

  const handleOpen = useCallback((folder: FolderData) => {
    setOpenFolder(folder);
  }, []);

  const handleClose = useCallback(() => {
    setOpenFolder(null);
  }, []);

  // Escape key to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && openFolder) {
        handleClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openFolder, handleClose]);

  return (
    <div
      className={cn("relative min-h-screen overflow-hidden", className)}
      style={{ perspective: prefersReduced ? undefined : "1200px" }}
    >
      <AnimatePresence mode="wait">
        {openFolder === null ? (
          /* Phase 1: Folder Explorer */
          <motion.div
            key="explorer"
            initial={false}
            animate={variants.explorer}
            exit={variants.exitExplorer}
            className="bg-canvas-dark min-h-screen"
          >
            <FolderExplorer folders={folders} onFolderClick={handleOpen} />
          </motion.div>
        ) : (
          /* Phase 2: Data Table */
          <motion.div
            key={`table-${openFolder.id}`}
            initial={variants.exitTable}
            animate={variants.table}
            exit={variants.exitTable}
            className="min-h-screen bg-page-bg"
          >
            {/* Breadcrumb / Back */}
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface px-[var(--spacing-page-x-mobile)] py-3 sm:px-[var(--spacing-page-x)]">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-text-secondary",
                  "transition-colors duration-[var(--duration-micro)]",
                  "hover:bg-gray-100 hover:text-text-primary"
                )}
                aria-label="Back to folder explorer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>All Categories</span>
              </button>
              <span className="text-text-secondary">/</span>
              <span
                className="text-sm font-medium"
                style={{ color: openFolder.color }}
              >
                {openFolder.label}
              </span>
            </div>

            {/* Content */}
            <div className="px-[var(--spacing-page-x-mobile)] py-6 sm:px-[var(--spacing-page-x)]">
              {children(openFolder)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
