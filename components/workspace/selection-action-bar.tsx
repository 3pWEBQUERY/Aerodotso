"use client";

import { Move, Star, Share2, Trash2, X, Home, FolderClosed } from "lucide-react";

interface Folder {
  id: string;
  name: string;
}

interface SelectionActionBarProps {
  selectedCount: number;
  onStar?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onClear: () => void;
  // Move functionality
  folders?: Folder[];
  showMovePopover?: boolean;
  onToggleMovePopover?: () => void;
  onMoveToFolder?: (folderId: string | null) => void;
}

export function SelectionActionBar({
  selectedCount,
  onStar,
  onShare,
  onDelete,
  onClear,
  folders,
  showMovePopover,
  onToggleMovePopover,
  onMoveToFolder,
}: SelectionActionBarProps) {
  if (selectedCount === 0) return null;

  const hasMoveFeature = folders && onToggleMovePopover && onMoveToFolder;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 border border-[var(--workspace-sidebar-border)] rounded-xl shadow-lg px-2 py-1.5" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
        <span className="px-3 py-1.5 text-sm font-medium bg-[var(--workspace-sidebar-muted)] text-[var(--workspace-sidebar-foreground)] rounded-lg">
          {selectedCount} selected
        </span>
        <div className="w-px h-6 bg-[var(--workspace-sidebar-border)] mx-1" />
        
        {hasMoveFeature && (
          <div className="relative">
            <button
              type="button"
              onClick={onToggleMovePopover}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-lg"
            >
              <Move className="h-4 w-4" />
              Move
            </button>
            
            {showMovePopover && (
              <div className="absolute bottom-full left-0 mb-2 w-48 border border-[var(--workspace-sidebar-border)] rounded-xl shadow-lg py-2" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
                <button
                  type="button"
                  onClick={() => onMoveToFolder(null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--workspace-sidebar-muted)] text-[var(--workspace-sidebar-foreground)] text-left"
                >
                  <Home className="h-4 w-4" />
                  Root (no folder)
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => onMoveToFolder(folder.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--workspace-sidebar-muted)] text-[var(--workspace-sidebar-foreground)] text-left"
                  >
                    <FolderClosed className="h-4 w-4 text-amber-500" />
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {onStar && (
          <button
            type="button"
            onClick={onStar}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-amber-900/30 hover:text-amber-400 rounded-lg"
          >
            <Star className="h-4 w-4" />
            Star
          </button>
        )}
        
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-lg"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}
        
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-900/30 text-red-400 rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
        
        <div className="w-px h-6 bg-[var(--workspace-sidebar-border)] mx-1" />
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] text-[var(--workspace-sidebar-foreground)] rounded-lg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
