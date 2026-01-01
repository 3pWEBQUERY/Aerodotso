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

interface NoteCardListProps {
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

export function NoteCardList({
  note,
  workspaceId,
  isSelected,
  onSelect,
}: NoteCardListProps) {
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
        className={`flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 ${
          isSelected
            ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            : ""
        }`}
      >
        <div className="w-14 h-14 rounded-lg bg-amber-50 flex items-center justify-center">
          <StickyNote className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate flex items-center gap-1">
            {stripHtml(note.title) || "Untitled"}
            {note.is_starred && (
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            )}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {stripHtml(note.content || "") || "No content"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
        </div>
      </Link>
    </div>
  );
}
