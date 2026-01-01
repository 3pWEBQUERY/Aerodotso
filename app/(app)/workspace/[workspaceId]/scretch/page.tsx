"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Pencil, Plus, FolderClosed, Home, ChevronRight, Upload, Loader2, Check, X, ChevronDown, ChevronUp, FileIcon } from "lucide-react";
import Link from "next/link";
import { SelectionActionBar } from "@/components/workspace/selection-action-bar";
import { PageToolbar, ViewMode, SortOption } from "@/components/workspace/page-toolbar";
import { DraggableItem } from "@/components/workspace/draggable-item";
import { DroppableFolder } from "@/components/workspace/droppable-folder";
import { ScratchCard } from "@/components/workspace/scratch-card";
import { ScratchCardList } from "@/components/workspace/scratch-card-list";
import { ScratchCardCompact } from "@/components/workspace/scratch-card-compact";
import { motion, AnimatePresence } from "framer-motion";

interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "waiting" | "uploading" | "processing" | "done" | "error";
  error?: string;
  scratchId?: string;
  noteId?: string;
}

interface Scratch {
  id: string;
  title: string;
  data: any;
  thumbnail?: string | null;
  folder_id?: string | null;
  is_starred?: boolean;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  type: string;
  parent_folder_id?: string | null;
}

