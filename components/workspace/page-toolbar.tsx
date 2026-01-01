"use client";

import { useState } from "react";
import {
  ImageIcon,
  Link2,
  StickyNote,
  LayoutTemplate,
  Search,
  X,
  LayoutGrid,
  Grid3X3,
  List,
  Loader2,
  FolderPlus,
  Pencil,
  Calendar,
  Clock,
  Type,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ViewModeSwitch } from "@/components/workspace/view-mode-switch";
import { SortControl } from "@/components/workspace/sort-control";

export type PageType = "media" | "links" | "notes" | "canvas" | "scratches";
export type ViewMode = "grid" | "list" | "compact";
export type SortOption = "date_added" | "last_modified" | "name" | "type";

interface PageToolbarProps {
  pageType: PageType;
  // Search
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
  searchPlaceholder?: string;
  // Sort
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  sortAsc: boolean;
  onSortAscChange: (asc: boolean) => void;
  sortOptions?: SortOption[];
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Folder creation
  workspaceId: string;
  folders: { id: string; name: string }[];
  onFolderCreated: (folder: { id: string; name: string }) => void;
  folderType?: string; // "documents" | "notes" | "links"
  currentFolderId?: string | null;
  // Primary action
  primaryAction?: React.ReactNode;
}

const pageConfig = {
  media: {
    icon: ImageIcon,
    label: "Media",
    defaultPlaceholder: "Search by description, color, or content...",
    defaultSortOptions: ["date_added", "last_modified", "name", "type"] as SortOption[],
  },
  links: {
    icon: Link2,
    label: "Links",
    defaultPlaceholder: "Search by title or URL...",
    defaultSortOptions: ["date_added", "name"] as SortOption[],
  },
  notes: {
    icon: StickyNote,
    label: "Notes",
    defaultPlaceholder: "Search by title or content...",
    defaultSortOptions: ["date_added", "last_modified", "name"] as SortOption[],
  },
  canvas: {
    icon: LayoutTemplate,
    label: "Canvas",
    defaultPlaceholder: "Search anything...",
    defaultSortOptions: ["date_added", "last_modified", "name"] as SortOption[],
  },
  scratches: {
    icon: Pencil,
    label: "Scratches",
    defaultPlaceholder: "Search scratches...",
    defaultSortOptions: ["date_added", "last_modified", "name"] as SortOption[],
  },
};

const sortLabels: Record<SortOption, string> = {
  date_added: "Date added",
  last_modified: "Last modified",
  name: "Name",
  type: "Type",
};

const sortIcons: Record<SortOption, typeof Calendar> = {
  date_added: Calendar,
  last_modified: Clock,
  name: Type,
  type: Type,
};

export function PageToolbar({
  pageType,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching = false,
  searchPlaceholder,
  sortBy,
  onSortByChange,
  sortAsc,
  onSortAscChange,
  sortOptions,
  viewMode,
  onViewModeChange,
  workspaceId,
  folders,
  onFolderCreated,
  folderType,
  currentFolderId,
  primaryAction,
}: PageToolbarProps) {
  const [folderPopoverOpen, setFolderPopoverOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const config = pageConfig[pageType];
  const Icon = config.icon;
  const activeSortOptions = sortOptions || config.defaultSortOptions;
  const effectiveFolderType = folderType || (pageType === "media" ? "documents" : pageType);

  const sortOptionsList = activeSortOptions.map((option) => ({
    value: option,
    label: sortLabels[option],
    icon: sortIcons[option],
  }));

  const clearSearch = () => {
    onSearchQueryChange("");
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !workspaceId) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: folderName.trim(),
          type: effectiveFolderType,
          parentFolderId: currentFolderId || null,
        }),
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
    <div className="space-y-4 mb-4">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search anything..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="flex-1 text-2xl font-medium placeholder:text-muted-foreground/40 outline-none bg-transparent"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Sort Control */}
        <SortControl
          value={sortBy}
          onValueChange={onSortByChange}
          direction={sortAsc ? "asc" : "desc"}
          onDirectionChange={(dir) => onSortAscChange(dir === "asc")}
          options={sortOptionsList}
          size="md"
        />

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2">
          <ViewModeSwitch value={viewMode} onChange={onViewModeChange} />

          {/* Folder Creation */}
          <Popover open={folderPopoverOpen} onOpenChange={setFolderPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg text-sm hover:bg-[var(--accent-primary-hover)]">
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

          {/* Primary Action */}
          {primaryAction}
        </div>
      </div>
    </div>
  );
}
