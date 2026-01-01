"use client";

import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { VideoNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  Trash2, 
  Copy, 
  Film,
  Eye,
  Sparkles,
} from "lucide-react";

function VideoNode({ id, data, selected }: NodeProps<VideoNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { deleteNode, duplicateNode, updateNode } = useCanvasStore();

  // Load video dimensions if missing
  useEffect(() => {
    if (!data.url) return;
    if (data.width > 0 && data.height > 0) return;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      updateNode(id, {
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      } as any);
    };
    video.src = data.url;

    return () => {
      video.src = "";
    };
  }, [data.url, data.width, data.height, id, updateNode]);

  // Calculate node size based on video dimensions (like Image node)
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

  // Auto-play on hover, pause on mouse leave
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isHovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

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
    if (!data.url) return;
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="relative"
      style={{ width: nodeWidth, height: nodeHeight }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovered(false);
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

        {/* Video Preview */}
        <div className="relative w-full h-full bg-gray-900">
          {data.url ? (
            <video
              ref={videoRef}
              src={data.url}
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-8 w-8 text-gray-600" />
            </div>
          )}

          {/* Subtle hover overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          )}

        </div>
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

      {/* Animated action bar below card - appears on selection (same as Image) */}
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

export default memo(VideoNode);
