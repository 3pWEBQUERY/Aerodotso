"use client";

import { Pencil, Check, PanelRight, Star } from "lucide-react";

interface Scratch {
  id: string;
  title: string;
  data?: any;
  thumbnail?: string | null;
  folder_id?: string | null;
  is_starred?: boolean;
  created_at: string;
}

interface ScratchCardProps {
  scratch: Scratch;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onClick: () => void;
  onOpenInPanel?: () => void;
}

export function ScratchCard({
  scratch,
  isSelected,
  onSelect,
  onClick,
  onOpenInPanel,
}: ScratchCardProps) {
  const title = scratch.title || "Untitled Scratch";

  return (
    <div
      className={`
        group relative rounded-2xl bg-white hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden
        shadow-sm border border-gray-100 h-56 flex flex-col
        ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
      `}
      onClick={onClick}
    >
      {/* Thumbnail background */}
      {scratch.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={scratch.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
        />
      )}

      {/* Open in panel button */}
      {onOpenInPanel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInPanel();
          }}
          className="absolute top-3 left-3 p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title="Open in side panel"
        >
          <PanelRight className="h-3.5 w-3.5 text-gray-600" />
        </button>
      )}

      {/* Star badge */}
      {scratch.is_starred && (
        <div className="absolute top-3 right-10 z-20">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        </div>
      )}

      {/* Selection checkbox */}
      <div
        className={`
          absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center z-20 transition-all cursor-pointer
          ${isSelected
            ? "bg-blue-500 border-blue-500"
            : "border-gray-300 bg-white opacity-0 group-hover:opacity-100"
          }
        `}
        onClick={onSelect}
      >
        {isSelected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Content area with drawing icon */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {!scratch.thumbnail && (
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <Pencil className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Footer with icon badge and title */}
      <div className="relative z-10 px-4 py-2.5 mt-auto border-t border-gray-50 bg-white/80 backdrop-blur-sm">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100/80 rounded-md max-w-full">
          <Pencil className="h-3 w-3 text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-700 truncate">{title}</span>
        </div>
      </div>
    </div>
  );
}
