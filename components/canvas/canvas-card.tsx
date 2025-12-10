"use client";

import { Check, Star, PanelRight } from "lucide-react";
import Link from "next/link";

interface CanvasCardProps {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  isStarred?: boolean;
  isSelected?: boolean;
  workspaceId: string;
  onSelect?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  onStar?: () => void;
  onOpenInPanel?: () => void;
}

export function CanvasCard({
  id,
  name,
  isStarred = false,
  isSelected = false,
  workspaceId,
  onSelect,
  onDelete,
  onStar,
  onOpenInPanel,
}: CanvasCardProps) {
  return (
    <div className="group relative">
      <Link
        href={`/workspace/${workspaceId}/canvas/${id}`}
        className={`
          block h-56 rounded-[18px] border bg-white
          overflow-hidden transition-all duration-200 cursor-pointer
          relative
          ${isSelected ? "ring-2 ring-emerald-500" : ""}
        `}
      >
        {/* Dot pattern background */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white via-white/80 to-transparent" />

        {/* Selection checkbox */}
        <button
          type="button"
          className={`
            absolute top-3 left-3 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
            ${isSelected
              ? "bg-emerald-600 border-emerald-600 text-white opacity-100"
              : "bg-white/80 border-gray-300 hover:border-emerald-500 opacity-0 group-hover:opacity-100"
            }
          `}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onSelect) {
              onSelect(e);
            }
          }}
        >
          {isSelected && <Check className="h-4 w-4" />}
        </button>

        {/* Star indicator */}
        {isStarred && (
          <div className="absolute top-3 right-3 z-20">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
        )}

        {/* Open in panel button */}
        {onOpenInPanel && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenInPanel();
            }}
            className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
            title="Open in side panel"
          >
            <PanelRight className="h-3.5 w-3.5 text-gray-600" />
          </button>
        )}

        {/* Title Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/30 border border-slate-200 shadow-sm backdrop-blur-sm">
            <div className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white border border-slate-200 text-[11px] leading-none text-slate-500 font-medium">
              ⌘
            </div>
            <span className="text-xs font-medium text-slate-600 truncate max-w-[160px]">
              {name || "Untitled Canvas"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
