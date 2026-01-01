"use client";

import { Link2, Star, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface LinkItem {
  id: string;
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  is_starred?: boolean;
  created_at: string;
}

interface LinkCardListProps {
  link: LinkItem;
  workspaceId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function LinkCardList({
  link,
  workspaceId,
  isSelected,
  onSelect,
}: LinkCardListProps) {
  const date = new Date(link.created_at).toLocaleDateString("en-US", {
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
      <div
        className={`flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 cursor-pointer ${
          isSelected
            ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            : ""
        }`}
        onClick={() => window.open(link.url, "_blank")}
      >
        <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
          {link.favicon ? (
            <img src={link.favicon} alt="" className="w-6 h-6" />
          ) : (
            <Link2 className="h-6 w-6 text-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate flex items-center gap-1">
            {link.title || link.url}
            {link.is_starred && (
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            )}
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {link.description || link.url}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
        </div>
      </div>
    </div>
  );
}
