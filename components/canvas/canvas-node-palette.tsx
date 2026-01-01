"use client";

import { useState } from "react";
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

interface CanvasNodePaletteProps {
  onAddNode?: (nodeType: string, label: string) => void;
}

export function CanvasNodePalette({ onAddNode }: CanvasNodePaletteProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Media", "Content", "AI"]);

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

  return (
    <div className="rounded-xl shadow-lg border border-[var(--workspace-sidebar-border)] overflow-hidden" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--workspace-sidebar-muted)] transition-colors"
      >
        <div className="flex items-center gap-2">
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
  );
}

export default CanvasNodePalette;
