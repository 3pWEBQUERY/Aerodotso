"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Home, LayoutTemplate, Star, MoreHorizontal, Share2, Grid3X3, Sparkles, Youtube, Save, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
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
  { id: "study", name: "Study Partner", icon: Grid3X3, color: "text-emerald-600" },
  { id: "marketing", name: "Marketing Playground", icon: Sparkles, color: "text-violet-600" },
  { id: "youtube", name: "Youtube Content System", icon: Youtube, color: "text-red-600" },
];

export default function CanvasDetailPage() {
  const params = useParams<{ workspaceId: string; canvasId: string }>();
  const router = useRouter();
  const { workspaceId, canvasId } = params;
  
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState("select");
  const [isStarred, setIsStarred] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCanvas = useCallback(async () => {
    if (!canvasId) return;
    try {
      const res = await fetch(`/api/canvas/${canvasId}`);
      if (res.ok) {
        const data = await res.json();
        setCanvas(data.canvas);
        // Show welcome if canvas has no nodes
        const hasNodes = data.canvas.data?.nodes && data.canvas.data.nodes.length > 0;
        setShowWelcome(!hasNodes && !data.canvas.content);
      }
    } catch (error) {
      console.error("Failed to fetch canvas:", error);
    } finally {
      setLoading(false);
    }
  }, [canvasId]);

  useEffect(() => {
    fetchCanvas();
  }, [fetchCanvas]);

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600"
          >
            ←
          </button>
          <Link href={`/workspace/${workspaceId}`} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-1.5 text-gray-700">
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span className="font-medium">{canvas.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          {/* Save Status */}
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                <span>{formatLastSaved()}</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => setIsStarred(!isStarred)}
            className={isStarred ? "text-amber-500" : "text-gray-400 hover:text-gray-600"}
          >
            <Star className={`h-4 w-4 ${isStarred ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {showWelcome ? (
          /* Welcome Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-emerald-600" />
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
                className="text-emerald-600 font-medium hover:underline"
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

      {/* Toolbar */}
      <CanvasToolbar activeTool={activeTool} onToolChange={setActiveTool} />
    </div>
  );
}
