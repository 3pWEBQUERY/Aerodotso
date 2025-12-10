"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { UrlNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  Link2, 
  Trash2, 
  Copy, 
  ExternalLink,
  Globe
} from "lucide-react";

function UrlNode({ id, data, selected }: NodeProps<UrlNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const { deleteNode, duplicateNode } = useCanvasStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleOpen = () => {
    if (data.url) {
      window.open(data.url, "_blank");
    }
  };

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl border shadow-sm overflow-hidden
        transition-all duration-200 cursor-pointer
        ${selected ? "ring-2 ring-emerald-500 border-emerald-500" : "border-gray-200 hover:border-gray-300"}
      `}
      style={{ width: 280, minHeight: 140 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleOpen}
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

      {/* Thumbnail or Placeholder */}
      {data.thumbnail ? (
        <div className="h-24 bg-gray-100 relative">
          <img
            src={data.thumbnail}
            alt={data.title || "Link preview"}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {isHovered && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                type="button"
                onClick={handleOpen}
                className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="h-20 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          <Globe className="h-8 w-8 text-blue-300" />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Favicon */}
          <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
            {data.favicon ? (
              <img src={data.favicon} alt="" className="w-4 h-4" />
            ) : (
              <Link2 className="h-3 w-3 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {data.title || data.label || "Link"}
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {data.siteName || getDomain(data.url)}
            </p>
          </div>

          {/* Actions */}
          {isHovered && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleDuplicate}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(UrlNode);
