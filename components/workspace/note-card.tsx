"use client";

import { StickyNote, Check, PanelRight, Star } from "lucide-react";
import Image from "next/image";

interface Note {
  id: string;
  title: string;
  content: string;
  folder_id?: string | null;
  is_starred?: boolean;
  created_at: string;
  cover_image?: string | null;
}

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onClick: () => void;
  onOpenInPanel: () => void;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export function NoteCard({
  note,
  isSelected,
  onSelect,
  onClick,
  onOpenInPanel,
}: NoteCardProps) {
  const plainTitle = stripHtml(note.title) || "Untitled";
  const plainContent = stripHtml(note.content);

  return (
    <div
      className={`
        group relative rounded-2xl bg-white hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden
        shadow-sm border border-gray-100 h-56 flex flex-col
        ${isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""}
      `}
      onClick={onClick}
    >
      {/* Cover image background with 20% opacity */}
      {note.cover_image && (
        <Image
          src={note.cover_image}
          alt=""
          fill
          unoptimized
          className="object-cover z-0 opacity-20"
        />
      )}

      {/* Open in panel button */}
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

      {/* Star badge */}
      {note.is_starred && (
        <div className="absolute top-3 right-10 z-20">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        </div>
      )}

      {/* Selection checkbox */}
      <div
        className={`
          absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center z-20 transition-all cursor-pointer
          ${isSelected
            ? "bg-[var(--accent-primary)]/100 border-[var(--accent-primary)]"
            : "border-gray-300 bg-white opacity-0 group-hover:opacity-100"
          }
        `}
        onClick={onSelect}
      >
        {isSelected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Scrollable content area */}
      <div className="relative z-10 px-4 pt-10 pb-2 flex-1 flex flex-col overflow-hidden">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 flex-shrink-0">
          {plainTitle}
        </h3>
        
        {/* Scrollable content */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-gray-500 leading-relaxed pr-1">
            {plainContent}
          </p>
        </div>
      </div>

      {/* Footer with icon badge and title */}
      <div className="relative z-10 px-4 py-2.5 mt-auto border-t border-gray-50 bg-white/80 backdrop-blur-sm">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100/80 rounded-md max-w-full">
          <StickyNote className="h-3 w-3 text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate">{plainTitle}</span>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
      `}</style>
    </div>
  );
}
