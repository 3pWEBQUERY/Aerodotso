"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import {
  Copy,
  Trash2,
  Clipboard,
  Image,
  Video,
  FileText,
  StickyNote,
  MessageSquare,
  Wand2,
  Link2,
  Folder,
  Sparkles,
  ArrowRight,
  Edit2,
  Lock,
  Unlock,
  Layers,
} from "lucide-react";

interface CanvasContextMenuProps {
  x: number;
  y: number;
  nodeId?: string;
  onClose: () => void;
}

const ADD_NODE_OPTIONS = [
  { type: "image", label: "Image", icon: Image },
  { type: "video", label: "Video", icon: Video },
  { type: "document", label: "Document", icon: FileText },
  { type: "note", label: "Note", icon: StickyNote },
  { type: "url", label: "URL", icon: Link2 },
  { type: "ai-chat", label: "AI Chat", icon: MessageSquare },
  { type: "ai-generator", label: "AI Generator", icon: Wand2 },
  { type: "folder", label: "Folder", icon: Folder },
];

export function CanvasContextMenu({ x, y, nodeId, onClose }: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  const {
    addNode,
    deleteNode,
    duplicateNode,
    copyNodes,
    pasteNodes,
    selectedNodeIds,
    getNodeById,
    updateNode,
  } = useCanvasStore();

  const node = nodeId ? getNodeById(nodeId) : undefined;
  const hasSelection = selectedNodeIds.length > 0;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - 200),
    y: Math.min(y, window.innerHeight - 400),
  };

  const handleAddNode = (type: string, label: string) => {
    // Type-specific default data
    const typeDefaults: Record<string, any> = {
      folder: { childNodeIds: [], width: 200, height: 240, description: "" },
      note: { content: "", backgroundColor: "yellow" },
      "ai-chat": { model: "claude-sonnet-4", conversation: [], connectedAssetIds: [], isExpanded: true },
      "ai-generator": { provider: "flux-pro", prompt: "", generationHistory: [], status: "idle" },
    };

    // Convert screen position to canvas position (approximate)
    addNode({
      id: `${type}-${Date.now()}`,
      type,
      position: { x: x - 100, y: y - 100 },
      data: {
        type: type as any,
        label,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "",
        ...typeDefaults[type],
      } as any,
    });
    onClose();
  };

  const handleCopy = () => {
    if (nodeId) {
      copyNodes([nodeId]);
    } else if (hasSelection) {
      copyNodes(selectedNodeIds);
    }
    onClose();
  };

  const handlePaste = () => {
    pasteNodes({ x, y });
    onClose();
  };

  const handleDuplicate = () => {
    if (nodeId) {
      duplicateNode(nodeId);
    }
    onClose();
  };

  const handleDelete = () => {
    if (nodeId) {
      deleteNode(nodeId);
    }
    onClose();
  };

  const handleToggleLock = () => {
    if (nodeId && node) {
      updateNode(nodeId, { isLocked: !node.data.isLocked });
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-xl border py-2 min-w-[180px] z-50"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {/* Node-specific actions */}
      {nodeId && node && (
        <>
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
            Node Actions
          </div>
          
          <button
            type="button"
            onClick={handleDuplicate}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Copy className="h-4 w-4 text-gray-400" />
            Duplicate
          </button>

          <button
            type="button"
            onClick={handleToggleLock}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {node.data.isLocked ? (
              <>
                <Unlock className="h-4 w-4 text-gray-400" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-gray-400" />
                Lock
              </>
            )}
          </button>

          {/* AI Actions for media nodes */}
          {["image", "video", "document"].includes(node.type || "") && (
            <>
              <div className="my-1 border-t" />
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Analyze with AI
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-primary-light)] hover:bg-[var(--accent-primary)]/10 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Use as Reference
              </button>
            </>
          )}

          <div className="my-1 border-t" />

          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </>
      )}

      {/* Canvas actions (no node selected) */}
      {!nodeId && (
        <>
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
            Add Node
          </div>
          
          {ADD_NODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => handleAddNode(option.type, option.label)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className="h-4 w-4 text-gray-400" />
                {option.label}
              </button>
            );
          })}

          <div className="my-1 border-t" />

          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasSelection}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Copy className="h-4 w-4 text-gray-400" />
            Copy Selection
          </button>

          <button
            type="button"
            onClick={handlePaste}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Clipboard className="h-4 w-4 text-gray-400" />
            Paste
          </button>
        </>
      )}
    </div>
  );
}

export default CanvasContextMenu;
