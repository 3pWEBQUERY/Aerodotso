"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutPanelLeft, Trash2, Pencil, Copy, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface Canvas {
  id: string;
  name: string;
  created_at: string;
}

interface CanvasSidebarProps {
  workspaceId: string;
}

export function CanvasSidebar({ workspaceId }: CanvasSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchCanvases = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/canvas?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.canvases) {
        setCanvases(data.canvases);
      }
    } catch (error) {
      console.error("Failed to fetch canvases:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  // Group canvases by date
  const groupCanvasesByDate = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);

    const groups: { [key: string]: Canvas[] } = {
      today: [],
      yesterday: [],
      pastWeek: [],
      older: [],
    };

    const sorted = [...canvases].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const canvas of sorted) {
      const canvasDate = new Date(canvas.created_at);
      if (canvasDate >= today) {
        groups.today.push(canvas);
      } else if (canvasDate >= yesterday) {
        groups.yesterday.push(canvas);
      } else if (canvasDate >= pastWeek) {
        groups.pastWeek.push(canvas);
      } else {
        groups.older.push(canvas);
      }
    }

    return groups;
  }, [canvases]);

  const groupedCanvases = groupCanvasesByDate();

  const createCanvas = async () => {
    try {
      const res = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: "Untitled Canvas",
        }),
      });
      const data = await res.json();
      if (data.canvas) {
        setCanvases((prev) => [data.canvas, ...prev]);
        router.push(`/workspace/${workspaceId}/canvas/${data.canvas.id}`);
      }
    } catch (error) {
      console.error("Failed to create canvas:", error);
    }
  };

  const startEditing = (canvas: Canvas, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(canvas.id);
    setEditingName(canvas.name);
  };

  const saveName = async (canvasId: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await fetch(`/api/canvas/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      setCanvases((prev) =>
        prev.map((c) =>
          c.id === canvasId ? { ...c, name: editingName.trim() } : c
        )
      );
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setEditingId(null);
    }
  };

  const duplicateCanvas = async (canvasId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvases.find((c) => c.id === canvasId);
    if (!canvas) return;

    try {
      const res = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: `${canvas.name} (Copy)`,
        }),
      });
      const data = await res.json();
      if (data.canvas) {
        setCanvases((prev) => [data.canvas, ...prev]);
      }
    } catch (error) {
      console.error("Failed to duplicate canvas:", error);
    }
  };

  const deleteCanvas = async (canvasId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`/api/canvas/${canvasId}`, {
        method: "DELETE",
      });

      setCanvases((prev) => prev.filter((c) => c.id !== canvasId));
    } catch (error) {
      console.error("Failed to delete canvas:", error);
    }
  };

  const renderCanvasList = (canvasList: Canvas[]) =>
    canvasList.map((canvas) => {
      const isActive = pathname === `/workspace/${workspaceId}/canvas/${canvas.id}`;

      return (
        <div
          key={canvas.id}
          className={`group flex items-center rounded-md hover:bg-[var(--workspace-sidebar-muted)] mb-0.5 overflow-hidden ${
            isActive ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : ""
          }`}
        >
          {editingId === canvas.id ? (
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <LayoutPanelLeft className="h-3.5 w-3.5 flex-shrink-0" />
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => saveName(canvas.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveName(canvas.id);
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
                href={`/workspace/${workspaceId}/canvas/${canvas.id}`}
                className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--workspace-sidebar-muted-foreground)]"
              >
                <LayoutPanelLeft className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{canvas.name}</span>
              </Link>
              {/* Hover action buttons - 3 buttons like in the image */}
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => startEditing(canvas, e)}
                  className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => duplicateCanvas(canvas.id, e)}
                  className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteCanvas(canvas.id, e)}
                  className="p-1 hover:bg-red-500/20 rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </>
          )}
        </div>
      );
    });

  return (
    <aside className="w-64 flex-shrink-0 rounded-xl text-sm flex flex-col overflow-hidden border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-[var(--workspace-sidebar-border)] text-[var(--workspace-sidebar-foreground)]">
        <span className="font-medium">Canvas</span>
      </header>

      {/* Canvas List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
        {groupedCanvases.today.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('today')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.today ? '' : 'rotate-90'}`} />
              <span>Today</span>
            </button>
            {!collapsedSections.today && renderCanvasList(groupedCanvases.today)}
          </div>
        )}

        {groupedCanvases.yesterday.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('yesterday')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.yesterday ? '' : 'rotate-90'}`} />
              <span>Yesterday</span>
            </button>
            {!collapsedSections.yesterday && renderCanvasList(groupedCanvases.yesterday)}
          </div>
        )}

        {groupedCanvases.pastWeek.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('pastWeek')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.pastWeek ? '' : 'rotate-90'}`} />
              <span>Past Week</span>
            </button>
            {!collapsedSections.pastWeek && renderCanvasList(groupedCanvases.pastWeek)}
          </div>
        )}

        {groupedCanvases.older.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('older')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.older ? '' : 'rotate-90'}`} />
              <span>Older</span>
            </button>
            {!collapsedSections.older && renderCanvasList(groupedCanvases.older)}
          </div>
        )}

        {canvases.length === 0 && (
          <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] text-center py-4">
            No canvases yet
          </p>
        )}
      </div>

    </aside>
  );
}
