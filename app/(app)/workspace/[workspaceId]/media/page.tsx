"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { ImageIcon, Trash2, FileText, File, Upload, Check, Star, X, PanelRight, Pencil, Download, Maximize2, Home, ChevronRight, FolderClosed } from "lucide-react";
import Link from "next/link";
import { useUpload } from "@/components/providers/upload-provider";
import { AnimatedFolder } from "@/components/workspace/animated-folder";
import { SelectionActionBar } from "@/components/workspace/selection-action-bar";
import { PageToolbar, ViewMode, SortOption } from "@/components/workspace/page-toolbar";
import { MediaCard } from "@/components/workspace/media-card";
import { VideoCard } from "@/components/workspace/video-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Document {
  id: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at?: string;
  previewUrl?: string;
  is_starred?: boolean;
  is_public?: boolean;
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
  workspace_id: string;
  parent_folder_id?: string | null;
  created_at: string;
}

interface OpenPanel {
  id: string;
  docId: string;
  width: number;
}


export default function WorkspaceMediaPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params?.workspaceId;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Document[] | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date_added");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [openPanels, setOpenPanels] = useState<OpenPanel[]>([]);
  const [resizing, setResizing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUpload } = useUpload();

  // Folder states
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showMovePopover, setShowMovePopover] = useState(false);

  // Open a document in a new panel (max 4)
  const openInPanel = (docId: string) => {
    if (openPanels.length >= 4) return;
    if (openPanels.some(p => p.docId === docId)) return;
    setOpenPanels(prev => [...prev, { id: crypto.randomUUID(), docId, width: 400 }]);
  };

  // Close a panel
  const closePanel = (panelId: string) => {
    setOpenPanels(prev => prev.filter(p => p.id !== panelId));
  };

  // Handle resize
  const handleMouseDown = (panelId: string) => {
    setResizing(panelId);
  };

  useEffect(() => {
    if (!resizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setOpenPanels(prev => prev.map(p => {
        if (p.id === resizing) {
          const newWidth = Math.max(200, p.width - e.movementX);
          return { ...p, width: newWidth };
        }
        return p;
      }));
    };

    const handleMouseUp = () => setResizing(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  const fetchDocuments = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch(`/api/documents/list?workspaceId=${workspaceId}`),
        fetch(`/api/folders?workspaceId=${workspaceId}`)
      ]);
      const docsData = await docsRes.json();
      const foldersData = await foldersRes.json();
      if (docsData.documents) {
        setDocuments(docsData.documents);
      }
      if (foldersData.folders) {
        setFolders(foldersData.folders);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle folder created from toolbar
  const handleFolderCreated = (folder: { id: string; name: string }) => {
    setFolders(prev => [...prev, { ...folder, workspace_id: workspaceId || "", created_at: new Date().toISOString() }]);
  };

  // Sort documents
  const sortedDocuments = [...documents].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "date_added") cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    else if (sortBy === "last_modified") cmp = new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    else if (sortBy === "name") cmp = a.title.localeCompare(b.title);
    else if (sortBy === "type") cmp = (a.mime_type || "").localeCompare(b.mime_type || "");
    return sortAsc ? -cmp : cmp;
  });

  // AI Search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !workspaceId) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          workspaceId,
          searchTypes: ["semantic", "text", "visual"],
          limit: 50,
        }),
      });
      
      const data = await res.json();
      if (data.results) {
        // Map search results to Document format
        const mappedResults: Document[] = data.results.map((r: any) => ({
          id: r.document_id,
          title: r.title,
          mime_type: r.mime_type,
          size_bytes: 0,
          created_at: new Date().toISOString(),
          previewUrl: r.previewUrl || r.thumbnailUrl,
          is_starred: false,
        }));
        setSearchResults(mappedResults);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // Use search results if available, otherwise show all documents
  // Filter out documents that are in folders (they appear inside the folder)
  const filteredDocuments = searchResults !== null 
    ? searchResults.filter(doc => !doc.folder_id)
    : sortedDocuments.filter(doc => 
        !doc.folder_id && doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Selection
  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const clearSelection = () => setSelectedDocs(new Set());

  // Upload using context with progress UI
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !workspaceId) return;
    
    // Upload all files using the upload context (shows progress UI)
    const uploadPromises = Array.from(files).map((file) => 
      addUpload(file, workspaceId).catch((err) => {
        console.error(`Failed to upload ${file.name}:`, err);
      })
    );
    
    await Promise.all(uploadPromises);
    fetchDocuments();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Star selected
  const starSelected = async () => {
    const ids = Array.from(selectedDocs);
    try {
      await fetch("/api/documents/star", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: ids, starred: true }),
      });
      setDocuments(docs => docs.map(d => ids.includes(d.id) ? { ...d, is_starred: true } : d));
    } catch (error) {
      console.error("Failed to star:", error);
    }
  };

  // Delete selected
  const deleteSelected = async () => {
    const ids = Array.from(selectedDocs);
    try {
      await fetch("/api/documents/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: ids }),
      });
      setDocuments(docs => docs.filter(d => !ids.includes(d.id)));
      clearSelection();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Move to folder
  const moveToFolder = async (folderId: string | null) => {
    const ids = Array.from(selectedDocs);
    try {
      await fetch("/api/documents/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: ids, folderId }),
      });
      setDocuments(docs => docs.map(d => 
        ids.includes(d.id) ? { ...d, folder_id: folderId } : d
      ));
      clearSelection();
      setShowMovePopover(false);
    } catch (error) {
      console.error("Failed to move:", error);
    }
  };


  // Group documents by date for sidebar
  const groupDocumentsByDate = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);
    const pastMonth = new Date(today);
    pastMonth.setDate(pastMonth.getDate() - 30);

    const groups: { [key: string]: Document[] } = {
      today: [],
      yesterday: [],
      pastWeek: [],
      pastMonth: [],
      older: [],
    };

    // Sort by date descending first
    const sorted = [...documents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const doc of sorted) {
      const docDate = new Date(doc.created_at);
      if (docDate >= today) {
        groups.today.push(doc);
      } else if (docDate >= yesterday) {
        groups.yesterday.push(doc);
      } else if (docDate >= pastWeek) {
        groups.pastWeek.push(doc);
      } else if (docDate >= pastMonth) {
        groups.pastMonth.push(doc);
      } else {
        groups.older.push(doc);
      }
    }

    return groups;
  }, [documents]);

  const groupedDocs = groupDocumentsByDate();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Page Toolbar */}
        <PageToolbar
          pageType="media"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          isSearching={isSearching}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortAsc={sortAsc}
          onSortAscChange={setSortAsc}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          workspaceId={workspaceId || ""}
          folders={folders}
          onFolderCreated={handleFolderCreated}
          folderType="documents"
          primaryAction={
            <>
              <input type="file" ref={fileInputRef} onChange={handleUpload} multiple accept="image/*,video/*,application/pdf" className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </>
          }
        />

        {/* Search Results Info */}
        {searchResults !== null && (
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm text-muted-foreground">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs text-emerald-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : filteredDocuments.length === 0 && folders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No media yet.</p>
        ) : (
          <>
            {/* GRID VIEW */}
            {viewMode === "grid" && (
              <div className="flex flex-wrap gap-4">
                {/* Folders first */}
                {folders.map((folder) => {
                  const folderDocs = documents.filter(d => d.folder_id === folder.id);
                  return (
                    <Link key={`folder-${folder.id}`} href={`/workspace/${workspaceId}/folder/${folder.id}`} className="w-44 cursor-pointer block group">
                      <div className="h-56 rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200/50 overflow-hidden">
                        <AnimatedFolder 
                          name={folder.name} 
                          fileCount={folderDocs.length} 
                          previewFiles={folderDocs.slice(0, 3).map(d => ({ 
                            type: d.mime_type, 
                            name: d.title, 
                            previewUrl: d.previewUrl 
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
                {/* Documents */}
                {filteredDocuments.map((doc) => {
                  if (doc.mime_type?.startsWith("image/") && doc.previewUrl) {
                    return (
                      <MediaCard
                        key={doc.id}
                        src={doc.previewUrl}
                        alt={doc.title}
                        title={doc.title}
                        isSelected={selectedDocs.has(doc.id)}
                        isStarred={doc.is_starred}
                        onCheckboxClick={() => toggleDocSelection(doc.id)}
                        href={`/workspace/${workspaceId}/document/${doc.id}`}
                      />
                    );
                  }

                  if (doc.mime_type?.startsWith("video/") && doc.previewUrl) {
                    return (
                      <VideoCard
                        key={doc.id}
                        src={doc.previewUrl}
                        alt={doc.title}
                        title={doc.title}
                        isSelected={selectedDocs.has(doc.id)}
                        isStarred={doc.is_starred}
                        onCheckboxClick={() => toggleDocSelection(doc.id)}
                        href={`/workspace/${workspaceId}/document/${doc.id}`}
                      />
                    );
                  }

                  // PDF with preview
                  if (doc.mime_type === "application/pdf" && doc.previewUrl) {
                    return (
                      <div key={doc.id} className="w-44 cursor-pointer relative group">
                        <button 
                          type="button" 
                          onClick={() => toggleDocSelection(doc.id)} 
                          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            selectedDocs.has(doc.id) ? "bg-emerald-600 border-emerald-600 text-white opacity-100" : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {selectedDocs.has(doc.id) && <Check className="h-4 w-4" />}
                        </button>
                        <Link href={`/workspace/${workspaceId}/document/${doc.id}`}>
                          <div className={`h-56 rounded-xl overflow-hidden border bg-white relative ${selectedDocs.has(doc.id) ? "ring-2 ring-emerald-500" : ""}`}>
                            <iframe 
                              src={`${doc.previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              className="w-full h-full pointer-events-none"
                              title={doc.title}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600/90 to-transparent p-2 pt-6">
                              <div className="flex items-center gap-1.5">
                                <img src="/pdf-icon.svg" alt="PDF" className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs text-white truncate">{doc.title}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  }
                  return (
                    <div key={doc.id} className="w-44 cursor-pointer relative group">
                      <button 
                        type="button" 
                        onClick={() => toggleDocSelection(doc.id)} 
                        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedDocs.has(doc.id) ? "bg-emerald-600 border-emerald-600 text-white opacity-100" : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {selectedDocs.has(doc.id) && <Check className="h-4 w-4" />}
                      </button>
                      <Link href={`/workspace/${workspaceId}/document/${doc.id}`}>
                        <div className={`h-56 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border ${selectedDocs.has(doc.id) ? "ring-2 ring-emerald-500" : ""}`}>
                          <File className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="mt-1 text-[10px] truncate flex items-center gap-1 text-muted-foreground">
                          <File className="h-3 w-3" />
                          {doc.title}
                        </p>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => {
                  const date = new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const isSelected = selectedDocs.has(doc.id);
                  return (
                    <div key={doc.id} className="group flex items-center gap-2">
                      <button type="button" onClick={() => toggleDocSelection(doc.id)} className={`w-5 flex items-center justify-center transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                      <Link href={`/workspace/${workspaceId}/document/${doc.id}`} className={`flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 ${isSelected ? "ring-2 ring-emerald-500 bg-emerald-50/30" : ""}`}>
                        {doc.mime_type?.startsWith("image/") && doc.previewUrl ? (
                          <img src={doc.previewUrl} alt={doc.title} className="w-14 h-14 rounded-lg object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate flex items-center gap-1">
                            {doc.title}
                            {doc.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{date} · Image</p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPACT VIEW */}
            {viewMode === "compact" && (
              <div className="space-y-0">
                {filteredDocuments.map((doc, i) => {
                  const date = new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const isSelected = selectedDocs.has(doc.id);
                  return (
                    <div key={doc.id} className={`group flex items-center gap-2 ${i > 0 ? "mt-1" : ""}`}>
                      <button type="button" onClick={() => toggleDocSelection(doc.id)} className={`w-5 flex items-center justify-center transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                      <Link href={`/workspace/${workspaceId}/document/${doc.id}`} className={`flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 ${isSelected ? "ring-2 ring-emerald-500 bg-emerald-50/30" : ""}`}>
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm truncate flex items-center gap-2">
                          {doc.title}
                          {doc.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        </span>
                        <span className="text-xs text-muted-foreground">{date}</span>
                        <span className="text-xs text-muted-foreground w-16 text-right">Image</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Selection Action Bar */}
        <SelectionActionBar
          selectedCount={selectedDocs.size}
          folders={folders}
          showMovePopover={showMovePopover}
          onToggleMovePopover={() => setShowMovePopover(!showMovePopover)}
          onMoveToFolder={moveToFolder}
          onStar={starSelected}
          onDelete={deleteSelected}
          onClear={clearSelection}
        />
      </div>

      {/* Open Panels */}
      {openPanels.map((panel) => {
        const doc = documents.find(d => d.id === panel.docId);
        if (!doc) return null;
        return (
          <div
            key={panel.id}
            className="flex-shrink-0 border-l flex bg-white relative"
            style={{ width: panel.width }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500/50 z-10"
              onMouseDown={() => handleMouseDown(panel.id)}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Panel Header */}
            <div className="h-10 border-b flex items-center justify-between px-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground truncate">
                <Home className="h-3 w-3" />
                <ChevronRight className="h-3 w-3" />
                <ImageIcon className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{doc.title}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[10px]">Edited {new Date(doc.created_at).toLocaleDateString()}</span>
                <button type="button" className="p-1 hover:bg-muted rounded">
                  <Star className={`h-3 w-3 ${doc.is_starred ? "text-amber-500 fill-amber-500" : ""}`} />
                </button>
                <button type="button" onClick={() => closePanel(panel.id)} className="p-1 hover:bg-muted rounded">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Panel Toolbar */}
            <div className="flex items-center justify-end px-3 py-2 border-b">
              <div className="flex items-center gap-1 bg-white border rounded-xl shadow-sm px-1.5 py-0.5">
                <button type="button" className="p-1.5 hover:bg-muted rounded-xl">
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
                <button type="button" className="p-1.5 hover:bg-muted rounded-xl">
                  <Download className="h-3 w-3 text-muted-foreground" />
                </button>
                <button 
                  type="button"
                  onClick={() => doc.previewUrl && window.open(doc.previewUrl, "_blank")}
                  className="p-1.5 hover:bg-muted rounded-xl"
                >
                  <Maximize2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 overflow-hidden">
              {doc.mime_type?.startsWith("image/") && doc.previewUrl ? (
                <img
                  src={doc.previewUrl}
                  alt={doc.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <File className="h-16 w-16" />
                  <p className="text-xs">Preview not available</p>
                </div>
              )}
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
