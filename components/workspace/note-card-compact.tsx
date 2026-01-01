"use client";

import { StickyNote, Star, Check } from "lucide-react";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content?: string;
  is_starred?: boolean;
  created_at: string;
}

interface NoteCardCompactProps {
  note: Note;
  workspaceId: string;
  isSelected: boolean;
  onSelect: () => void;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export function NoteCardCompact({
  note,
  workspaceId,
  isSelected,
  onSelect,
}: NoteCardCompactProps) {
  const date = new Date(note.created_at).toLocaleDateString("en-US", {
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
        href={`/workspace/${workspaceId}/notes/${note.id}`}
        className={`flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 ${
          isSelected
            ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            : ""
        }`}
      >
        <StickyNote className="h-4 w-4 text-amber-500" />
        <span className="flex-1 text-sm truncate flex items-center gap-2">
          {stripHtml(note.title) || "Untitled"}
          {note.is_starred && (
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          )}
        </span>
        <span className="text-xs text-muted-foreground">{date}</span>
        <span className="text-xs text-muted-foreground w-16 text-right">
          Note
        </span>
      </Link>
    </div>
  );
}
