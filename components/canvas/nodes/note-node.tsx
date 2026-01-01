"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, NodeProps } from "reactflow";
import { NoteNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  StickyNote, 
  Trash2, 
  Copy, 
  X,
  Eye,
  ArrowLeft,
  Home,
  Star,
  MoreHorizontal,
  ImageIcon,
  Plus
} from "lucide-react";
import { RichTextEditor } from "@/components/workspace/rich-text-editor";
import { motion, AnimatePresence } from "framer-motion";

function NoteNode({ id, data, selected }: NodeProps<NoteNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [title, setTitle] = useState(data.label || "Untitled Note");
  const [content, setContent] = useState(data.content || "");
  const [isStarred, setIsStarred] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [databaseNoteId, setDatabaseNoteId] = useState<string | null>(data.databaseNoteId || null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dbSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { deleteNode, duplicateNode, updateNode, workspaceId } = useCanvasStore();

  // Sync note to database
  const syncToDatabase = useCallback(async (noteTitle: string, noteContent: string) => {
    if (!workspaceId) return;

    try {
      if (databaseNoteId) {
        // Update existing note
        await fetch(`/api/notes/${databaseNoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: noteTitle || "Untitled Note",
            content: noteContent,
          }),
        });
      } else {
        // Create new note
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            title: noteTitle || "Untitled Note",
            content: noteContent,
          }),
        });
        if (response.ok) {
          const { note } = await response.json();
          setDatabaseNoteId(note.id);
          // Update node data with database ID
          updateNode(id, { databaseNoteId: note.id } as any);
        }
      }
    } catch (error) {
      console.error("Failed to sync note to database:", error);
    }
  }, [workspaceId, databaseNoteId, id, updateNode]);

  // Auto-sync to database on first mount if no databaseNoteId exists
  useEffect(() => {
    if (!databaseNoteId && workspaceId && (title || content)) {
      // Create the note in database after a short delay
      const timer = setTimeout(() => {
        syncToDatabase(stripHtml(title) || "Untitled Note", content);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);  // Only run on mount

  // Use custom size if set, otherwise default portrait dimensions
  const nodeWidth = (data as any).nodeWidth || 240;
  const nodeHeight = (data as any).nodeHeight || 320;

  // Custom resize handler
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = nodeWidth;
    const startHeight = nodeHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(180, startWidth + deltaX);
      const newHeight = Math.max(200, startHeight + deltaY);
      updateNode(id, { nodeWidth: newWidth, nodeHeight: newHeight } as any);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }, [id, nodeWidth, nodeHeight, updateNode]);

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  // Get first line as title preview, rest as body
  const getPreviewContent = () => {
    const plainContent = stripHtml(content);
    const lines = plainContent.split("\n").filter(l => l.trim());
    return {
      firstLine: lines[0] || "",
      body: lines.slice(1).join("\n") || ""
    };
  };

  const preview = getPreviewContent();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (dbSaveTimeoutRef.current) clearTimeout(dbSaveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      const plainTitle = stripHtml(newTitle) || "Untitled Note";
      updateNode(id, { label: plainTitle });
      setLastSaved(new Date());
      setSaving(false);
    }, 500);

    // Debounce database sync (longer delay)
    dbSaveTimeoutRef.current = setTimeout(() => {
      syncToDatabase(stripHtml(newTitle) || "Untitled Note", content);
    }, 1500);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (dbSaveTimeoutRef.current) clearTimeout(dbSaveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      updateNode(id, { content: newContent });
      setLastSaved(new Date());
      setSaving(false);
    }, 500);

    // Debounce database sync (longer delay)
    dbSaveTimeoutRef.current = setTimeout(() => {
      syncToDatabase(stripHtml(title) || "Untitled Note", newContent);
    }, 1500);
  };

  const toggleStarred = () => {
    setIsStarred(!isStarred);
  };

  return (
    <>
      <div
        className="relative"
        style={{ width: nodeWidth, height: nodeHeight }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isResizing) setIsHovered(false);
        }}
      >
        {/* Main card */}
        <div
          className={`
            w-full h-full bg-white rounded-2xl border shadow-sm overflow-hidden
            transition-all duration-200 cursor-pointer
            ${selected ? "ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-gray-200 hover:border-gray-300 hover:shadow-md"}
          `}
          onDoubleClick={handleOpenEditor}
        >
          {/* Connection Handles - outside card when selected */}
          <Handle
            type="target"
            position={Position.Left}
            className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-left-4 !opacity-100' : '!opacity-0'}`}
            style={{ top: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-right-4 !opacity-100' : '!opacity-0'}`}
            style={{ top: '50%' }}
          />

          {/* Content */}
          <div className="p-5">
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {stripHtml(title) || "Untitled Note"}
            </h3>
            
            {/* Subtitle / First line in italics if exists */}
            {preview.firstLine && (
              <p className="text-sm italic text-gray-500 mb-3 line-clamp-1">
                {preview.firstLine}
              </p>
            )}

            {/* Body preview */}
            {preview.body && (
              <div className="text-sm text-gray-700 leading-relaxed line-clamp-6">
                {preview.body.split("\n").map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!content && (
              <p className="text-sm text-gray-400 italic">
                Double-click to edit...
              </p>
            )}
          </div>
        </div>

        {/* Action bar below card - appears on selection */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 flex items-center h-10 px-2 bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ease-out ${
            selected 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
          }`}
          style={{ top: '100%', marginTop: 10, zIndex: 100 }}
        >
          <button
            type="button"
            onClick={handleOpenEditor}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
            title="Edit note"
          >
            <Eye className="h-4 w-4 text-gray-500" />
          </button>
          
          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 mx-1" />
          
          <button
            type="button"
            onClick={handleDuplicate}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
            title="Duplicate"
          >
            <Copy className="h-4 w-4 text-gray-500" />
          </button>
          
          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 mx-1" />
          
          <button
            type="button"
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Resize handle - bottom right corner */}
        <div
          onPointerDown={handleResizeStart}
          className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize transition-opacity flex items-center justify-center nodrag nopan ${isHovered || isResizing || selected ? 'opacity-100' : 'opacity-0'}`}
          style={{ zIndex: 50, touchAction: "none" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-gray-400">
            <path d="M10 6L6 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Fullscreen Edit Modal with Framer Motion - Portal to body */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isEditorOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999]"
              onClick={() => setIsEditorOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-white flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header - exactly like notes page */}
                <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Home className="h-3.5 w-3.5" />
                        <span>Home</span>
                      </div>
                      <span className="text-gray-300">/</span>
                      <div className="flex items-center gap-1 text-gray-700">
                        <StickyNote className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {stripHtml(title) || "Untitled Note"}
                        </span>
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
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
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

                {/* Upload Media Button - Bottom Right */}
                <div className="absolute bottom-6 right-6 z-10">
                  <button
                    type="button"
                    className="group relative flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-gray-400">
                        <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-500 group-hover:text-gray-600">
                        No media
                      </p>
                      <p className="text-xs text-gray-400">
                        Upload images or videos.
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default memo(NoteNode);
