"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Home, Trash2, Pencil, FolderClosed, Grid3X3, Link2, FileText, ImageIcon, File, Check, Move, Star, Share2, X, Lock, Globe, Upload, Eye, Copy, PanelRight } from "lucide-react";
import { AnimatedFolder } from "@/components/workspace/animated-folder";
import { SelectionActionBar } from "@/components/workspace/selection-action-bar";
import { DraggableItem } from "@/components/workspace/draggable-item";
import { DroppableFolder } from "@/components/workspace/droppable-folder";
import { MediaCard } from "@/components/workspace/media-card";
import { VideoCard } from "@/components/workspace/video-card";
import { NoteCard } from "@/components/workspace/note-card";
import { ScratchCard } from "@/components/workspace/scratch-card";
import { LinkCard } from "@/components/workspace/link-card";
import { CanvasCard } from "@/components/canvas/canvas-card";
import { WorkspaceToolbar, SortBy, SortDirection, ViewMode } from "@/components/workspace/workspace-toolbar";
import { WorkspaceStats } from "@/components/workspace/workspace-stats";
import { ActivityChart } from "@/components/workspace/activity-chart";
import Link from "next/link";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePanels } from "@/contexts/panel-context";

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}


interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  cover_image?: string | null;
}

interface Canvas {
  id: string;
  name: string;
  created_at: string;
}

interface Scratch {
  id: string;
  title: string;
  data?: any;
  thumbnail?: string | null;
  is_starred?: boolean;
  created_at: string;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  thumbnail_url?: string;
  video_url?: string;
  link_type?: string;
  created_at: string;
}

// Get badge info for link type
function getLinkTypeBadge(linkType?: string): { label: string; color: string } {
  switch (linkType) {
    case "youtube": return { label: "YouTube", color: "bg-red-600" };
    case "vimeo": return { label: "Vimeo", color: "bg-blue-500" };
    case "twitch": return { label: "Twitch", color: "bg-purple-600" };
    case "tiktok": return { label: "TikTok", color: "bg-black" };
    case "video": return { label: "Video", color: "bg-orange-500" };
    case "twitter": return { label: "X", color: "bg-black" };
    case "instagram": return { label: "Instagram", color: "bg-pink-500" };
    case "facebook": return { label: "Facebook", color: "bg-blue-600" };
    case "linkedin": return { label: "LinkedIn", color: "bg-blue-700" };
    case "reddit": return { label: "Reddit", color: "bg-orange-600" };
    case "spotify": return { label: "Spotify", color: "bg-green-600" };
    case "github": return { label: "GitHub", color: "bg-gray-800" };
    case "figma": return { label: "Figma", color: "bg-purple-500" };
    case "notion": return { label: "Notion", color: "bg-gray-900" };
    case "article": return { label: "Article", color: "bg-[var(--accent-primary)]" };
    case "pdf": return { label: "PDF", color: "bg-red-500" };
    case "image": return { label: "Image", color: "bg-indigo-500" };
    case "audio": return { label: "Audio", color: "bg-violet-500" };
    default: return { label: "Website", color: "bg-gray-600" };
  }
}

