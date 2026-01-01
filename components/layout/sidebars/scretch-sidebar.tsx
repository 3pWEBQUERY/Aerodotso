"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Copy } from "lucide-react";
import Link from "next/link";

interface Scratch {
  id: string;
  title: string;
  created_at: string;
}

interface ScretchSidebarProps {
  workspaceId: string;
}

export function ScretchSidebar({ workspaceId }: ScretchSidebarProps) {
  const [scratches, setScratches] = useState<Scratch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/scratches?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.scratches) setScratches(data.scratches);
    } catch (error) {
      console.error("Failed to fetch scratches:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditing = (scratch: Scratch, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(scratch.id);
    setEditingTitle(scratch.title || "Untitled");
  };

  const saveTitle = async (scratchId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await fetch(`/api/scratches/${scratchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      setScratches((prev) =>
        prev.map((s) =>
          s.id === scratchId ? { ...s, title: editingTitle.trim() } : s
        )
      );
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setEditingId(null);
    }
  };

  const copyLink = async (scratchId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/workspace/${workspaceId}/scretch/${scratchId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const deleteScratch = async (scratchId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`/api/scratches/${scratchId}`, {
        method: "DELETE",
      });

      setScratches((prev) => prev.filter((s) => s.id !== scratchId));
    } catch (error) {
      console.error("Failed to delete scratch:", error);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 rounded-xl text-sm flex flex-col overflow-hidden border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-[var(--workspace-sidebar-border)] text-[var(--workspace-sidebar-foreground)]">
        <span className="font-medium">Scratches</span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
        {scratches.map((scratch) => (
          <div
            key={scratch.id}
            className="group flex items-center rounded-md hover:bg-[var(--workspace-sidebar-muted)] mb-0.5 overflow-hidden"
          >
            {editingId === scratch.id ? (
              <div className="flex-1 flex items-center gap-2 px-2 py-1">
                <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveTitle(scratch.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveTitle(scratch.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  className="flex-1 bg-[var(--workspace-sidebar-muted)] border border-[var(--workspace-sidebar-border)] rounded px-1 py-0.5 text-xs text-[var(--workspace-sidebar-foreground)] outline-none focus:ring-1 focus:ring-violet-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <>
                <Link
                  href={`/workspace/${workspaceId}/scretch/${scratch.id}`}
                  className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--workspace-sidebar-muted-foreground)]"
                >
                  <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
                  <span className="truncate max-w-[80px]">{scratch.title || "Untitled"}</span>
                </Link>
                {/* Hover action buttons */}
                <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => startEditing(scratch, e)}
                    className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                    title="Rename"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => copyLink(scratch.id, e)}
                    className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                    title="Copy Link"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deleteScratch(scratch.id, e)}
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
        
        {scratches.length === 0 && (
          <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] text-center py-4">No scratches yet</p>
        )}
      </div>

    </aside>
  );
}
