"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { GroupNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  Cloud, 
  Trash2, 
  Pencil,
  FolderOpen,
  ChevronUp
} from "lucide-react";

function GroupNode({ id, data, selected }: NodeProps<GroupNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [label, setLabel] = useState(data.label || "Folder 01");
  const [description, setDescription] = useState((data as any).description || "");
  const [isResizing, setIsResizing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const { deleteNode, updateNode, removeNodeFromFolder, toggleFolderOpen } = useCanvasStore();
  
  // Get child nodes count and open state
  const childCount = data.childNodeIds?.length || 0;
  const isOpen = (data as any).isOpen || false;

  // Handle double-click to toggle folder open/close
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (childCount > 0) {
      toggleFolderOpen(id);
    }
  }, [id, childCount, toggleFolderOpen]);

  // Get dimensions from data or use defaults
  const width = (data as any).width || 200;
  const height = (data as any).height || 240;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleSaveLabel = () => {
    updateNode(id, { label: label.trim() || "Folder 01" });
    setIsEditing(false);
  };

  const handleSaveDescription = () => {
    updateNode(id, { description: description.trim() } as any);
    setIsEditingDescription(false);
  };

  // Custom resize handlers
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Capture pointer to ensure we get all events
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(160, startWidth + deltaX);
      const newHeight = Math.max(200, startHeight + deltaY);
      updateNode(id, { width: newWidth, height: newHeight } as any);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }, [id, width, height, updateNode]);

  // Format date
  const createdDate = data.createdAt 
    ? new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <div 
      style={{ width, height }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isResizing && setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Main folder card */}
      <div
        className={`w-full h-full rounded-[24px] overflow-hidden relative transition-all duration-300 ${isDragOver ? 'ring-4 ring-orange-400 ring-opacity-50 scale-[1.02]' : ''} ${isOpen ? 'ring-2 ring-orange-300' : ''}`}
        style={{
          background: isDragOver 
            ? "linear-gradient(165deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)"
            : isOpen
              ? "linear-gradient(165deg, #FFF7ED 0%, #FEF3C7 50%, #FDE68A 100%)"
              : "linear-gradient(165deg, #FFFFFF 0%, #F8F8F8 50%, #F3F3F3 100%)",
          boxShadow: isDragOver
            ? "0 12px 40px rgba(245, 98, 43, 0.2), 0 4px 12px rgba(0,0,0,0.1)"
            : isOpen
              ? "0 12px 40px rgba(245, 158, 11, 0.2), 0 4px 12px rgba(0,0,0,0.1)"
              : "0 8px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={() => setIsDragOver(false)}
      >
        {/* Orange folder tab on the right */}
        <div 
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-16 rounded-l-xl"
          style={{
            background: "linear-gradient(180deg, #FF8A5B 0%, #F5622B 100%)",
            boxShadow: "-2px 0 12px rgba(245, 98, 43, 0.3)",
          }}
        />

        {/* Connection Handles - outside card when selected */}
        <Handle
          type="target"
          position={Position.Left}
          className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-left-4 !opacity-100' : '!opacity-0'}`}
          style={{ top: "50%" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-right-4 !opacity-100' : '!opacity-0'}`}
          style={{ top: "50%" }}
        />

        {/* Badge with icon and item count */}
        <div className="absolute top-4 left-4">
          <div 
            className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
              isDragOver ? 'bg-orange-100' : isOpen ? 'bg-orange-500' : 'bg-white/90'
            }`}
            style={{ 
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (childCount > 0) toggleFolderOpen(id);
            }}
          >
            {isDragOver ? (
              <>
                <FolderOpen className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-[11px] font-medium text-orange-500">Drop here</span>
              </>
            ) : isOpen ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-white" />
                <span className="text-[11px] font-medium text-white">Open</span>
              </>
            ) : (
              <>
                <Cloud className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-400">
                  {childCount > 0 ? `${childCount} items` : 'Empty'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {isHovered && (
          <div className="absolute top-4 right-6 flex items-center gap-0.5 bg-white/95 rounded-lg px-1 py-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
              title="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pr-6">
          {/* Folder title */}
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
              className="w-full px-2 py-1 text-xs font-medium text-gray-500 bg-white rounded-md outline-none focus:ring-1 focus:ring-orange-300"
              autoFocus
            />
          ) : (
            <p
              className="text-xs font-medium text-gray-400 cursor-text hover:text-gray-500 mb-0.5"
              onClick={() => setIsEditing(true)}
            >
              {data.label || "Folder 01"}
            </p>
          )}

          {/* Description */}
          {isEditingDescription ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSaveDescription()}
              className="w-full px-2 py-1 text-sm font-semibold text-gray-600 bg-white rounded-md outline-none focus:ring-1 focus:ring-orange-300 resize-none"
              rows={2}
              autoFocus
            />
          ) : (
            <p
              className="text-sm font-semibold text-gray-600 leading-tight cursor-text hover:text-gray-700"
              onClick={() => setIsEditingDescription(true)}
            >
              {(data as any).description || "Give me a title."}
            </p>
          )}

          {/* Date */}
          <p className="text-[9px] text-gray-400 mt-2 uppercase tracking-wider">
            Created on {createdDate || "Jul 13"}
          </p>
        </div>
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        onPointerDown={handleResizeStart}
        className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize transition-opacity flex items-center justify-center nodrag nopan ${isHovered || isResizing ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 50, touchAction: "none" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-gray-400">
          <path d="M10 6L6 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default memo(GroupNode);
