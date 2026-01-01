"use client";

import { memo, useState, useMemo, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { UrlNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  Link2, 
  Trash2, 
  Copy, 
  ExternalLink,
  Eye,
  Play,
} from "lucide-react";

// Get badge info for link type
function getLinkTypeBadge(linkType?: string): { label: string; color: string } {
  switch (linkType) {
    case "youtube": return { label: "YouTube", color: "bg-red-600" };
    case "vimeo": return { label: "Vimeo", color: "bg-blue-500" };
    case "twitch": return { label: "Twitch", color: "bg-purple-600" };
    case "tiktok": return { label: "TikTok", color: "bg-black" };
    case "video": return { label: "Video", color: "bg-orange-500" };
    case "twitter": return { label: "X", color: "bg-black" };
    case "instagram": return { label: "Instagram", color: "bg-pink-500" };
    case "facebook": return { label: "Facebook", color: "bg-blue-600" };
    case "linkedin": return { label: "LinkedIn", color: "bg-blue-700" };
    case "reddit": return { label: "Reddit", color: "bg-orange-600" };
    case "spotify": return { label: "Spotify", color: "bg-green-600" };
    case "github": return { label: "GitHub", color: "bg-gray-800" };
    case "figma": return { label: "Figma", color: "bg-purple-500" };
    case "notion": return { label: "Notion", color: "bg-gray-900" };
    case "article": return { label: "Article", color: "bg-[var(--accent-primary)]" };
    default: return { label: "Website", color: "bg-gray-600" };
  }
}

// Check if link type is video
function isVideoType(linkType?: string): boolean {
  return linkType === "youtube" || linkType === "vimeo" || linkType === "twitch" || linkType === "tiktok" || linkType === "video";
}

function UrlNode({ id, data, selected }: NodeProps<UrlNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { deleteNode, duplicateNode, updateNode } = useCanvasStore();

  // Get link type from data
  const linkType = (data as any).linkType;
  const isVideo = isVideoType(linkType);
  const badge = getLinkTypeBadge(linkType);

  // Calculate node size based on link type (video = landscape, other = portrait)
  const nodeWidth = useMemo(() => {
    if ((data as any).nodeWidth) return (data as any).nodeWidth;
    return isVideo ? 320 : 180;
  }, [(data as any).nodeWidth, isVideo]);

  const nodeHeight = useMemo(() => {
    if ((data as any).nodeHeight) return (data as any).nodeHeight;
    return isVideo ? 200 : 260;
  }, [(data as any).nodeHeight, isVideo]);

  // Resize handler
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
      const newWidth = Math.max(140, startWidth + deltaX);
      const newHeight = Math.max(160, startHeight + deltaY);
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
    if (data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="relative group"
      style={{ width: nodeWidth, height: nodeHeight }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovered(false);
      }}
    >
      {/* Main card container */}
      <div
        className={`
          w-full h-full rounded-2xl overflow-hidden bg-gray-900 cursor-pointer
          transition-all duration-200
          ${selected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : "hover:ring-2 hover:ring-gray-300"}
        `}
        onDoubleClick={handleOpenInNewTab}
      >
        {/* Connection Handles */}
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

        {/* Thumbnail or Placeholder */}
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
            <Link2 className="h-10 w-10 text-white/50" />
          </div>
        )}

        {/* Link type badge */}
        <div className={`absolute top-3 right-3 px-2 py-0.5 ${badge.color} rounded text-[10px] font-medium text-white shadow-sm`}>
          {badge.label}
        </div>

        {/* Bottom gradient with title */}
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent ${isVideo ? "pt-10 pb-3 px-3" : "pt-8 pb-2.5 px-2.5"}`}>
          <div className="flex items-center gap-1.5">
            {isVideo ? (
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="h-2.5 w-2.5 text-white fill-white ml-0.5" />
              </div>
            ) : (
              <Link2 className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
            )}
            <span className={`${isVideo ? "text-sm" : "text-xs"} text-white font-medium line-clamp-2`}>
              {data.title || data.label || "Untitled"}
            </span>
          </div>
        </div>

        {/* Hover overlay with external link */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <ExternalLink className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Resize handle */}
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
          title="Open link"
        >
          <Eye className="h-4 w-4 text-gray-500" />
        </button>
        
        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        
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

export default memo(UrlNode);
