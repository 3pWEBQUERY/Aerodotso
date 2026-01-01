"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { LayoutTemplate, Plus, Trash2, X, FolderClosed, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageToolbar, ViewMode, SortOption } from "@/components/workspace/page-toolbar";
import { CanvasCard } from "@/components/canvas/canvas-card";
import { CanvasCardList } from "@/components/workspace/canvas-card-list";
import { CanvasCardCompact } from "@/components/workspace/canvas-card-compact";
import { AnimatedFolder } from "@/components/workspace/animated-folder";

interface Canvas {
  id: string;
  name: string;
  created_at: string;
  folder_id?: string | null;
  data?: {
    nodes?: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
    }>;
    edges?: Array<any>;
  };
}

interface Folder {
  id: string;
  name: string;
  type?: string;
  parent_folder_id?: string | null;
}

export default function WorkspaceCanvasPage() {
  const params = useParams<{ workspaceId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId;
  const currentFolderId = searchParams.get("folder");
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Canvas[] | null>(null);
  const [isHoveringEmpty, setIsHoveringEmpty] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("Untitled Canvas");
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date_added");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCanvasIds, setSelectedCanvasIds] = useState<Set<string>>(new Set());

  const fetchCanvases = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [canvasRes, foldersRes] = await Promise.all([
        fetch(`/api/canvas?workspaceId=${workspaceId}`),
        fetch(`/api/folders?workspaceId=${workspaceId}&type=canvas`),
      ]);

      const canvasData = await canvasRes.json();
      const foldersData = await foldersRes.json();

      if (canvasData.canvases) setCanvases(canvasData.canvases);
      if (foldersData.folders) setFolders(foldersData.folders);
    } catch (error) {
      console.error("Failed to fetch canvases:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  // Derive current folder info and hierarchy
  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  const buildBreadcrumbPath = (): Folder[] => {
    const path: Folder[] = [];
    let current = currentFolder;
    while (current) {
      path.unshift(current);
      current = current.parent_folder_id
        ? folders.find((f) => f.id === current!.parent_folder_id)
        : null;
    }
    return path;
  };

  const breadcrumbPath = buildBreadcrumbPath();

  const openCreateDialog = () => {
    setNewCanvasName("Untitled Canvas");
    setShowCreateDialog(true);
  };

  const createCanvas = async () => {
    if (!workspaceId || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: newCanvasName.trim() || "Untitled Canvas",
          folder_id: currentFolderId || null,
        }),
      });
      const data = await res.json();
      if (data.canvas) {
        setShowCreateDialog(false);
        router.push(`/workspace/${workspaceId}/canvas/${data.canvas.id}`);
      }
    } catch (error) {
      console.error("Failed to create canvas:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCanvas = async (canvasId: string) => {
    try {
      await fetch(`/api/canvas/${canvasId}`, { method: "DELETE" });
      setCanvases((prev) => prev.filter((c) => c.id !== canvasId));
    } catch (error) {
      console.error("Failed to delete canvas:", error);
    }
  };

  const toggleCanvasSelection = (canvasId: string) => {
    setSelectedCanvasIds((prev) => {
      const next = new Set(prev);
      if (next.has(canvasId)) {
        next.delete(canvasId);
      } else {
        next.add(canvasId);
      }
      return next;
    });
  };

  // Folders & canvases im aktuellen Folder
  const currentSubfolders = folders.filter((folder) =>
    currentFolderId ? folder.parent_folder_id === currentFolderId : !folder.parent_folder_id
  );

  const canvasesInCurrentFolder = canvases.filter((canvas) =>
    currentFolderId ? canvas.folder_id === currentFolderId : !canvas.folder_id
  );

  // Sort canvases in current folder
  const sortedCanvases = [...canvasesInCurrentFolder].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "date_added") {
      cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === "last_modified") {
      // canvases haben aktuell kein separates updated_at im Typ, daher fallback auf created_at
      cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === "name") {
      cmp = a.name.localeCompare(b.name);
    }
    return sortAsc ? -cmp : cmp;
  });

  // AI Search - auto-trigger with debounce
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || !workspaceId) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          workspaceId,
          searchTypes: ["semantic", "text"],
          limit: 50,
        }),
      });
      
      const data = await res.json();
      if (data.results) {
        // Filter only canvases from results
        const canvasResults: Canvas[] = data.results
          .filter((r: any) => r.result_type === "canvas")
          .map((r: any) => ({
            id: r.document_id,
            name: r.title,
            created_at: r.created_at || new Date().toISOString(),
          }));
        setSearchResults(canvasResults);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [workspaceId]);

  // Auto-search with debounce when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  // Use search results if available, otherwise filter locally
  const filteredCanvases = searchResults !== null 
    ? searchResults 
    : sortedCanvases.filter((canvas) =>
        canvas.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const hasAnyItems =
    canvasesInCurrentFolder.length > 0 || currentSubfolders.length > 0;

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Breadcrumb Navigation */}
        {currentFolderId && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Link
              href={`/workspace/${workspaceId}/canvas`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Canvas</span>
            </Link>
            {breadcrumbPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                {index === breadcrumbPath.length - 1 ? (
                  <div className="flex items-center gap-1 text-gray-700 font-medium">
                    <FolderClosed className="h-3.5 w-3.5 text-amber-500" />
                    <span>{folder.name}</span>
                  </div>
                ) : (
                  <Link
                    href={`/workspace/${workspaceId}/canvas?folder=${folder.id}`}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <FolderClosed className="h-3.5 w-3.5 text-amber-500" />
                    <span>{folder.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Page Toolbar */}
        <PageToolbar
          pageType="canvas"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={() => handleSearch(searchQuery)}
          isSearching={isSearching}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortAsc={sortAsc}
          onSortAscChange={setSortAsc}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          workspaceId={workspaceId || ""}
          folders={folders}
          onFolderCreated={(folder) => {
            setFolders((prev) => [
              ...prev,
              folder as Folder,
            ]);
          }}
          folderType="canvas"
          currentFolderId={currentFolderId}
          primaryAction={
            <button
              type="button"
              onClick={openCreateDialog}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-sm rounded-lg hover:bg-[var(--accent-primary-hover)]"
            >
              <Plus className="h-4 w-4" />
              New Canvas
            </button>
          }
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : !hasAnyItems ? (
          /* Empty State with Hover Effect */
          <div className="flex flex-col items-center justify-center py-32">
            <button
              type="button"
              onClick={openCreateDialog}
              onMouseEnter={() => setIsHoveringEmpty(true)}
              onMouseLeave={() => setIsHoveringEmpty(false)}
              className="group flex flex-col items-center"
            >
              {/* Icon Circle */}
              <div className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 transition-colors group-hover:bg-violet-50">
                <LayoutTemplate className="h-8 w-8 text-violet-400" />
                {/* Plus icon on hover */}
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border flex items-center justify-center transition-opacity ${isHoveringEmpty ? 'opacity-100' : 'opacity-0'}`}>
                  <Plus className="h-3 w-3 text-violet-500" />
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {isHoveringEmpty ? "Create Canvas" : "No canvases"}
              </h2>
              
              {/* Subtitle */}
              <p className="text-sm text-gray-500">
                A visual space for ideas and workflows.
              </p>
            </button>
          </div>
        ) : (
          <>
            {searchQuery &&
              filteredCanvases.length === 0 &&
              canvasesInCurrentFolder.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No canvases found for &quot;{searchQuery}&quot;</p>
              </div>
            )}
            {/* GRID VIEW */}
            {viewMode === "grid" && (
              <div className="flex flex-wrap gap-4">
                {currentSubfolders.map((folder) => {
                  const folderCanvases = canvases.filter(
                    (canvas) => canvas.folder_id === folder.id
                  );
                  return (
                    <Link
                      key={folder.id}
                      href={`/workspace/${workspaceId}/canvas?folder=${folder.id}`}
                      className="w-44 cursor-pointer block group"
                    >
                      <div className="h-56 rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200/50 overflow-hidden">
                        <AnimatedFolder
                          name={folder.name}
                          fileCount={folderCanvases.length}
                          previewFiles={folderCanvases.slice(0, 3).map((c) => ({
                            type: "canvas",
                            name: c.name,
                          }))}
                        />
                      </div>
                      <p className="text-[10px] truncate flex items-center gap-1 text-muted-foreground mt-2 group-hover:text-amber-600">
                        <FolderClosed className="h-3 w-3 text-amber-500" />
                        {folder.name}
                      </p>
                    </Link>
                  );
                })}
                {filteredCanvases.map((canvas) => (
                  <div key={canvas.id} className="w-80">
                    <CanvasCard
                      id={canvas.id}
                      name={canvas.name}
                      createdAt={canvas.created_at}
                      workspaceId={workspaceId || ""}
                      isSelected={selectedCanvasIds.has(canvas.id)}
                      onSelect={() => toggleCanvasSelection(canvas.id)}
                      onDelete={() => deleteCanvas(canvas.id)}
                      canvasData={canvas.data}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {filteredCanvases.map((canvas) => (
                  <CanvasCardList
                    key={canvas.id}
                    canvas={canvas}
                    workspaceId={workspaceId || ""}
                    isSelected={selectedCanvasIds.has(canvas.id)}
                    onSelect={() => toggleCanvasSelection(canvas.id)}
                  />
                ))}
              </div>
            )}

            {/* COMPACT VIEW */}
            {viewMode === "compact" && (
              <div className="space-y-0">
                {filteredCanvases.map((canvas, i) => (
                  <div key={canvas.id} className={i > 0 ? "mt-1" : ""}>
                    <CanvasCardCompact
                      canvas={canvas}
                      workspaceId={workspaceId || ""}
                      isSelected={selectedCanvasIds.has(canvas.id)}
                      onSelect={() => toggleCanvasSelection(canvas.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Canvas Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowCreateDialog(false)}>
            <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="text-lg font-semibold">Name Item</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <label className="block text-sm text-gray-500 mb-2">Name</label>
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createCanvas()}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] bg-[var(--accent-primary)]/10/30"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createCanvas}
                  disabled={isCreating}
                  className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
