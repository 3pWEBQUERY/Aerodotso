"use client";

import { useState, useRef, useCallback } from "react";
import {
  Image,
  Video,
  FileText,
  StickyNote,
  MessageSquare,
  Wand2,
  Link2,
  Folder,
  Plus,
  ChevronDown,
  ChevronUp,
  Share2,
  CheckSquare,
  GripVertical,
} from "lucide-react";

const NODE_TYPES = [
  {
    category: "Media",
    items: [
      { type: "image", label: "Image", icon: Image, color: "text-blue-500", bg: "bg-blue-50" },
      { type: "video", label: "Video", icon: Video, color: "text-red-500", bg: "bg-red-50" },
      { type: "document", label: "Document", icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
      { type: "url", label: "Links", icon: Link2, color: "text-indigo-500", bg: "bg-indigo-50" },
      { type: "social-post", label: "Social Post", icon: Share2, color: "text-pink-500", bg: "bg-pink-50" },
    ],
  },
  {
    category: "Content",
    items: [
      { type: "note", label: "Note", icon: StickyNote, color: "text-amber-500", bg: "bg-amber-50" },
      { type: "postit", label: "Post-it", icon: CheckSquare, color: "text-green-500", bg: "bg-green-50" },
      { type: "folder", label: "Folder", icon: Folder, color: "text-gray-500", bg: "bg-gray-50" },
    ],
  },
  {
    category: "AI",
    items: [
      { type: "ai-chat", label: "AI Chat", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-50" },
      { type: "ai-generator", label: "AI Generator", icon: Wand2, color: "text-[var(--accent-primary-light)]", bg: "bg-[var(--accent-primary)]/10" },
    ],
  },
];

interface DraggableNodePaletteProps {
  onAddNode?: (nodeType: string, label: string) => void;
}

export function DraggableNodePalette({ onAddNode }: DraggableNodePaletteProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Media", "Content", "AI"]);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow-type", nodeType);
    event.dataTransfer.setData(
      "application/reactflow-data",
      JSON.stringify({ label })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging from the header area
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;
      
      setPosition({
        x: elementStartPos.current.x + deltaX,
        y: elementStartPos.current.y + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [position]);

  return (
    <div
      ref={elementRef}
      className={`absolute z-40 select-none ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        transition: isDragging ? "none" : "box-shadow 0.2s",
        boxShadow: isDragging ? "0 10px 40px rgba(0,0,0,0.15)" : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="rounded-xl shadow-lg border border-[var(--workspace-sidebar-border)] overflow-hidden" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
        {/* Header - Drag Handle */}
        <button
          type="button"
          data-drag-handle
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--workspace-sidebar-muted)] transition-colors ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }} />
            <Plus className="h-4 w-4" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }} />
            <span className="text-sm" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }}>Add Nodes</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }} />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="border-t" style={{ borderColor: 'var(--workspace-sidebar-border)' }}>
            {NODE_TYPES.map((category) => (
              <div key={category.category}>
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.category)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[var(--workspace-sidebar-muted)] transition-colors"
                  style={{ backgroundColor: 'var(--workspace-sidebar-muted)' }}
                >
                  <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }}>
                    {category.category}
                  </span>
                  {expandedCategories.includes(category.category) ? (
                    <ChevronUp className="h-3 w-3" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }} />
                  ) : (
                    <ChevronDown className="h-3 w-3" style={{ color: 'var(--workspace-sidebar-muted-foreground)' }} />
                  )}
                </button>

                {/* Items */}
                {expandedCategories.includes(category.category) && (
                  <div className="p-2 grid grid-cols-2 gap-1.5">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          draggable
                          onDragStart={(e) => onDragStart(e, item.type, item.label)}
                          onClick={() => onAddNode?.(item.type, item.label)}
                          className="group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab border transition-all duration-200 hover:shadow-sm active:cursor-grabbing hover:bg-[var(--workspace-sidebar-muted)]"
                          style={{ 
                            backgroundColor: 'var(--workspace-sidebar)', 
                            borderColor: 'var(--workspace-sidebar-border)'
                          }}
                          title={`Drag to add ${item.label}`}
                        >
                          <Icon className="h-3.5 w-3.5 text-[var(--workspace-sidebar-muted-foreground)] group-hover:text-[var(--accent-primary-light)]" />
                          <span className="text-xs font-medium text-[var(--workspace-sidebar-muted-foreground)] group-hover:text-[var(--accent-primary-light)]">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DraggableNodePalette;
