"use client";

import { useState } from "react";
import {
  Search,
  ArrowLeft,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Grid3X3,
  List,
  FolderPlus,
  Calendar,
  Clock,
  Type,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CreateToolbar } from "./create-toolbar";

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
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [folderPopoverOpen, setFolderPopoverOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

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
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        <Search className="h-4 w-4" />
        <span>Search</span>
      </div>

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
        <div className="flex items-center">
          <Popover open={sortDropdownOpen} onOpenChange={setSortDropdownOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-l-lg hover:bg-muted">
                {(() => {
                  const Icon = sortIcons[sortBy];
                  return <Icon className="h-4 w-4" />;
                })()}
                {sortLabels[sortBy]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="start">
              {(["date_added", "last_modified", "name", "type"] as const).map((option) => {
                const Icon = sortIcons[option];
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onSortByChange(option);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left ${
                      sortBy === option ? "bg-emerald-50 text-emerald-700" : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {sortLabels[option]}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={() => onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")}
            className="p-1.5 border border-l-0 rounded-r-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* View Mode & Folder */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-emerald-50 text-emerald-600" : "hover:bg-muted text-muted-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`p-2 ${viewMode === "list" ? "bg-emerald-50 text-emerald-600" : "hover:bg-muted text-muted-foreground"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("compact")}
              className={`p-2 ${viewMode === "compact" ? "bg-emerald-50 text-emerald-600" : "hover:bg-muted text-muted-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Folder Creation */}
          <Popover open={folderPopoverOpen} onOpenChange={setFolderPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
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
        </div>
      </div>
    </div>
  );
}
