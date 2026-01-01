"use client";

import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ImageNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Image as ImageIcon, 
  Maximize2, 
  Trash2, 
  Copy, 
  Link2,
  Sparkles,
  MoreHorizontal,
  Eye
} from "lucide-react";

function ImageNode({ id, data, selected }: NodeProps<ImageNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { deleteNode, duplicateNode, updateNode, addNode, addEdge, getNodeById } = useCanvasStore();

  // If image dimensions are missing (e.g. older nodes), load them once so we can
  // size the node correctly (portrait vs landscape).
  useEffect(() => {
    if (!data.url) return;
    if (data.width > 0 && data.height > 0) return;

    const img = new Image();
    img.onload = () => {
      updateNode(id, {
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
      } as any);
    };
    img.src = data.thumbnail || data.url;
  }, [data.url, data.thumbnail, data.width, data.height, id, updateNode]);

  // Use custom size if set, otherwise calculate from image dimensions
  const nodeWidth = useMemo(() => {
    if ((data as any).nodeWidth) return (data as any).nodeWidth;
    if (data.width > 0 && data.height > 0) {
      return data.height > data.width ? 240 : 320;
    }
    return 280;
  }, [data.width, data.height, (data as any).nodeWidth]);

  const nodeHeight = useMemo(() => {
    if ((data as any).nodeHeight) return (data as any).nodeHeight;
    if (data.width > 0 && data.height > 0) {
      const h = Math.round((nodeWidth * data.height) / data.width);
      return Math.max(160, Math.min(420, h));
    }
    return 200;
  }, [data.width, data.height, nodeWidth, (data as any).nodeHeight]);

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
      const newWidth = Math.max(120, startWidth + deltaX);
      const newHeight = Math.max(100, startHeight + deltaY);
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = data.url || data.thumbnail;
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const createConnectedAINode = (type: "ai-chat" | "ai-generator") => {
    const imageNode = getNodeById(id);
    const basePos = imageNode?.position || { x: 0, y: 0 };
    const newId = `${type}-${Date.now()}`;
    const createdAt = new Date();

    const position = {
      x: basePos.x + nodeWidth + 120,
      y: basePos.y,
    };

    if (type === "ai-chat") {
      addNode({
        id: newId,
        type: "ai-chat",
        position,
        data: {
          type: "ai-chat",
          label: "AI Chat",
          model: "claude-sonnet-4",
          conversation: [],
          connectedAssetIds: [id],
          isExpanded: true,
          createdAt,
          updatedAt: createdAt,
          userId: "",
        } as any,
      } as any);
    }

    if (type === "ai-generator") {
      addNode({
        id: newId,
        type: "ai-generator",
        position,
        data: {
          type: "ai-generator",
          label: "AI Generator",
          provider: "flux-pro",
          prompt: "",
          referenceImageIds: [id],
          parameters: {
            aspectRatio: "1:1",
            quality: "standard",
          },
          generationHistory: [],
          status: "idle",
          createdAt,
          updatedAt: createdAt,
          userId: "",
        } as any,
      } as any);
    }

    addEdge({
      id: `edge-${id}-${newId}`,
      source: id,
      target: newId,
      type: "smoothstep",
      animated: true,
      data: {
        connectionType: "ai-input",
        color: "#8B5CF6",
        style: "dashed",
      },
    } as any);
  };

  return (
    <div
      className="relative"
      style={{
        width: nodeWidth,
        height: nodeHeight,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isResizing) {
          setIsHovered(false);
          setShowMenu(false);
        }
      }}
    >
      {/* Main card container */}
      <div
        className={`
          w-full h-full bg-white rounded-xl border shadow-sm overflow-hidden
          transition-all duration-200 cursor-pointer
          ${selected ? "ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-gray-200 hover:border-gray-300"}
        `}
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

      {/* Image Preview */}
      <div className="relative w-full h-full bg-gray-100">
        {data.url ? (
          <img
            src={data.thumbnail || data.url}
            alt={data.label}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}

        {/* Subtle hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        )}

      </div>
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        onPointerDown={handleResizeStart}
        className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize transition-opacity flex items-center justify-center nodrag nopan ${isHovered || isResizing ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 50, touchAction: "none" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-white drop-shadow-md">
          <path d="M10 6L6 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Animated action bar below card - appears on selection */}
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
          onClick={handleOpenInNewTab}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
          title="View full size"
        >
          <Eye className="h-4 w-4 text-gray-500" />
        </button>
        
        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
              title="Use as AI reference"
            >
              <Sparkles className="h-4 w-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="center"
            className="w-44"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                createConnectedAINode("ai-chat");
              }}
            >
              AI Chat
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                createConnectedAINode("ai-generator");
              }}
            >
              AI Generator
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
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
    </div>
  );
}

export default memo(ImageNode);
