"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Grid3X3, Link2, Upload, Home, MessageSquare, Command, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/components/providers/upload-provider";
import { detectPlatform } from "@/lib/social/platform-detector";

interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

interface CreateToolbarProps {
  workspaceId: string;
  onCreated?: () => void;
}

type ActivePanel = "none" | "note" | "canvas" | "link" | "upload";

export function CreateToolbar({ workspaceId, onCreated }: CreateToolbarProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [canvasName, setCanvasName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addUpload } = useUpload();

  // Fetch link preview when URL changes
  useEffect(() => {
    if (activePanel !== "link") return;
    
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    const trimmed = linkUrl.trim();
    if (!trimmed || trimmed.length < 5) {
      setLinkPreview(null);
      return;
    }

    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    if (!urlPattern.test(trimmed)) {
      setLinkPreview(null);
      return;
    }

    setIsLoadingPreview(true);
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/links/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await response.json();
        if (data.title) {
          setLinkPreview(data);
        }
      } catch (error) {
        console.error("Failed to fetch preview:", error);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 500);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [linkUrl, activePanel]);


  const handleTogglePanel = (panel: ActivePanel) => {
    setActivePanel(activePanel === panel ? "none" : panel);
    // Reset fields
    setNoteTitle("");
    setNoteContent("");
    setCanvasName("");
    setLinkUrl("");
    setLinkPreview(null);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleCreateNote = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: noteTitle.trim() || "Untitled Note",
          content: noteContent,
        }),
      });
      
      if (res.ok) {
        const { note } = await res.json();
        setActivePanel("none");
        setNoteTitle("");
        setNoteContent("");
        onCreated?.();
        // Navigate to the new note
        router.push(`/workspace/${workspaceId}/notes/${note.id}`);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCanvas = async () => {
    if (!canvasName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: canvasName,
        }),
      });
      
      if (res.ok) {
        setActivePanel("none");
        setCanvasName("");
        onCreated?.();
      }
    } catch (error) {
      console.error("Failed to create canvas:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLink = async () => {
    if (!linkUrl.trim()) return;
    
    let url = linkUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const detected = detectPlatform(url);
    const linkType = detected?.platform || undefined;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          url: linkPreview?.url || url,
          title: linkPreview?.title || getDomain(url),
          description: linkPreview?.description || null,
          thumbnail_url: linkPreview?.image || null,
          link_type: linkType,
        }),
      });
      
      if (res.ok) {
        setActivePanel("none");
        setLinkUrl("");
        setLinkPreview(null);
        onCreated?.();
      }
    } catch (error) {
      console.error("Failed to create link:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setActivePanel("none");
    
    // Upload all files using the upload context (shows progress UI)
    const uploadPromises = Array.from(files).map((file) => 
      addUpload(file, workspaceId).catch((err) => {
        console.error(`Failed to upload ${file.name}:`, err);
      })
    );
    
    await Promise.all(uploadPromises);
    onCreated?.();
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [workspaceId]);

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      action();
    }
  };


  return (
    <div className="flex flex-col items-center">
      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => handleTogglePanel("note")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm border rounded-xl transition-colors",
            activePanel === "note"
              ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]"
              : "hover:bg-muted"
          )}
        >
          <FileText className="h-4 w-4" />
          Note
        </button>
        
        <button
          type="button"
          onClick={() => handleTogglePanel("canvas")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm border rounded-xl transition-colors",
            activePanel === "canvas"
              ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]"
              : "hover:bg-muted"
          )}
        >
          <Grid3X3 className="h-4 w-4" />
          Canvas
        </button>
        
        <button
          type="button"
          onClick={() => handleTogglePanel("link")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm border rounded-xl transition-colors",
            activePanel === "link"
              ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]"
              : "hover:bg-muted"
          )}
        >
          <Link2 className="h-4 w-4" />
          Link
        </button>
        
        <button
          type="button"
          onClick={() => handleTogglePanel("upload")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm border rounded-xl transition-colors",
            activePanel === "upload"
              ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]"
              : "hover:bg-muted"
          )}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>

      </div>

      {/* Panels */}
      {activePanel === "note" && (
        <div className="mt-4 w-full max-w-xl">
          <div className="border rounded-xl bg-white shadow-sm p-4">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleCreateNote)}
              placeholder="Heading"
              className="w-full text-lg font-medium placeholder:text-muted-foreground/50 placeholder:italic outline-none mb-4"
              autoFocus
            />
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note..."
              className="w-full h-24 text-sm placeholder:text-muted-foreground/50 outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground mr-auto">Save to</span>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-sm">
                <Home className="h-3.5 w-3.5" />
                Home
              </div>
              <button
                type="button"
                className="p-1.5 hover:bg-muted rounded"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={isSubmitting || !noteTitle.trim()}
                className="p-2 bg-[var(--accent-primary)] text-white rounded-full hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-1 mt-2 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>↵ to capture</span>
            </div>
          </div>
        </div>
      )}

      {activePanel === "canvas" && (
        <div className="mt-4 w-full max-w-xl">
          <div className="border rounded-xl bg-white shadow-sm p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={canvasName}
                onChange={(e) => setCanvasName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleCreateCanvas)}
                placeholder="Enter new canvas name"
                className="flex-1 text-sm placeholder:text-muted-foreground/50 outline-none"
                autoFocus
              />
              <span className="text-xs text-muted-foreground">Save to</span>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-sm">
                <Home className="h-3.5 w-3.5" />
                Home
              </div>
              <button
                type="button"
                className="p-1.5 hover:bg-muted rounded"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={handleCreateCanvas}
                disabled={isSubmitting || !canvasName.trim()}
                className="p-2 bg-[var(--accent-primary)] text-white rounded-full hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanel === "link" && (
        <div className="mt-4 w-full max-w-xl">
          <div className="border rounded-xl bg-white shadow-sm p-4">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleCreateLink)}
              placeholder="Paste a link..."
              className="w-full text-sm placeholder:text-muted-foreground/50 outline-none mb-4"
              autoFocus
            />
            
            {/* Link Preview */}
            {isLoadingPreview && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading preview...</span>
              </div>
            )}
            {linkPreview && !isLoadingPreview && (
              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                {linkPreview.image && (
                  <img
                    src={linkPreview.image}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{linkPreview.title}</p>
                  {linkPreview.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {linkPreview.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {getDomain(linkPreview.url || linkUrl)}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground mr-auto">Save to</span>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-sm">
                <Home className="h-3.5 w-3.5" />
                Home
              </div>
              <button
                type="button"
                className="p-1.5 hover:bg-muted rounded"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={isSubmitting || !linkUrl.trim()}
                className="p-2 bg-[var(--accent-primary)] text-white rounded-full hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanel === "upload" && (
        <div className="mt-4 w-full max-w-xl">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl bg-white p-8 cursor-pointer transition-colors",
              isDragging ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "hover:border-muted-foreground/50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Drag + drop to upload</p>
              <p className="text-sm text-muted-foreground">
                or <span className="text-[var(--accent-primary-light)]">Browse files</span>
              </p>
              <p className="text-xs text-muted-foreground">
                (Try dropping folders here too)
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-xs text-muted-foreground mr-auto">Save to</span>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-sm">
              <Home className="h-3.5 w-3.5" />
              Home
            </div>
            <button
              type="button"
              className="p-1.5 hover:bg-muted rounded"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
