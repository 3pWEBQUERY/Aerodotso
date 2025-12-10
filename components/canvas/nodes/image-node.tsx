"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ImageNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
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
  const { deleteNode, duplicateNode } = useCanvasStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl border shadow-sm overflow-hidden
        transition-all duration-200 cursor-pointer
        ${selected ? "ring-2 ring-emerald-500 border-emerald-500" : "border-gray-200 hover:border-gray-300"}
      `}
      style={{ width: 280, minHeight: 200 }}
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
      <div className="relative aspect-video bg-gray-100">
        {data.url ? (
          <img
            src={data.thumbnail || data.url}
            alt={data.label}
            className="w-full h-full object-cover"
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
              className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              title="View full size"
            >
              <Eye className="h-4 w-4 text-gray-700" />
            </button>
            <button
              type="button"
              className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              title="Use as AI reference"
            >
              <Sparkles className="h-4 w-4 text-violet-600" />
            </button>
          </div>
        )}

        {/* AI Tags Badge */}
        {data.aiTags && data.aiTags.length > 0 && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-violet-500/90 text-white text-[10px] rounded-full">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AI Tagged</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 truncate">
              {data.label || "Image"}
            </span>
          </div>

          {/* Actions */}
          {isHovered && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDuplicate}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Dimensions */}
        {data.width && data.height && (
          <p className="text-[10px] text-gray-400 mt-1">
            {data.width} × {data.height}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(ImageNode);
