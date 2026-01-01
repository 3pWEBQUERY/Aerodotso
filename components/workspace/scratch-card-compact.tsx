"use client";

import { Pencil, Star, Check } from "lucide-react";
import Link from "next/link";

interface Scratch {
  id: string;
  title: string;
  is_starred?: boolean;
  created_at: string;
}

interface ScratchCardCompactProps {
  scratch: Scratch;
  workspaceId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function ScratchCardCompact({
  scratch,
  workspaceId,
  isSelected,
  onSelect,
}: ScratchCardCompactProps) {
  const date = new Date(scratch.created_at).toLocaleDateString("en-US", {
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
        href={`/workspace/${workspaceId}/scretch/${scratch.id}`}
        className={`flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 ${
          isSelected
            ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            : ""
        }`}
      >
        <Pencil className="h-4 w-4 text-gray-500" />
        <span className="flex-1 text-sm truncate flex items-center gap-2">
          {scratch.title}
          {scratch.is_starred && (
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          )}
        </span>
        <span className="text-xs text-muted-foreground">{date}</span>
        <span className="text-xs text-muted-foreground w-16 text-right">
          Scratch
        </span>
      </Link>
    </div>
  );
}
