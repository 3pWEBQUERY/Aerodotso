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
} from "lucide-react";

const NODE_TYPES = [
  {
    category: "Media",
    items: [
      { type: "image", label: "Image", icon: Image, color: "text-blue-500", bg: "bg-blue-50" },
      { type: "video", label: "Video", icon: Video, color: "text-red-500", bg: "bg-red-50" },
      { type: "document", label: "Document", icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
      { type: "url", label: "URL", icon: Link2, color: "text-indigo-500", bg: "bg-indigo-50" },
      { type: "social-post", label: "Social Post", icon: Share2, color: "text-pink-500", bg: "bg-pink-50" },
    ],
  },
  {
    category: "Content",
    items: [
      { type: "note", label: "Note", icon: StickyNote, color: "text-amber-500", bg: "bg-amber-50" },
      { type: "group", label: "Group", icon: Folder, color: "text-gray-500", bg: "bg-gray-50" },
    ],
  },
  {
    category: "AI",
    items: [
      { type: "ai-chat", label: "AI Chat", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-50" },
      { type: "ai-generator", label: "AI Generator", icon: Wand2, color: "text-emerald-500", bg: "bg-emerald-50" },
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
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Add Nodes</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          {NODE_TYPES.map((category) => (
            <div key={category.category}>
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.category)}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                  {category.category}
                </span>
                {expandedCategories.includes(category.category) ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
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
                        className={`
                          flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab
                          border border-transparent hover:border-gray-200
                          ${item.bg} transition-all duration-200
                          hover:shadow-sm active:cursor-grabbing
                        `}
                        title={`Drag to add ${item.label}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        <span className="text-xs font-medium text-gray-700">
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
