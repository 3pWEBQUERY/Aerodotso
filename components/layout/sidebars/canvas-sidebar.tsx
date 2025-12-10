"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutTemplate, Trash2, Pencil, Copy, Plus } from "lucide-react";
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
          className={`group flex items-center rounded-md hover:bg-muted mb-0.5 overflow-hidden ${
            isActive ? "bg-emerald-50 text-emerald-700" : ""
          }`}
        >
          {editingId === canvas.id ? (
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <LayoutTemplate className="h-3.5 w-3.5 flex-shrink-0" />
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
                className="flex-1 bg-white border rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <>
              <Link
                href={`/workspace/${workspaceId}/canvas/${canvas.id}`}
                className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"
              >
                <LayoutTemplate className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{canvas.name}</span>
              </Link>
              {/* Hover action buttons - 3 buttons like in the image */}
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => startEditing(canvas, e)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => duplicateCanvas(canvas.id, e)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteCanvas(canvas.id, e)}
                  className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
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
    <aside className="w-44 flex-shrink-0 border-r text-sm flex flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between px-3 py-2 border-b">
        <span className="font-medium">Canvas</span>
      </header>

      {/* New Canvas Button */}
      <div className="px-3 py-2 border-b">
        <button
          type="button"
          onClick={createCanvas}
          className="flex w-full items-center gap-2 px-2 py-1.5 bg-white border rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Canvas
        </button>
      </div>

      {/* Canvas List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {groupedCanvases.today.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Today
            </p>
            {renderCanvasList(groupedCanvases.today)}
          </>
        )}

        {groupedCanvases.yesterday.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Yesterday
            </p>
            {renderCanvasList(groupedCanvases.yesterday)}
          </>
        )}

        {groupedCanvases.pastWeek.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Past Week
            </p>
            {renderCanvasList(groupedCanvases.pastWeek)}
          </>
        )}

        {groupedCanvases.older.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Older
            </p>
            {renderCanvasList(groupedCanvases.older)}
          </>
        )}

        {canvases.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No canvases yet
          </p>
        )}
      </div>

      {/* Trash */}
      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <Trash2 className="h-3.5 w-3.5" />
        <span>Trash</span>
      </div>
    </aside>
  );
}
