"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Home, LayoutPanelLeft, Star, Share2, Grid3X3, Sparkles, Youtube, Save, Loader2, ArrowLeft } from "lucide-react";
import { ItemHeaderActions } from "@/components/shared/item-header-actions";
import Link from "next/link";
import { SpatialCanvas } from "@/components/canvas/spatial-canvas";
import { CanvasNode, CanvasConnection } from "@/lib/canvas/types";
import { instantiateTemplate } from "@/lib/canvas/templates";
import { useCanvasStore } from "@/lib/canvas/store";

interface Canvas {
  id: string;
  name: string;
  workspace_id: string;
  content?: any;
  data?: {
    nodes?: CanvasNode[];
    edges?: CanvasConnection[];
  };
  created_at: string;
  updated_at?: string;
}

const TEMPLATES = [
  { id: "study", name: "Study Partner", icon: Grid3X3, color: "text-[var(--accent-primary-light)]" },
  { id: "marketing", name: "Marketing Playground", icon: Sparkles, color: "text-violet-600" },
  { id: "youtube", name: "Youtube Content System", icon: Youtube, color: "text-red-600" },
];

export default function CanvasDetailPage() {
  const params = useParams<{ workspaceId: string; canvasId: string }>();
  const router = useRouter();
  const { workspaceId, canvasId } = params;
  
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Home");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Resolve fresh signed URLs for media nodes with mediaLibraryId
  const resolveMediaUrls = useCallback(async (nodes: CanvasNode[]): Promise<CanvasNode[]> => {
    // Collect all mediaLibraryIds from image and video nodes
    const mediaIds: string[] = [];
    nodes.forEach((node) => {
      const data = node.data as any;
      if ((node.type === 'image' || node.type === 'video' || node.type === 'document') && data.mediaLibraryId) {
        mediaIds.push(data.mediaLibraryId);
      }
    });

    if (mediaIds.length === 0) return nodes;

    try {
      // Fetch fresh signed URLs for all media
      const res = await fetch('/api/documents/resolve-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: mediaIds }),
      });

      if (!res.ok) return nodes;

      const { urls } = await res.json();

      // Update nodes with fresh URLs
      return nodes.map((node) => {
        const data = node.data as any;
        if ((node.type === 'image' || node.type === 'video' || node.type === 'document') && data.mediaLibraryId && urls[data.mediaLibraryId]) {
          return {
            ...node,
            data: {
              ...data,
              url: urls[data.mediaLibraryId],
              thumbnail: urls[data.mediaLibraryId],
            },
          };
        }
        return node;
      });
    } catch (error) {
      console.error('Failed to resolve media URLs:', error);
      return nodes;
    }
  }, []);

  const fetchCanvas = useCallback(async () => {
    if (!canvasId) return;
    try {
      const res = await fetch(`/api/canvas/${canvasId}`);
      if (res.ok) {
        const data = await res.json();
        const canvasData = data.canvas;
        
        // Resolve fresh URLs for media nodes
        if (canvasData.data?.nodes && canvasData.data.nodes.length > 0) {
          canvasData.data.nodes = await resolveMediaUrls(canvasData.data.nodes);
        }
        
        setCanvas(canvasData);
        // Show welcome if canvas has no nodes
        const hasNodes = canvasData.data?.nodes && canvasData.data.nodes.length > 0;
        setShowWelcome(!hasNodes && !canvasData.content);
      }
    } catch (error) {
      console.error("Failed to fetch canvas:", error);
    } finally {
      setLoading(false);
    }
  }, [canvasId, resolveMediaUrls]);

  // Fetch workspace name
  useEffect(() => {
    const fetchWorkspaceName = async () => {
      if (!workspaceId) return;
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        const data = await res.json();
        if (data.workspace?.name) {
          setWorkspaceName(data.workspace.name);
        }
      } catch (error) {
        console.error("Failed to fetch workspace name:", error);
      }
    };
    fetchWorkspaceName();
  }, [workspaceId]);

  useEffect(() => {
    fetchCanvas();
  }, [fetchCanvas]);

  // Toggle starred
  const handleToggleStar = async () => {
    if (!canvasId) return;
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    
    try {
      await fetch(`/api/canvas/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newStarred }),
      });
    } catch (error) {
      console.error("Failed to toggle star:", error);
      setIsStarred(!newStarred);
    }
  };

  // Inline title editing
  const startEditingTitle = () => {
    setEditingTitleValue(canvas?.name || "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveEditingTitle = async () => {
    if (!editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const newTitle = editingTitleValue.trim();
    setIsEditingTitle(false);
    try {
      await fetch(`/api/canvas/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTitle }),
      });
      setCanvas(prev => prev ? { ...prev, name: newTitle } : null);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save title:", error);
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitleValue("");
  };

  // Move canvas to folder
  const handleMove = async (folderId: string | null) => {
    if (!canvasId) return;
    try {
      await fetch(`/api/canvas/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      setCurrentFolderId(folderId);
    } catch (error) {
      console.error("Failed to move canvas:", error);
      throw error;
    }
  };

  // Delete canvas
  const handleDelete = async () => {
    if (!canvasId) return;
    try {
      await fetch(`/api/canvas/${canvasId}`, { method: "DELETE" });
      router.push(`/workspace/${workspaceId}`);
    } catch (error) {
      console.error("Failed to delete canvas:", error);
      throw error;
    }
  };

  // Save canvas data
  const saveCanvas = useCallback(async (nodes: CanvasNode[], edges: CanvasConnection[]) => {
    if (!canvasId) return;
    
    setIsSaving(true);
    try {
      await fetch(`/api/canvas/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { nodes, edges }
        }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save canvas:", error);
    } finally {
      setIsSaving(false);
    }
  }, [canvasId]);

  // Handle canvas data change with debounce
  const handleCanvasSave = useCallback((nodes: CanvasNode[], edges: CanvasConnection[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveCanvas(nodes, edges);
    }, 2000); // Debounce 2 seconds
  }, [saveCanvas]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const startWithTemplate = async (templateId: string) => {
    // Initialize canvas with template content
    const templateData = instantiateTemplate(templateId, "");
    if (templateData) {
      // Load template into canvas store
      const { loadCanvas } = useCanvasStore.getState();
      loadCanvas({
        nodes: templateData.nodes,
        edges: templateData.edges,
        canvasId,
        workspaceId,
      });
      
      // Save immediately
      await saveCanvas(templateData.nodes, templateData.edges);
      
      // Update local canvas state
      setCanvas(prev => prev ? {
        ...prev,
        data: {
          nodes: templateData.nodes,
          edges: templateData.edges,
        }
      } : null);
    }
    setShowWelcome(false);
  };

  const startBlank = () => {
    // Initialize with empty canvas
    const { loadCanvas } = useCanvasStore.getState();
    loadCanvas({
      nodes: [],
      edges: [],
      canvasId,
      workspaceId,
    });
    setShowWelcome(false);
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return "Not saved yet";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 10) return "Saved just now";
    if (diff < 60) return `Saved ${diff}s ago`;
    const mins = Math.floor(diff / 60);
    return `Saved ${mins}m ago`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Canvas not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
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
              <span>{workspaceName}</span>
            </Link>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-1 text-gray-700">
              <LayoutPanelLeft className="h-3.5 w-3.5" />
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
                  {canvas.name || "Untitled Canvas"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {isSaving ? "Saving..." : formatLastSaved()}
          </span>
          <button
            type="button"
            onClick={handleToggleStar}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Star className={`h-4 w-4 ${isStarred ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
          </button>
          
          <ItemHeaderActions
            itemId={canvasId}
            itemType="canvas"
            itemTitle={canvas.name}
            workspaceId={workspaceId}
            isStarred={isStarred}
            currentFolderId={currentFolderId}
            createdAt={canvas.created_at}
            updatedAt={canvas.updated_at}
            onToggleStar={handleToggleStar}
            onStartRename={startEditingTitle}
            onMove={handleMove}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative document-canvas-surface">
        {showWelcome ? (
          /* Welcome Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-[var(--accent-primary-light)]" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-semibold mb-1">
              Welcome to <span className="italic">Canvas</span>
            </h1>
            <p className="text-gray-500 mb-8">Get started with a template</p>
            
            {/* Templates */}
            <div className="flex items-center gap-3 mb-6">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => startWithTemplate(template.id)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <Icon className={`h-4 w-4 ${template.color}`} />
                    <span className="text-sm font-medium">{template.name}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Divider */}
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              <div className="w-24 h-px bg-gray-200" />
              <span>or start with a</span>
              <button
                type="button"
                onClick={startBlank}
                className="text-[var(--accent-primary-light)] font-medium hover:underline"
              >
                blank canvas
              </button>
              <div className="w-24 h-px bg-gray-200" />
            </div>
          </div>
        ) : (
          /* Spatial Canvas with React Flow */
          <SpatialCanvas
            canvasId={canvasId}
            workspaceId={workspaceId}
            initialNodes={canvas.data?.nodes || []}
            initialEdges={canvas.data?.edges || []}
            onSave={handleCanvasSave}
          />
        )}
      </div>

    </div>
  );
}