// Empty state with hover effect and create functionality
function EmptyState({ onCreate }: { onCreate: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <button
        type="button"
        onClick={onCreate}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative mb-4 focus:outline-none"
      >
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
          ${isHovered ? "bg-violet-50 ring-2 ring-violet-200" : "bg-gray-100"}
        `}>
          <Pencil className={`
            h-7 w-7 transition-colors duration-200
            ${isHovered ? "text-violet-600" : "text-gray-400"}
          `} />
        </div>
        {isHovered && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
            <Plus className="h-3 w-3 text-violet-600" />
          </div>
        )}
      </button>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {isHovered ? "New Scratch" : "No scratches"}
      </h2>
      <p className="text-sm text-gray-500">Create your first scratch drawing.</p>
    </div>
  );
}

export default function WorkspaceScretchPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId;
  
  // Get current folder from URL
  const currentFolderId = searchParams.get("folder");
  
  const [scratches, setScratches] = useState<Scratch[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date_added");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // Selection state
  const [selectedScratches, setSelectedScratches] = useState<Set<string>>(new Set());
  
  // Move popover
  const [showMovePopover, setShowMovePopover] = useState(false);
  
  // Upload state
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get current folder info
  const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;
  
  // Get subfolders of current folder
  const currentSubfolders = folders.filter(f => 
    currentFolderId ? f.parent_folder_id === currentFolderId : !f.parent_folder_id
  );
  
  // Get scratches in current folder
  const scratchesInCurrentFolder = scratches.filter(s => 
    currentFolderId ? s.folder_id === currentFolderId : !s.folder_id
  );
  
  // Build breadcrumb path
  const buildBreadcrumbPath = (): Folder[] => {
    const path: Folder[] = [];
    let current = currentFolder;
    while (current) {
      path.unshift(current);
      current = current.parent_folder_id ? folders.find(f => f.id === current!.parent_folder_id) : null;
    }
    return path;
  };
  
  const breadcrumbPath = buildBreadcrumbPath();

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [scratchesRes, foldersRes] = await Promise.all([
        fetch(`/api/scratches?workspaceId=${workspaceId}`),
        fetch(`/api/folders?workspaceId=${workspaceId}&type=scratches`)
      ]);
      const scratchesData = await scratchesRes.json();
      const foldersData = await foldersRes.json();
      if (scratchesData.scratches) setScratches(scratchesData.scratches);
      if (foldersData.folders) setFolders(foldersData.folders);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create new scratch (in current folder if inside one)
  const createScratch = async () => {
    try {
      const response = await fetch("/api/scratches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: "Untitled Scratch",
          data: { elements: [], appState: {} },
          folder_id: currentFolderId || null,
        }),
      });
      if (response.ok) {
        const { scratch } = await response.json();
        router.push(`/workspace/${workspaceId}/scretch/${scratch.id}`);
      }
    } catch (error) {
      console.error("Failed to create scratch:", error);
    }
  };

  // Handle folder created from toolbar
  const handleFolderCreated = (folder: { id: string; name: string }) => {
    setFolders(prev => [...prev, { ...folder, type: "scratches" }]);
  };
  
  // Upload scratch image
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setShowUploadProgress(true);
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to upload list
      setUploads(prev => [...prev, {
        id: uploadId,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: "waiting",
      }]);
      
      // Start upload
      uploadScratchFile(file, uploadId);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const uploadScratchFile = async (file: File, uploadId: string) => {
    // Update to uploading
    setUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, status: "uploading" as const, progress: 10 } : u
    ));
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploads(prev => prev.map(u => {
        if (u.id === uploadId && u.status === "uploading" && u.progress < 70) {
          return { ...u, progress: u.progress + 10 };
        }
        return u;
      }));
    }, 300);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId || "");
      
      const response = await fetch("/api/scratches/upload", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      const data = await response.json();
      
      // Update to processing
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: "processing" as const, progress: 85 } : u
      ));
      
      // Add new scratch to list
      if (data.scratch) {
        setScratches(prev => [data.scratch, ...prev]);
      }
      
      // Mark as done
      setTimeout(() => {
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { 
            ...u, 
            status: "done" as const, 
            progress: 100,
            scratchId: data.scratch?.id,
            noteId: data.note?.id,
          } : u
        ));
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: "error" as const, error: "Upload failed" } : u
      ));
    }
  };
  
  const cancelUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };
  
  const dismissUploads = () => {
    setUploads([]);
    setShowUploadProgress(false);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Selection handlers
  const toggleScratchSelection = (scratchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedScratches(prev => {
      const next = new Set(prev);
      if (next.has(scratchId)) next.delete(scratchId);
      else next.add(scratchId);
      return next;
    });
  };

  const clearSelection = () => setSelectedScratches(new Set());

  // Delete selected scratches
  const deleteSelected = async () => {
    const ids = Array.from(selectedScratches);
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/scratches/${id}`, { method: "DELETE" })
      ));
      setScratches(prev => prev.filter(s => !ids.includes(s.id)));
      clearSelection();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Star selected scratches
  const starSelected = async () => {
    const ids = Array.from(selectedScratches);
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/scratches/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_starred: true }),
        })
      ));
      setScratches(prev => prev.map(s => 
        ids.includes(s.id) ? { ...s, is_starred: true } : s
      ));
      clearSelection();
    } catch (error) {
      console.error("Failed to star:", error);
    }
  };

  // Move to folder
  const moveToFolder = async (folderId: string | null) => {
    const ids = Array.from(selectedScratches);
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/scratches/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_id: folderId }),
        })
      ));
      setScratches(prev => prev.map(s => 
        ids.includes(s.id) ? { ...s, folder_id: folderId } : s
      ));
      clearSelection();
      setShowMovePopover(false);
    } catch (error) {
      console.error("Failed to move:", error);
    }
  };

  // Handle drag-and-drop to folder
  const handleDropToFolder = async (folderId: string, itemId: string, itemType: string) => {
    if (itemType !== "scratch") return;
    try {
      await fetch(`/api/scratches/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      setScratches(prev => prev.map(s => 
        s.id === itemId ? { ...s, folder_id: folderId } : s
      ));
    } catch (error) {
      console.error("Failed to move scratch to folder:", error);
    }
  };

  // Sort scratches
  const sortedScratches = [...scratchesInCurrentFolder].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "date_added") cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    else if (sortBy === "last_modified") cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    else if (sortBy === "name") cmp = a.title.localeCompare(b.title);
    return sortAsc ? -cmp : cmp;
  });

  // Search results state
  const [searchResults, setSearchResults] = useState<Scratch[] | null>(null);

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
        // Filter only scratches from results
        const scratchResults: Scratch[] = data.results
          .filter((r: any) => r.result_type === "scratch")
          .map((r: any) => ({
            id: r.document_id,
            title: r.title,
            data: {},
            thumbnail: r.thumbnailUrl || r.previewUrl,
            created_at: r.created_at || new Date().toISOString(),
            is_starred: false,
          }));
        setSearchResults(scratchResults);
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
  const filteredScratches = searchResults !== null 
    ? searchResults 
    : sortedScratches.filter(scratch => 
        scratch.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Breadcrumb Navigation */}
        {currentFolderId && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Link
              href={`/workspace/${workspaceId}/scretch`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Scratches</span>
            </Link>
            {breadcrumbPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                {index === breadcrumbPath.length - 1 ? (
                  <div className="flex items-center gap-1 text-gray-700 font-medium">
                    <FolderClosed className="h-3.5 w-3.5 text-violet-500" />
                    <span>{folder.name}</span>
                  </div>
                ) : (
                  <Link
                    href={`/workspace/${workspaceId}/scretch?folder=${folder.id}`}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <FolderClosed className="h-3.5 w-3.5 text-violet-500" />
                    <span>{folder.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Page Toolbar */}
        <PageToolbar
          pageType="scratches"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={() => handleSearch(searchQuery)}
          isSearching={isSearching}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortAsc={sortAsc}
          onSortAscChange={setSortAsc}
          sortOptions={["date_added", "last_modified", "name"]}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          workspaceId={workspaceId || ""}
          folders={folders}
          onFolderCreated={handleFolderCreated}
          folderType="scratches"
          currentFolderId={currentFolderId}
          primaryAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              <button
                type="button"
                onClick={createScratch}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-sm rounded-lg hover:bg-[var(--accent-primary-hover)]"
              >
                <Plus className="h-4 w-4" />
                New Scratch
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          }
        />

        {/* Content */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredScratches.length === 0 && currentSubfolders.length === 0 ? (
            currentFolderId ? (
              <div className="flex flex-col items-center justify-center py-32">
                <FolderClosed className="h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Empty folder</h2>
                <p className="text-sm text-gray-500">Create a scratch or subfolder in this folder.</p>
              </div>
            ) : (
              <EmptyState onCreate={createScratch} />
            )
          ) : (
            <>
              {/* GRID VIEW */}
              {viewMode === "grid" && (
                <div className="flex flex-wrap gap-4">
                  {/* Subfolders */}
                  {currentSubfolders.map((folder) => {
                    const scratchesInFolder = scratches.filter(s => s.folder_id === folder.id);
                    return (
                      <DroppableFolder
                        key={folder.id}
                        folderId={folder.id}
                        folderName={folder.name}
                        workspaceId={workspaceId || ""}
                        fileCount={scratchesInFolder.length}
                        previewFiles={scratchesInFolder.slice(0, 3).map(s => ({
                          type: "scratch",
                          name: s.title || "Untitled"
                        }))}
                        onDrop={handleDropToFolder}
                        acceptTypes={["scratch"]}
                      />
                    );
                  })}

                  {/* Scratches */}
                  {filteredScratches.map((scratch) => (
                    <DraggableItem key={scratch.id} itemId={scratch.id} itemType="scratch">
                      <div className="w-44">
                        <ScratchCard
                          scratch={scratch}
                          isSelected={selectedScratches.has(scratch.id)}
                          onSelect={(e) => toggleScratchSelection(scratch.id, e)}
                          onClick={() => router.push(`/workspace/${workspaceId}/scretch/${scratch.id}`)}
                        />
                      </div>
                    </DraggableItem>
                  ))}
                </div>
              )}

              {/* LIST VIEW */}
              {viewMode === "list" && (
                <div className="space-y-2">
                  {filteredScratches.map((scratch) => (
                    <ScratchCardList
                      key={scratch.id}
                      scratch={scratch}
                      workspaceId={workspaceId || ""}
                      isSelected={selectedScratches.has(scratch.id)}
                      onSelect={() => toggleScratchSelection(scratch.id, {} as React.MouseEvent)}
                    />
                  ))}
                </div>
              )}

              {/* COMPACT VIEW */}
              {viewMode === "compact" && (
                <div className="space-y-0">
                  {filteredScratches.map((scratch, i) => (
                    <div key={scratch.id} className={i > 0 ? "mt-1" : ""}>
                      <ScratchCardCompact
                        scratch={scratch}
                        workspaceId={workspaceId || ""}
                        isSelected={selectedScratches.has(scratch.id)}
                        onSelect={() => toggleScratchSelection(scratch.id, {} as React.MouseEvent)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Selection Action Bar */}
        <SelectionActionBar
          selectedCount={selectedScratches.size}
          folders={folders}
          showMovePopover={showMovePopover}
          onToggleMovePopover={() => setShowMovePopover(!showMovePopover)}
          onMoveToFolder={moveToFolder}
          onStar={starSelected}
          onDelete={deleteSelected}
          onClear={clearSelection}
        />
      </div>
      
      {/* Upload Progress Popover */}
      <AnimatePresence>
        {showUploadProgress && uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-50 w-[380px] bg-white rounded-xl shadow-2xl border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50/50">
              {/* Progress Circle */}
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="16" cy="16" r="14" fill="none"
                    stroke={uploads.every(u => u.status === "done") ? "#10b981" : "#8b5cf6"}
                    strokeWidth="3" strokeLinecap="round" strokeDasharray={88}
                    strokeDashoffset={88 - (88 * (uploads.reduce((acc, u) => acc + u.progress, 0) / uploads.length)) / 100}
                    className="transition-all duration-300"
                  />
                </svg>
                {!uploads.every(u => u.status === "done") ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-[var(--accent-primary-light)]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{uploads.length} file{uploads.length !== 1 ? "s" : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {uploads.filter(u => u.status === "done").length} of {uploads.length} · AI analyzing...
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {uploads.every(u => u.status === "done") && (
                  <button type="button" onClick={dismissUploads} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
                    Dismiss
                  </button>
                )}
                <button type="button" onClick={() => setIsUploadExpanded(!isUploadExpanded)} className="p-1 hover:bg-muted rounded">
                  {isUploadExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* File List */}
            <AnimatePresence>
              {isUploadExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    {uploads.map((upload) => (
                      <div key={upload.id} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-gray-50/50">
                        <div className="w-8 h-8 bg-violet-100 rounded flex items-center justify-center flex-shrink-0">
                          <Pencil className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate font-medium">{upload.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(upload.fileSize)}
                            {upload.status === "waiting" && " · Waiting"}
                            {upload.status === "uploading" && ` · ${upload.progress}%`}
                            {upload.status === "processing" && " · AI analyzing..."}
                            {upload.status === "done" && " · Done + Note created"}
                            {upload.status === "error" && ` · ${upload.error}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {upload.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-violet-500" />}
                          {upload.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
                          {upload.status === "done" && <Check className="h-4 w-4 text-[var(--accent-primary-light)]" />}
                          {upload.status !== "done" && upload.status !== "processing" && (
                            <button type="button" onClick={() => cancelUpload(upload.id)} className="p-1 hover:bg-muted rounded opacity-50 hover:opacity-100">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
