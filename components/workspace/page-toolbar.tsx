"use client";

import { useState } from "react";
import {
  ImageIcon,
  Link2,
  StickyNote,
  LayoutTemplate,
  Search,
  X,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Grid3X3,
  List,
  Sparkles,
  Loader2,
  FolderPlus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type PageType = "media" | "links" | "notes" | "canvas";
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
};

const sortLabels: Record<SortOption, string> = {
  date_added: "Date added",
  last_modified: "Last modified",
  name: "Name",
  type: "Type",
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
  const placeholder = searchPlaceholder || config.defaultPlaceholder;
  const activeSortOptions = sortOptions || config.defaultSortOptions;
  const effectiveFolderType = folderType || (pageType === "media" ? "documents" : pageType);

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
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-lg text-xs">
          <Icon className="h-3 w-3" />
          {config.label}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="w-full pl-9 pr-24 py-2 text-sm bg-transparent border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <button
              type="button"
              onClick={onSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {isSearching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {sortLabels[sortBy]}
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
              {activeSortOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSortByChange(opt)}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted ${
                    sortBy === opt ? "bg-muted font-medium" : ""
                  }`}
                >
                  {sortLabels[opt]}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={() => onSortAscChange(!sortAsc)}
            className="p-1 hover:bg-muted rounded"
          >
            {sortAsc ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 ${
                viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 ${
                viewMode === "list" ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("compact")}
              className={`p-1.5 ${
                viewMode === "compact" ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Folder Creation */}
          <Popover open={folderPopoverOpen} onOpenChange={setFolderPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
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
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="flex-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
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
