"use client";

import { useState, useEffect, useCallback } from "react";
import { StickyNote, Trash2, ImageIcon, Pencil, Copy } from "lucide-react";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

interface Document {
  id: string;
  title: string;
  mime_type: string;
  previewUrl?: string;
  created_at: string;
}

interface NotesSidebarProps {
  workspaceId: string;
}

export function NotesSidebar({ workspaceId }: NotesSidebarProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [notesRes, docsRes] = await Promise.all([
        fetch(`/api/notes?workspaceId=${workspaceId}`),
        fetch(`/api/documents/list?workspaceId=${workspaceId}`)
      ]);
      const notesData = await notesRes.json();
      const docsData = await docsRes.json();
      if (notesData.notes) setNotes(notesData.notes);
      if (docsData.documents) setDocuments(docsData.documents);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditingNote = (note: Note, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(note.id);
    setEditingTitle(stripHtml(note.title) || "Untitled");
  };

  const saveNoteTitle = async (noteId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, title: editingTitle.trim() } : n
        )
      );
    } catch (error) {
      console.error("Failed to update note title:", error);
    } finally {
      setEditingId(null);
    }
  };

  const copyNoteLink = async (noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/workspace/${workspaceId}/notes/${noteId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const deleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 rounded-xl text-sm flex flex-col overflow-hidden border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-[var(--workspace-sidebar-border)] text-[var(--workspace-sidebar-foreground)]">
        <span className="font-medium">Notes</span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group flex items-center rounded-md hover:bg-[var(--workspace-sidebar-muted)] mb-0.5 overflow-hidden"
          >
            {editingId === note.id ? (
              <div className="flex-1 flex items-center gap-2 px-2 py-1">
                <StickyNote className="h-3.5 w-3.5 flex-shrink-0" />
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveNoteTitle(note.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveNoteTitle(note.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  className="flex-1 bg-[var(--workspace-sidebar-muted)] border border-[var(--workspace-sidebar-border)] rounded px-1 py-0.5 text-xs text-[var(--workspace-sidebar-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <>
                <Link
                  href={`/workspace/${workspaceId}/notes/${note.id}`}
                  className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--workspace-sidebar-muted-foreground)]"
                >
                  <StickyNote className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[80px]">{stripHtml(note.title) || "Untitled"}</span>
                </Link>
                {/* Hover action buttons - 3 buttons */}
                <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => startEditingNote(note, e)}
                    className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                    title="Rename"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => copyNoteLink(note.id, e)}
                    className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                    title="Copy Link"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deleteNote(note.id, e)}
                    className="p-1 hover:bg-red-500/20 rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {notes.length === 0 && (
          <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] text-center py-4">No notes yet</p>
        )}
      </div>

    </aside>
  );
}
