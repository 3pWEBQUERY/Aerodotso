"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Home, StickyNote, Star, Share2, MoreHorizontal, ExternalLink, Pencil, FolderInput, History, Download, Trash2, Info, ChevronRight, Users, PanelRight, FolderClosed, Check, ImageIcon, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { RichTextEditor } from "@/components/workspace/rich-text-editor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePanels } from "@/contexts/panel-context";

interface Note {
  id: string;
  title: string;
  content: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
  folder_id?: string | null;
  cover_image?: string | null;
}

interface Folder {
  id: string;
  name: string;
  workspace_id: string;
}

export default function NotePage() {
  const params = useParams<{ workspaceId: string; noteId: string }>();
  const router = useRouter();
  const { openPanel } = usePanels();
  const workspaceId = params?.workspaceId;
  const noteId = params?.noteId;
  
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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch note
  const fetchNote = useCallback(async () => {
    if (!noteId) return;
    try {
      const response = await fetch(`/api/notes/${noteId}`);
      if (response.ok) {
        const { note } = await response.json();
        setNote(note);
        setTitle(note.title || "");
        setContent(note.content || "");
        setIsStarred(note.is_starred || false);
        setCurrentFolderId(note.folder_id || null);
        setCoverImage(note.cover_image || null);
      } else {
        router.push(`/workspace/${workspaceId}/notes`);
      }
    } catch (error) {
      console.error("Failed to fetch note:", error);
    } finally {
      setLoading(false);
    }
  }, [noteId, workspaceId, router]);

  // Fetch folders for move functionality
  const fetchFolders = useCallback(async () => {
    if (!workspaceId) return;
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

  // Auto-save function
  const saveNote = useCallback(async (newTitle: string, newContent: string) => {
    if (!noteId) return;
    setSaving(true);
    
    try {
      await fetch(`/api/notes/${noteId}`, {
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
  }, [noteId]);

  // Debounced auto-save
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

  // Extract plain text from HTML
  const getPlainText = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  // Toggle starred
  const toggleStarred = async () => {
    if (!noteId) return;
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newStarred }),
      });
    } catch (error) {
      console.error("Failed to toggle star:", error);
      setIsStarred(!newStarred); // Revert on error
    }
  };

  // Delete note
  const deleteNote = async () => {
    if (!noteId) return;
    
    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      router.push(`/workspace/${workspaceId}/notes`);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  // Move note to folder
  const moveToFolder = async (folderId: string | null) => {
    if (!noteId) return;
    try {
      await fetch(`/api/notes/${noteId}`, {
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

  // Download note as markdown
  const downloadNote = () => {
    const plainTitle = getPlainText(title) || "Untitled";
    const plainContent = getPlainText(content);
    
    const fileContent = `# ${plainTitle}\n\n${plainContent}`;
    
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

  // Upload cover image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !noteId) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("noteId", noteId);

      const response = await fetch("/api/notes/upload-cover", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { coverImageUrl } = await response.json();
        setCoverImage(coverImageUrl);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Inline title editing
  const startEditingTitle = () => {
    setEditingTitleValue(getPlainText(title) || "");
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
      await fetch(`/api/notes/${noteId}`, {
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

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return "Edited now";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 5) return "Edited now";
    if (diff < 60) return `Edited ${diff}s ago`;
    return `Edited ${Math.floor(diff / 60)}m ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/workspace/${workspaceId}/notes`)}
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
                  {getPlainText(title) || "Untitled Note"}
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
          
          {/* More Menu */}
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
                  if (noteId) {
                    openPanel({
                      type: "note",
                      itemId: noteId,
                      title: getPlainText(title) || "Untitled Note",
                    });
                  }
                  setMoreMenuOpen(false);
                }}
              >
                <PanelRight className="h-4 w-4 text-gray-500" />
                Open in new pane
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
                  setDeleteDialogOpen(true);
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

      {/* Editor */}
      <div className="relative z-10 flex-1 overflow-y-auto">
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

      {/* Cover Image Background with 20% opacity */}
      {coverImage && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.2,
          }}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Upload Media Button - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-10">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploadingImage}
          className="group relative flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg overflow-hidden"
        >
          {/* Background image with 30% opacity */}
          {coverImage && (
            <>
              {console.log("Loading cover image:", coverImage)}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={coverImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-30"
                onError={(e) => console.error("Image failed to load:", coverImage, e)}
                onLoad={() => console.log("Image loaded successfully")}
              />
            </>
          )}
          
          <div className="relative z-10 flex flex-col items-center">
            {isUploadingImage ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center animate-pulse bg-white/50">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                {/* Default state */}
                <div className="relative group-hover:hidden">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white/50">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500 group-hover:hidden">
                  {coverImage ? "Change media" : "No media"}
                </p>
                <p className="text-xs text-gray-400 group-hover:hidden">
                  Upload images or videos.
                </p>

                {/* Hover state */}
                <div className="relative hidden group-hover:block">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center bg-white/50">
                    <ImageIcon className="h-5 w-5 text-gray-500" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center">
                      <Plus className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600 hidden group-hover:block">
                  Upload
                </p>
                <p className="text-xs text-gray-400 hidden group-hover:block">
                  Upload images or videos.
                </p>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notiz löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Notiz wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteNote}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