interface Document {
  id: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  previewUrl?: string;
  storage_path?: string;
  folder_id?: string | null;
  is_starred?: boolean;
  is_public?: boolean;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  workspace_id: string;
  parent_folder_id?: string | null;
  created_at: string;
}

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { openPanel } = usePanels();
  const workspaceId = params?.workspaceId;
  
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Data states
  const [notes, setNotes] = useState<Note[]>([]);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [scratches, setScratches] = useState<Scratch[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Document rename states
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState("");

  // Move popover state
  const [showMovePopover, setShowMovePopover] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortBy>("date_added");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Share popover state
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view");

  // Load workspace data
  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await res.json();
      if (data.workspace?.name) {
        setWorkspaceName(data.workspace.name);
      }
    } catch (error) {
      console.error("Failed to load workspace:", error);
    }
  }, [workspaceId]);

  // Load all data
  const loadAllData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [notesRes, canvasRes, linksRes, docsRes, foldersRes, scratchesRes] = await Promise.all([
        fetch(`/api/notes?workspaceId=${workspaceId}`),
        fetch(`/api/canvas?workspaceId=${workspaceId}`),
        fetch(`/api/links?workspaceId=${workspaceId}`),
        fetch(`/api/documents/list?workspaceId=${workspaceId}`),
        fetch(`/api/folders?workspaceId=${workspaceId}`),
        fetch(`/api/scratches?workspaceId=${workspaceId}`),
      ]);
      
      const [notesData, canvasData, linksData, docsData, foldersData, scratchesData] = await Promise.all([
        notesRes.json(),
        canvasRes.json(),
        linksRes.json(),
        docsRes.json(),
        foldersRes.json(),
        scratchesRes.json(),
      ]);
      
      if (notesData.notes) setNotes(notesData.notes);
      if (canvasData.canvases) setCanvases(canvasData.canvases);
      if (linksData.links) setLinks(linksData.links);
      if (docsData.documents) setDocuments(docsData.documents);
      if (foldersData.folders) setFolders(foldersData.folders);
      if (scratchesData.scratches) setScratches(scratchesData.scratches);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspace();
    loadAllData();
  }, [loadWorkspace, loadAllData]);

  useEffect(() => {
    if (refreshKey > 0) {
      loadAllData();
    }
  }, [refreshKey, loadAllData]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setEditName(workspaceName);
    setIsEditing(true);
  };

  const saveWorkspaceName = async () => {
    if (!editName.trim() || editName === workspaceName) {
      setIsEditing(false);
      return;
    }

    try {
      const res = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: editName.trim() }),
      });

      if (res.ok) {
        setWorkspaceName(editName.trim());
        // Dispatch event to notify sidebar to refresh workspaces
        window.dispatchEvent(new CustomEvent("workspace-renamed"));
      }
    } catch (error) {
      console.error("Failed to rename workspace:", error);
    } finally {
      setIsEditing(false);
    }
  };

  // Rename document
  const startEditingDoc = (docId: string, currentName: string) => {
    setEditingDocId(docId);
    setEditingDocName(currentName);
  };

  const saveDocName = async (docId: string) => {
    if (!editingDocName.trim()) {
      setEditingDocId(null);
      return;
    }

    try {
      const res = await fetch("/api/documents/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, name: editingDocName.trim() }),
      });

      if (res.ok) {
        setDocuments(docs => docs.map(d => 
          d.id === docId ? { ...d, title: editingDocName.trim() } : d
        ));
      }
    } catch (error) {
      console.error("Failed to rename document:", error);
    } finally {
      setEditingDocId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveWorkspaceName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  // Selection handlers
  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedDocs(new Set());
  };

  // Move selected documents to folder
  const moveToFolder = async (folderId: string | null) => {
    if (selectedDocs.size === 0) return;

    try {
      const res = await fetch("/api/documents/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: Array.from(selectedDocs),
          folderId,
        }),
      });

      if (res.ok) {
        setDocuments(docs => docs.map(d => 
          selectedDocs.has(d.id) ? { ...d, folder_id: folderId } : d
        ));
        clearSelection();
        setShowMovePopover(false);
      }
    } catch (error) {
      console.error("Failed to move documents:", error);
    }
  };

  // Delete selected documents
  const deleteSelected = async () => {
    if (selectedDocs.size === 0) return;

    try {
      const res = await fetch("/api/documents/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: Array.from(selectedDocs),
        }),
      });

      if (res.ok) {
        setDocuments(docs => docs.filter(d => !selectedDocs.has(d.id)));
        clearSelection();
      }
    } catch (error) {
      console.error("Failed to delete documents:", error);
    }
  };

  // Star selected documents
  const starSelected = async () => {
    if (selectedDocs.size === 0) return;

    try {
      const res = await fetch("/api/documents/star", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: Array.from(selectedDocs),
          starred: true,
        }),
      });

      if (res.ok) {
        setDocuments(docs => docs.map(d => 
          selectedDocs.has(d.id) ? { ...d, is_starred: true } : d
        ));
        clearSelection();
      }
    } catch (error) {
      console.error("Failed to star documents:", error);
    }
  };

  // Toggle public access for selected documents
  const togglePublicAccess = async (isPublic: boolean) => {
    if (selectedDocs.size === 0) return;

    try {
      const res = await fetch("/api/documents/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: Array.from(selectedDocs),
          isPublic,
        }),
      });

      if (res.ok) {
        setDocuments(docs => docs.map(d => 
          selectedDocs.has(d.id) ? { ...d, is_public: isPublic } : d
        ));
        setShowSharePopover(false);
      }
    } catch (error) {
      console.error("Failed to update public access:", error);
    }
  };

  // Filter documents that are not in any folder (root level)
  const rootDocuments = documents.filter(d => !d.folder_id);

  // Unified item type for sorting
  type UnifiedItem = {
    id: string;
    type: "note" | "canvas" | "link" | "document" | "scratch";
    name: string;
    created_at: string;
    data: Note | Canvas | LinkItem | Document | Scratch;
  };

  // Create unified list of all items
  const allItems: UnifiedItem[] = [
    ...notes.map(n => ({ id: n.id, type: "note" as const, name: n.title, created_at: n.created_at, data: n })),
    ...canvases.map(c => ({ id: c.id, type: "canvas" as const, name: c.name, created_at: c.created_at, data: c })),
    ...links.map(l => ({ id: l.id, type: "link" as const, name: l.title || l.url, created_at: l.created_at, data: l })),
    ...rootDocuments.map(d => ({ id: d.id, type: "document" as const, name: d.title, created_at: d.created_at, data: d })),
    ...scratches.map(s => ({ id: s.id, type: "scratch" as const, name: s.title, created_at: s.created_at, data: s })),
  ];

  // Filter items by search query
  const filteredItems = searchQuery.trim()
    ? allItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems;

  // Sort unified items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "date_added":
      case "last_modified":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Handle folder created from toolbar
  const handleFolderCreated = (folder: { id: string; name: string }) => {
    setFolders(prev => [...prev, { ...folder, workspace_id: workspaceId || "", created_at: new Date().toISOString() }]);
  };

  // Handle drag-and-drop to folder for all item types
  const handleDropToFolder = async (folderId: string, itemId: string, itemType: string) => {
    try {
      let endpoint = "";
      let body: any = {};

      switch (itemType) {
        case "document":
          endpoint = "/api/documents/move";
          body = { documentIds: [itemId], folderId };
          break;
        case "note":
          endpoint = `/api/notes/${itemId}`;
          body = { folder_id: folderId };
          break;
        case "link":
          endpoint = `/api/links/${itemId}`;
          body = { folder_id: folderId };
          break;
        case "canvas":
          endpoint = `/api/canvas/${itemId}`;
          body = { folder_id: folderId };
          break;
        case "scratch":
          endpoint = `/api/scratches/${itemId}`;
          body = { folder_id: folderId };
          break;
        default:
          return;
      }

      const method = itemType === "document" ? "PATCH" : "PATCH";
      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Update local state based on item type
      if (itemType === "document") {
        setDocuments(docs => docs.map(d => 
          d.id === itemId ? { ...d, folder_id: folderId } : d
        ));
      } else if (itemType === "note") {
        setNotes(prev => prev.filter(n => n.id !== itemId));
      } else if (itemType === "link") {
        setLinks(prev => prev.filter(l => l.id !== itemId));
      } else if (itemType === "canvas") {
        setCanvases(prev => prev.filter(c => c.id !== itemId));
      } else if (itemType === "scratch") {
        setScratches(prev => prev.filter(s => s.id !== itemId));
      }
    } catch (error) {
      console.error(`Failed to move ${itemType} to folder:`, error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
        <div className="p-6 pr-8">
          {/* Workspace Toolbar */}
          <WorkspaceToolbar
            workspaceId={workspaceId || ""}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onFolderCreated={handleFolderCreated}
            onCreated={() => setRefreshKey(k => k + 1)}
          />

          {/* Statistics & Activity Section */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <WorkspaceStats
                notesCount={notes.length}
                canvasesCount={canvases.length}
                linksCount={links.length}
                mediaCount={documents.length}
                scratchesCount={scratches.length}
                foldersCount={folders.length}
              />
              <ActivityChart workspaceId={workspaceId || ""} />
            </div>
          )}

          {/* Content */}
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : (
            <div className="space-y-6 mt-6">
              {(sortedItems.length > 0 || folders.length > 0) ? (
                <>
                  {/* GRID VIEW */}
                  {viewMode === "grid" && (
                    <div className="flex flex-wrap gap-4">
                      {/* Folders - droppable */}
                      {folders.map((folder) => {
                        const folderDocs = documents.filter(d => d.folder_id === folder.id);
                        return (
                          <DroppableFolder
                            key={`folder-${folder.id}`}
                            folderId={folder.id}
                            folderName={folder.name}
                            workspaceId={workspaceId || ""}
                            fileCount={folderDocs.length}
                            previewFiles={folderDocs.slice(0, 3).map(d => ({ 
                              type: d.mime_type, 
                              name: d.title, 
                              previewUrl: d.previewUrl 
                            }))}
                            onDrop={handleDropToFolder}
                            acceptTypes={["document", "note", "link", "canvas", "scratch"]}
                          />
                        );
                      })}
                      {/* Items - draggable */}
                      {sortedItems.map((item) => {
                        const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        if (item.type === "note") {
                          const note = item.data as Note;
                          const plainTitle = stripHtml(note.title) || "Untitled";
                          return (
                            <DraggableItem key={`note-${note.id}`} itemId={note.id} itemType="note">
                              <div className="w-44">
                                <NoteCard
                                  note={{
                                    ...note,
                                    is_starred: false,
                                  }}
                                  isSelected={false}
                                  onSelect={() => {}}
                                  onClick={() => router.push(`/workspace/${workspaceId}/notes/${note.id}`)}
                                  onOpenInPanel={() => openPanel({
                                    type: "note",
                                    itemId: note.id,
                                    title: plainTitle,
                                  })}
                                />
                              </div>
                            </DraggableItem>
                          );
                        }
                        if (item.type === "link") {
                          const link = item.data as LinkItem;
                          return (
                            <DraggableItem key={`link-${link.id}`} itemId={link.id} itemType="link">
                              <LinkCard
                                id={link.id}
                                url={link.url}
                                title={link.title}
                                thumbnailUrl={link.thumbnail_url}
                                linkType={link.link_type}
                                isSelected={false}
                                onCheckboxClick={() => {}}
                                workspaceId={workspaceId || ""}
                              />
                            </DraggableItem>
                          );
                        }
                        if (item.type === "canvas") {
                          const canvas = item.data as Canvas;
                          return (
                            <DraggableItem key={`canvas-${canvas.id}`} itemId={canvas.id} itemType="canvas">
                              <div className="w-80">
                                <CanvasCard
                                  id={canvas.id}
                                  name={canvas.name}
                                  createdAt={canvas.created_at}
                                  workspaceId={workspaceId || ""}
                                />
                              </div>
                            </DraggableItem>
                          );
                        }
                        if (item.type === "document") {
                          const doc = item.data as Document;
                          if (doc.mime_type?.startsWith("image/") && doc.previewUrl) {
                            return (
                              <DraggableItem key={`doc-${doc.id}`} itemId={doc.id} itemType="document">
                                <MediaCard
                                  src={doc.previewUrl}
                                  alt={doc.title}
                                  title={doc.title}
                                  isSelected={selectedDocs.has(doc.id)}
                                  isStarred={doc.is_starred}
                                  onCheckboxClick={() => toggleDocSelection(doc.id)}
                                  href={`/workspace/${workspaceId}/document/${doc.id}`}
                                />
                              </DraggableItem>
                            );
                          }
                          // Video with preview
                          if (doc.mime_type?.startsWith("video/") && doc.previewUrl) {
                            return (
                              <DraggableItem key={`doc-${doc.id}`} itemId={doc.id} itemType="document">
                                <VideoCard
                                  src={doc.previewUrl}
                                  alt={doc.title}
                                  title={doc.title}
                                  isSelected={selectedDocs.has(doc.id)}
                                  isStarred={doc.is_starred}
                                  onCheckboxClick={() => toggleDocSelection(doc.id)}
                                  href={`/workspace/${workspaceId}/document/${doc.id}`}
                                />
                              </DraggableItem>
                            );
                          }
                          // PDF with preview
                          if (doc.mime_type === "application/pdf" && doc.previewUrl) {
                            return (
                              <DraggableItem key={`doc-${doc.id}`} itemId={doc.id} itemType="document">
                                <div className="w-44 cursor-pointer relative group">
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); toggleDocSelection(doc.id); }} 
                                  className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                    selectedDocs.has(doc.id) 
                                      ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white opacity-100" 
                                      : "bg-white/80 border-gray-300 hover:border-[var(--accent-primary)] opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  {selectedDocs.has(doc.id) && <Check className="h-4 w-4" />}
                                </button>
                                {doc.is_starred && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <Star className="h-5 w-5 text-amber-500 fill-amber-500 drop-shadow-md" />
                                  </div>
                                )}
                                <Link href={`/workspace/${workspaceId}/document/${doc.id}`}>
                                  <div className={`h-56 rounded-xl overflow-hidden border bg-white relative ${selectedDocs.has(doc.id) ? "ring-2 ring-[var(--accent-primary)]" : ""}`}>
                                    <iframe 
                                      src={`${doc.previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                      className="w-full h-full pointer-events-none scale-100"
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
                              </DraggableItem>
                            );
                          }
                          return (
                            <DraggableItem key={`doc-${doc.id}`} itemId={doc.id} itemType="document">
                              <div className="w-44 cursor-pointer relative group">
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); toggleDocSelection(doc.id); }} 
                                className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                  selectedDocs.has(doc.id) 
                                    ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white opacity-100" 
                                    : "bg-white/80 border-gray-300 hover:border-[var(--accent-primary)] opacity-0 group-hover:opacity-100"
                                }`}
                              >
                                {selectedDocs.has(doc.id) && <Check className="h-4 w-4" />}
                              </button>
                              {doc.is_starred && (
                                <div className="absolute top-2 right-2 z-10">
                                  <Star className="h-5 w-5 text-amber-500 fill-amber-500 drop-shadow-md" />
                                </div>
                              )}
                              <Link href={`/workspace/${workspaceId}/document/${doc.id}`}>
                                <div className={`h-56 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border ${selectedDocs.has(doc.id) ? "ring-2 ring-[var(--accent-primary)]" : ""}`}>
                                  <File className="h-12 w-12 text-gray-400" />
                                </div>
                                <p className="mt-1 text-[10px] truncate flex items-center gap-1 text-muted-foreground">
                                  <File className="h-3 w-3" />
                                  {doc.title}
                                </p>
                              </Link>
                              </div>
                            </DraggableItem>
                          );
                        }
                        if (item.type === "scratch") {
                          const scratch = item.data as Scratch;
                          return (
                            <DraggableItem key={`scratch-${scratch.id}`} itemId={scratch.id} itemType="scratch">
                              <div className="w-44">
                                <ScratchCard
                                  scratch={scratch}
                                  isSelected={false}
                                  onSelect={() => {}}
                                  onClick={() => router.push(`/workspace/${workspaceId}/scretch/${scratch.id}`)}
                                />
                              </div>
                            </DraggableItem>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  {/* LIST VIEW - with preview */}
                  {viewMode === "list" && (
                    <div className="space-y-2">
                      {folders.map((folder) => (
                        <div key={`folder-${folder.id}`} className="group flex items-center gap-2">
                          <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-4 h-4 rounded border-2 border-gray-300" />
                          </div>
                          <Link href={`/workspace/${workspaceId}/folder/${folder.id}`} className="flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-all group-hover:ml-0">
                            <div className="w-14 h-14 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0"><FolderClosed className="h-6 w-6 text-amber-500" /></div>
                            <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{folder.name}</p><p className="text-xs text-muted-foreground">Folder</p></div>
                          </Link>
                        </div>
                      ))}
                      {sortedItems.map((item) => {
                        const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        const isDoc = item.type === "document";
                        const docId = isDoc ? (item.data as Document).id : null;
                        const isSelected = docId ? selectedDocs.has(docId) : false;
                        
                        if (item.type === "note") {
                          const note = item.data as Note;
                          const plainTitle = stripHtml(note.title) || "Untitled";
                          return (
                            <div key={`note-${note.id}`} className="group flex items-center gap-2">
                              <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-4 h-4 rounded border-2 border-gray-300" />
                              </div>
                              <Link href={`/workspace/${workspaceId}/notes/${note.id}`} className="flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-all cursor-pointer">
                                <div className="w-14 h-14 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center flex-shrink-0"><FileText className="h-6 w-6 text-[var(--accent-primary-light)]" /></div>
                                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{plainTitle}</p><p className="text-xs text-muted-foreground">{date} · Note</p></div>
                              </Link>
                            </div>
                          );
                        }
                        if (item.type === "link") {
                          const link = item.data as LinkItem;
                          const isVideo = link.link_type === "youtube" || link.link_type === "vimeo" || link.link_type === "twitch" || link.link_type === "tiktok" || link.link_type === "video" || link.url.includes("youtube.com") || link.url.includes("youtu.be") || link.url.includes("vimeo.com") || link.url.includes("twitch.tv");
                          const badge = getLinkTypeBadge(link.link_type);
                          
                          // Videos öffnen Detail-Seite, Websites öffnen externe URL
                          const ListCardWrapper = isVideo ? Link : 'a';
                          const listCardProps = isVideo 
                            ? { href: `/workspace/${workspaceId}/links/${link.id}` }
                            : { href: link.url, target: "_blank", rel: "noopener noreferrer" };
                          
                          return (
                            <div key={`link-${link.id}`} className="group flex items-center gap-2">
                              <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-4 h-4 rounded border-2 border-gray-300" />
                              </div>
                              <ListCardWrapper {...listCardProps as any} className="flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-all">
                                <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${isVideo ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
                                  {isVideo ? <div className="w-0 h-0 border-l-[8px] border-l-red-500 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" /> : <Globe className="h-6 w-6 text-blue-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{link.title || link.url}</p>
                                  <p className="text-xs text-muted-foreground">{date} · {badge.label}</p>
                                </div>
                                {!isVideo && <Globe className="h-4 w-4 text-muted-foreground" />}
                              </ListCardWrapper>
                            </div>
                          );
                        }
                        if (item.type === "canvas") {
                          const canvas = item.data as Canvas;
                          return (
                            <div key={`canvas-${canvas.id}`} className="group flex items-center gap-2">
                              <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-4 h-4 rounded border-2 border-gray-300" />
                              </div>
                              <div className="flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-all cursor-pointer">
                                <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"><Grid3X3 className="h-6 w-6 text-gray-500" /></div>
                                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{canvas.name}</p><p className="text-xs text-muted-foreground">{date} · CanvasV2</p></div>
                              </div>
                            </div>
                          );
                        }
                        if (item.type === "document") {
                          const doc = item.data as Document;
                          return (
                            <div key={`doc-${doc.id}`} className="group flex items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => toggleDocSelection(doc.id)}
                                className={`w-5 flex items-center justify-center transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                              >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-gray-300 hover:border-[var(--accent-primary)]"}`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                              </button>
                              <Link 
                                href={`/workspace/${workspaceId}/document/${doc.id}`}
                                className={`flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-all cursor-pointer ${isSelected ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/10/30" : ""}`}
                              >
                                {doc.mime_type?.startsWith("image/") && doc.previewUrl ? (
                                  <img src={doc.previewUrl} alt={doc.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"><ImageIcon className="h-6 w-6 text-gray-400" /></div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate flex items-center gap-1">
                                    {doc.title}
                                    {doc.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{date} · Image</p>
                                </div>
                              </Link>
                            </div>
                          );
                        }
                        if (item.type === "scratch") {
                          const scratch = item.data as Scratch;
                          return (
                            <div key={`scratch-${scratch.id}`} className="group flex items-center gap-2">
                              <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-4 h-4 rounded border-2 border-gray-300" />
                              </div>
                              <Link href={`/workspace/${workspaceId}/scretch/${scratch.id}`} className="flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-all cursor-pointer">
                                <div className="w-14 h-14 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0"><Pencil className="h-6 w-6 text-violet-600" /></div>
                                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{scratch.title || "Untitled"}</p><p className="text-xs text-muted-foreground">{date} · Scratch</p></div>
                              </Link>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  {/* COMPACT VIEW - text only */}
                  {viewMode === "compact" && (
                    <div className="space-y-0">
                      {folders.map((folder, i) => (
                        <div key={`folder-${folder.id}`} className="group flex items-center gap-2">
                          <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-4 h-4 rounded border-2 border-gray-300" />
                          </div>
                          <Link href={`/workspace/${workspaceId}/folder/${folder.id}`} className={`flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 ${i > 0 ? "mt-1" : ""}`}>
                            <FolderClosed className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <span className="flex-1 text-sm truncate">{folder.name}</span>
                            <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            <span className="text-xs text-muted-foreground w-16 text-right">Folder</span>
                          </Link>
                        </div>
                      ))}
                      {sortedItems.map((item, i) => {
                        const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        const isDoc = item.type === "document";
                        const isNote = item.type === "note";
                        const isLink = item.type === "link";
                        const docId = isDoc ? (item.data as Document).id : null;
                        const noteId = isNote ? (item.data as Note).id : null;
                        const isSelected = docId ? selectedDocs.has(docId) : false;
                        const displayName = isNote ? (stripHtml(item.name) || "Untitled") : item.name;
                        
                        // Link-spezifische Variablen
                        const linkData = isLink ? (item.data as LinkItem) : null;
                        const isVideo = linkData ? (linkData.link_type === "youtube" || linkData.link_type === "vimeo" || linkData.link_type === "twitch" || linkData.link_type === "tiktok" || linkData.link_type === "video" || linkData.url.includes("youtube.com") || linkData.url.includes("youtu.be") || linkData.url.includes("vimeo.com") || linkData.url.includes("twitch.tv")) : false;
                        const linkBadge = linkData ? getLinkTypeBadge(linkData.link_type) : null;
                        
                        const Icon = item.type === "note" ? FileText : item.type === "link" ? (isVideo ? Link2 : Globe) : item.type === "canvas" ? Grid3X3 : ImageIcon;
                        const typeLabel = item.type === "note" ? "Note" : item.type === "link" ? (linkBadge?.label || "Website") : item.type === "canvas" ? "CanvasV2" : "Image";
                        
                        return (
                          <div key={`${item.type}-${item.id}`} className={`group flex items-center gap-2 ${(i > 0 || folders.length > 0) ? "mt-1" : ""}`}>
                            <button
                              type="button"
                              onClick={() => isDoc && docId && toggleDocSelection(docId)}
                              className={`w-5 flex items-center justify-center transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-gray-300 hover:border-[var(--accent-primary)]"}`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </button>
                            {isDoc ? (
                              <Link 
                                href={`/workspace/${workspaceId}/document/${docId}`}
                                className={`flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 cursor-pointer ${isSelected ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/10/30" : ""}`}
                              >
                                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="flex-1 text-sm truncate flex items-center gap-2">
                                  {displayName}
                                  {(item.data as Document).is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                </span>
                                <span className="text-xs text-muted-foreground">{date}</span>
                                <span className="text-xs text-muted-foreground w-16 text-right">{typeLabel}</span>
                              </Link>
                            ) : isNote ? (
                              <Link 
                                href={`/workspace/${workspaceId}/notes/${noteId}`}
                                className="flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 cursor-pointer"
                              >
                                <Icon className="h-4 w-4 text-[var(--accent-primary-light)] flex-shrink-0" />
                                <span className="flex-1 text-sm truncate">{displayName}</span>
                                <span className="text-xs text-muted-foreground">{date}</span>
                                <span className="text-xs text-muted-foreground w-16 text-right">{typeLabel}</span>
                              </Link>
                            ) : isLink && linkData ? (
                              isVideo ? (
                                <Link 
                                  href={`/workspace/${workspaceId}/links/${linkData.id}`}
                                  className="flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                >
                                  <Icon className="h-4 w-4 text-red-500 flex-shrink-0" />
                                  <span className="flex-1 text-sm truncate">{displayName}</span>
                                  <span className="text-xs text-muted-foreground">{date}</span>
                                  <span className="text-xs text-muted-foreground w-16 text-right">{typeLabel}</span>
                                </Link>
                              ) : (
                                <a 
                                  href={linkData.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                >
                                  <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <span className="flex-1 text-sm truncate">{displayName}</span>
                                  <span className="text-xs text-muted-foreground">{date}</span>
                                  <span className="text-xs text-muted-foreground w-16 text-right">{typeLabel}</span>
                                  <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                </a>
                              )
                            ) : (
                              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="flex-1 text-sm truncate">{displayName}</span>
                                <span className="text-xs text-muted-foreground">{date}</span>
                                <span className="text-xs text-muted-foreground w-16 text-right">{typeLabel}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">No items yet. Create something above!</p>
              )}
            </div>
          )}
        </div>

        {/* Selection Action Bar */}
        <SelectionActionBar
          selectedCount={selectedDocs.size}
          folders={folders}
          showMovePopover={showMovePopover}
          onToggleMovePopover={() => setShowMovePopover(!showMovePopover)}
          onMoveToFolder={moveToFolder}
          onStar={starSelected}
          onShare={() => setShowSharePopover(true)}
          onDelete={deleteSelected}
          onClear={clearSelection}
        />

        {/* Share Modal */}
        {showSharePopover && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={() => setShowSharePopover(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 min-h-[500px] max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">Share Item</h2>
                    <p className="text-sm text-muted-foreground">Control who can access this item</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSharePopover(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Public Access Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      {Array.from(selectedDocs).some(id => documents.find(d => d.id === id)?.is_public) 
                        ? <Globe className="h-5 w-5 text-[var(--accent-primary-light)]" />
                        : <Lock className="h-5 w-5 text-gray-500" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">Public Access</p>
                      <p className="text-sm text-muted-foreground">
                        {Array.from(selectedDocs).some(id => documents.find(d => d.id === id)?.is_public) 
                          ? "Anyone with the link can access" 
                          : "Private - only you can access"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const anyPublic = Array.from(selectedDocs).some(id => documents.find(d => d.id === id)?.is_public);
                      togglePublicAccess(!anyPublic);
                    }}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      Array.from(selectedDocs).some(id => documents.find(d => d.id === id)?.is_public)
                        ? "bg-[var(--accent-primary)]/100"
                        : "bg-gray-200"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      Array.from(selectedDocs).some(id => documents.find(d => d.id === id)?.is_public)
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Permission Level - only show when public */}
                {Array.from(selectedDocs).some(id => documents.find(d => d.id === id)?.is_public) && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Permission Level</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSharePermission("view")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            sharePermission === "view" 
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="h-4 w-4" />
                            <span className="font-medium">View</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Can browse and view</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSharePermission("edit")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            sharePermission === "edit" 
                              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Pencil className="h-4 w-4" />
                            <span className="font-medium">Edit</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Can edit content</p>
                        </button>
                      </div>

                      {/* Warning when Edit is selected */}
                      {sharePermission === "edit" && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mt-3">
                          <div className="text-amber-600 mt-0.5">⚠</div>
                          <div>
                            <p className="text-sm font-medium text-amber-700">Public editing enabled</p>
                            <p className="text-xs text-amber-600">Anyone with the link can make permanent changes</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Public Link */}
                    <div
                      onClick={() => {
                        const url = `${window.location.origin}/public/${Array.from(selectedDocs)[0]}`;
                        navigator.clipboard.writeText(url);
                      }}
                      className="flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">Public Link</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {`${typeof window !== 'undefined' ? window.location.origin : ''}/public/${Array.from(selectedDocs)[0]}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
