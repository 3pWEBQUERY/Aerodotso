"use client";

import { X, Home, StickyNote, Star, MoreHorizontal, GripVertical, ArrowLeft, ExternalLink, Pencil, FolderInput, History, Download, Trash2, Info, ChevronRight, Users, FolderClosed, Check } from "lucide-react";
import { usePanels, Panel, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH } from "@/contexts/panel-context";
import { useState, useEffect, useCallback, useRef, MouseEvent as ReactMouseEvent } from "react";
import { RichTextEditor } from "./rich-text-editor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Note {
  id: string;
  title: string;
  content: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
  workspace_id: string;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// Resize Handle Component
function ResizeHandle({ 
  onResize 
}: { 
  onResize: (delta: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const delta = startXRef.current - e.clientX;
      startXRef.current = e.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onResize]);

  return (
    <div
      className={`
        absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group
        hover:bg-[var(--accent-primary)]/100 transition-colors
        ${isDragging ? "bg-[var(--accent-primary)]/100" : "bg-transparent"}
      `}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

// Single Panel Component
function SinglePanel({ 
  panel, 
  workspaceId,
  onClose,
  onResize
}: { 
  panel: Panel;
  workspaceId: string;
  onClose: () => void;
  onResize: (delta: number) => void;
}) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const fetchNote = useCallback(async () => {
    if (panel.type !== "note") return;
    try {
      const response = await fetch(`/api/notes/${panel.itemId}`);
      if (response.ok) {
        const { note } = await response.json();
        setNote(note);
        setTitle(note.title || "");
        setContent(note.content || "");
        setIsStarred(note.is_starred || false);
        setCurrentFolderId(note.folder_id || null);
      }
    } catch (error) {
      console.error("Failed to fetch note:", error);
    } finally {
      setLoading(false);
    }
  }, [panel.itemId, panel.type]);

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch(`/api/folders?workspaceId=${workspaceId}`);
      if (response.ok) {
        const { folders } = await response.json();
        setFolders(folders || []);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchNote();
    fetchFolders();
  }, [fetchNote, fetchFolders]);

  const saveNote = useCallback(async (newTitle: string, newContent: string) => {
    setSaving(true);
    try {
      await fetch(`/api/notes/${panel.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
    }
  }, [panel.itemId]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveNote(newTitle, content), 1000);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveNote(title, newContent), 1000);
  };

  const toggleStarred = async () => {
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    try {
      await fetch(`/api/notes/${panel.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newStarred }),
      });
    } catch (error) {
      console.error("Failed to toggle star:", error);
      setIsStarred(!newStarred);
    }
  };

  const deleteNote = async () => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await fetch(`/api/notes/${panel.itemId}`, { method: "DELETE" });
      onClose();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const moveToFolder = async (folderId: string | null) => {
    try {
      await fetch(`/api/notes/${panel.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      setCurrentFolderId(folderId);
      setMoveMenuOpen(false);
      setMoreMenuOpen(false);
    } catch (error) {
      console.error("Failed to move note:", error);
    }
  };

  const downloadNote = () => {
    const plainTitle = stripHtml(title) || "Untitled";
    const plainContent = stripHtml(content);
    
    // Create content with title and content
    const fileContent = `# ${plainTitle}\n\n${plainContent}`;
    
    // Create blob and download
    const blob = new Blob([fileContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plainTitle.replace(/[^a-z0-9]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMoreMenuOpen(false);
  };

  // Format date for version history
  const formatVersionDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const startEditingTitle = () => {
    setEditingTitleValue(stripHtml(title) || "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveEditingTitle = async () => {
    if (!editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const newTitle = editingTitleValue.trim();
    setTitle(newTitle);
    setIsEditingTitle(false);
    try {
      await fetch(`/api/notes/${panel.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save title:", error);
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitleValue("");
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "Edited now";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 5) return "Edited now";
    if (diff < 60) return `Edited ${diff}s ago`;
    if (diff < 3600) return `Edited ${Math.floor(diff / 60)}m ago`;
    return `Edited ${Math.floor(diff / 3600)}h ago`;
  };

  const plainTitle = stripHtml(title) || "Untitled";

  if (loading) {
    return (
      <div 
        className="h-full bg-white border-l border-gray-200 flex flex-col relative"
        style={{ width: panel.width }}
      >
        <ResizeHandle onResize={onResize} />
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full bg-white border-l border-gray-200 flex flex-col relative flex-shrink-0"
      style={{ width: panel.width }}
    >
      {/* Resize Handle */}
      <ResizeHandle onResize={onResize} />

      {/* Panel Header - IDENTICAL to main note view */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/workspace/${workspaceId}`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-1 text-gray-700">
              <StickyNote className="h-3.5 w-3.5" />
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={saveEditingTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditingTitle();
                    if (e.key === "Escape") cancelEditingTitle();
                  }}
                  className="font-medium bg-white border border-[var(--accent-primary)] rounded px-1 py-0.5 outline-none min-w-[100px]"
                />
              ) : (
                <span 
                  className="font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                  onClick={startEditingTitle}
                  title="Click to rename"
                >
                  {plainTitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {saving ? "Saving..." : formatLastSaved()}
          </span>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Share
          </button>
          <button
            type="button"
            onClick={toggleStarred}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Star className={`h-4 w-4 ${isStarred ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
          </button>
          
          {/* More Menu - IDENTICAL to main note view */}
          <Popover open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  window.open(`/workspace/${workspaceId}/notes/${panel.itemId}`, "_blank");
                  setMoreMenuOpen(false);
                }}
              >
                <ExternalLink className="h-4 w-4 text-gray-500" />
                Open in new tab
              </button>
              
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  toggleStarred();
                  setMoreMenuOpen(false);
                }}
              >
                <Star className={`h-4 w-4 ${isStarred ? "text-amber-500" : "text-gray-500"}`} />
                {isStarred ? "Unstar" : "Star"}
              </button>
              
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  setMoreMenuOpen(false);
                  startEditingTitle();
                }}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
                Rename
              </button>
              
              {/* Move to submenu */}
              <Popover open={moveMenuOpen} onOpenChange={setMoveMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <FolderInput className="h-4 w-4 text-gray-500" />
                      Move to
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1" side="left" align="start">
                  <button
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md ${
                      currentFolderId === null ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => moveToFolder(null)}
                  >
                    <Home className="h-4 w-4" />
                    Root (No Folder)
                    {currentFolderId === null && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                  {folders.length > 0 && <div className="h-px bg-gray-100 my-1" />}
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md ${
                        currentFolderId === folder.id ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => moveToFolder(folder.id)}
                    >
                      <FolderClosed className="h-4 w-4" />
                      <span className="truncate">{folder.name}</span>
                      {currentFolderId === folder.id && <Check className="h-4 w-4 ml-auto" />}
                    </button>
                  ))}
                  {folders.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-2">No folders yet</p>
                  )}
                </PopoverContent>
              </Popover>
              
              {/* Version History submenu */}
              <Popover open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-gray-500" />
                      Version History
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" side="left" align="start">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">Version History</h4>
                    <div className="h-px bg-gray-100" />
                    
                    {/* Current Version */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-[var(--accent-primary)]/10 rounded-lg border border-[var(--accent-primary)]/30">
                        <div>
                          <p className="text-xs font-medium text-[var(--accent-primary)]">Current Version</p>
                          <p className="text-xs text-[var(--accent-primary-light)]">
                            {note?.updated_at ? formatVersionDate(new Date(note.updated_at)) : "Just now"}
                          </p>
                        </div>
                        <span className="text-xs text-[var(--accent-primary-light)] bg-[var(--accent-primary)]/20 px-2 py-0.5 rounded">Active</span>
                      </div>
                      
                      {/* Previous versions placeholder */}
                      <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100">
                        <p className="text-xs font-medium text-gray-700">Created</p>
                        <p className="text-xs text-gray-500">
                          {note?.created_at ? formatVersionDate(new Date(note.created_at)) : "Unknown"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-px bg-gray-100" />
                    <p className="text-xs text-gray-400 text-center">
                      Auto-save enabled • Versions are saved automatically
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={downloadNote}
              >
                <Download className="h-4 w-4 text-gray-500" />
                Download
              </button>
              
              <div className="h-px bg-gray-100 my-1" />
              
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                onClick={() => {
                  setMoreMenuOpen(false);
                  deleteNote();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              
              <div className="h-px bg-gray-100 my-1" />
              
              {/* Information submenu */}
              <Popover open={infoMenuOpen} onOpenChange={setInfoMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="h-4 w-4 text-gray-500" />
                      Information
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="left" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Visible to</span>
                      <span className="text-[var(--accent-primary-light)] font-medium">Workspace members</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-medium">Created:</span> {note?.created_at ? new Date(note.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }) : "Unknown"}</p>
                      <p><span className="font-medium">Modified:</span> {note?.updated_at ? new Date(note.updated_at).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }) : "Unknown"}</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Panel Content - IDENTICAL styling to main note view */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Title */}
          <div className="mb-8 title-editor">
            <RichTextEditor
              content={title}
              onUpdate={handleTitleChange}
              placeholder="Heading"
              className="title-style"
            />
          </div>
          <style jsx>{`
            .title-editor :global(.ProseMirror) {
              min-height: auto !important;
            }
            .title-editor :global(.ProseMirror p) {
              font-size: 2.5rem;
              font-weight: 300;
              color: #111827;
              margin: 0;
            }
            .title-editor :global(.ProseMirror p.is-editor-empty:first-child::before) {
              font-size: 2.5rem;
              font-weight: 300;
              font-style: italic;
            }
          `}</style>

          {/* Rich Text Content */}
          <RichTextEditor
            content={content}
            onUpdate={handleContentChange}
            placeholder="Start writing..."
          />
        </div>
      </div>
    </div>
  );
}

// Main Side Panel Container - Renders all panels
export function SidePanel({ workspaceId }: { workspaceId: string }) {
  const { panels, closePanel, updatePanelWidth, isPanelOpen } = usePanels();

  if (!isPanelOpen || panels.length === 0) {
    return null;
  }

  return (
    <div className="flex h-full">
      {panels.map((panel) => (
        <SinglePanel
          key={panel.id}
          panel={panel}
          workspaceId={workspaceId}
          onClose={() => closePanel(panel.id)}
          onResize={(delta) => updatePanelWidth(panel.id, panel.width + delta)}
        />
      ))}
    </div>
  );
}
