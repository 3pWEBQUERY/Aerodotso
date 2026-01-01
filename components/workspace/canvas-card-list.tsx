"use client";

import { LayoutTemplate, Star, Check } from "lucide-react";
import Link from "next/link";

interface Canvas {
  id: string;
  name: string;
  thumbnail?: string | null;
  is_starred?: boolean;
  created_at: string;
}

interface CanvasCardListProps {
  canvas: Canvas;
  workspaceId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function CanvasCardList({
  canvas,
  workspaceId,
  isSelected,
  onSelect,
}: CanvasCardListProps) {
  const date = new Date(canvas.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group flex items-center gap-2">
      <button
        type="button"
        onClick={onSelect}
        className={`w-5 flex items-center justify-center transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
            isSelected
              ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]"
              : "border-gray-300"
          }`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
      </button>
      <Link
        href={`/workspace/${workspaceId}/canvas/${canvas.id}`}
        className={`flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 ${
          isSelected
            ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            : ""
        }`}
      >
        {canvas.thumbnail ? (
          <img
            src={canvas.thumbnail}
            alt={canvas.name}
            className="w-14 h-14 rounded-lg object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-purple-50 flex items-center justify-center">
            <LayoutTemplate className="h-6 w-6 text-purple-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate flex items-center gap-1">
            {canvas.name}
            {canvas.is_starred && (
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            )}
          </p>
          <p className="text-xs text-muted-foreground">{date} · Canvas</p>
        </div>
      </Link>
    </div>
  );
}
