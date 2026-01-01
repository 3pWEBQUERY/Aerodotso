"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ArrowLeft,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Calendar,
  Clock,
  Type,
} from "lucide-react";
import { ViewModeSwitch } from "./view-mode-switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CreateToolbar } from "./create-toolbar";
import { SortControl } from "./sort-control";

export type SortBy = "date_added" | "last_modified" | "name" | "type";
export type SortDirection = "asc" | "desc";
export type ViewMode = "grid" | "list" | "compact";

interface WorkspaceToolbarProps {
  workspaceId: string;
  // Search
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  // Sort
  sortBy: SortBy;
  onSortByChange: (sort: SortBy) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (dir: SortDirection) => void;
  // View
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Folder
  onFolderCreated: (folder: { id: string; name: string }) => void;
  // Refresh
  onCreated?: () => void;
}

const sortLabels: Record<SortBy, string> = {
  date_added: "Date added",
  last_modified: "Last modified",
  name: "Name",
  type: "Type",
};

const sortIcons: Record<SortBy, typeof Calendar> = {
  date_added: Calendar,
  last_modified: Clock,
  name: Type,
  type: Type,
};

export function WorkspaceToolbar({
  workspaceId,
  searchQuery = "",
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  viewMode,
  onViewModeChange,
  onFolderCreated,
  onCreated,
}: WorkspaceToolbarProps) {
  const [folderPopoverOpen, setFolderPopoverOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const sortOptions = useMemo(
    () =>
      (["date_added", "last_modified", "name", "type"] as const).map((option) => ({
        value: option,
        label: sortLabels[option],
        icon: sortIcons[option],
      })),
    []
  );

  const handleCreateFolder = async () => {
    if (!folderName.trim() || isCreatingFolder) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: folderName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        onFolderCreated(data.folder);
        setFolderName("");
        setFolderPopoverOpen(false);
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search anything..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange?.(e.target.value)}
          className="flex-1 text-2xl font-medium placeholder:text-muted-foreground/40 outline-none bg-transparent"
        />
      </div>

      {/* Create Toolbar */}
      <CreateToolbar
        workspaceId={workspaceId}
        onCreated={onCreated}
      />

      {/* Sort & View Toolbar */}
      <div className="flex items-center justify-between mt-2">
        {/* Sort Controls */}
        <SortControl
          value={sortBy}
          onValueChange={onSortByChange}
          direction={sortDirection}
          onDirectionChange={onSortDirectionChange}
          options={sortOptions}
          size="md"
        />

        {/* View Mode & Folder */}
        <div className="flex items-center gap-2">
          <ViewModeSwitch value={viewMode} onChange={onViewModeChange} />

          {/* Folder Creation */}
          <Popover open={folderPopoverOpen} onOpenChange={setFolderPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm hover:bg-[var(--accent-primary-hover)]">
                <FolderPlus className="h-4 w-4" />
                Folder
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Create Folder</h4>
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") setFolderPopoverOpen(false);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFolderPopoverOpen(false)}
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    disabled={!folderName.trim() || isCreatingFolder}
                    className="flex-1 px-3 py-1.5 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
                  >
                    {isCreatingFolder ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
