"use client";

import { memo, useEffect, useMemo, useState } from "react";
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

  const nodeWidth = useMemo(() => {
    if (data.width > 0 && data.height > 0) {
      // portrait -> narrower, landscape -> wider
      return data.height > data.width ? 240 : 320;
    }
    return 280;
  }, [data.width, data.height]);

  const nodeHeight = useMemo(() => {
    if (data.width > 0 && data.height > 0) {
      const h = Math.round((nodeWidth * data.height) / data.width);
      return Math.max(160, Math.min(420, h));
    }
    return 200;
  }, [data.width, data.height, nodeWidth]);

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
      className={`
        relative bg-white rounded-xl border shadow-sm overflow-hidden
        transition-all duration-200 cursor-pointer
        ${selected ? "ring-2 ring-emerald-500 border-emerald-500" : "border-gray-200 hover:border-gray-300"}
      `}
      style={{
        width: nodeWidth,
        height: nodeHeight,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
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

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              title="View full size"
            >
              <Eye className="h-4 w-4 text-gray-700" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  title="Use as AI reference"
                >
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
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
              className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              title="Duplicate"
            >
              <Copy className="h-4 w-4 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        {/* AI Tags Badge */}
        {data.aiTags && data.aiTags.length > 0 && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-violet-500/90 text-white text-[10px] rounded-xl">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AI Tagged</span>
            </div>
          </div>
        )}

        {/* Label Overlay (no white footer) */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 min-w-0">
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/30 backdrop-blur-md border border-white/30 shadow-sm min-w-0">
            <div className="w-6 h-6 rounded-md bg-white/35 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-medium text-white truncate">
              {data.label || "Image"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ImageNode);
