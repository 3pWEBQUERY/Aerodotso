"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import { useReactFlow } from "reactflow";
import {
  Search,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  StickyNote,
  MessageSquare,
  Wand2,
  Link2,
  Folder,
  Filter,
  ArrowRight,
} from "lucide-react";

const NODE_TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  note: StickyNote,
  "ai-chat": MessageSquare,
  "ai-generator": Wand2,
  url: Link2,
  group: Folder,
};

const NODE_TYPE_COLORS: Record<string, string> = {
  image: "text-blue-500 bg-blue-50",
  video: "text-red-500 bg-red-50",
  document: "text-orange-500 bg-orange-50",
  note: "text-amber-500 bg-amber-50",
  "ai-chat": "text-violet-500 bg-violet-50",
  "ai-generator": "text-emerald-500 bg-emerald-50",
  url: "text-indigo-500 bg-indigo-50",
  group: "text-gray-500 bg-gray-50",
};

interface NodeSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NodeSearch({ isOpen, onClose }: NodeSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { nodes, setSelectedNodes } = useCanvasStore();
  const { setCenter, getZoom } = useReactFlow();

  // Filter nodes
  const filteredNodes = useMemo(() => {
    let result = nodes;

    // Type filter
    if (typeFilter) {
      result = result.filter((n) => n.data.type === typeFilter);
    }

    // Search filter
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter((n) => {
        const label = n.data.label?.toLowerCase() || "";
        const content = (n.data as any).content?.toLowerCase() || "";
        const tags = n.data.tags?.join(" ").toLowerCase() || "";
        return label.includes(lower) || content.includes(lower) || tags.includes(lower);
      });
    }

    return result;
  }, [nodes, search, typeFilter]);

  // Node type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => {
      counts[n.data.type] = (counts[n.data.type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredNodes.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredNodes.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const node = filteredNodes[selectedIndex];
        if (node) {
          goToNode(node.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredNodes, selectedIndex, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const goToNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Center viewport on node
    const x = node.position.x + 150; // Approximate node center
    const y = node.position.y + 100;
    setCenter(x, y, { zoom: getZoom(), duration: 500 });

    // Select the node
    setSelectedNodes([nodeId]);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search nodes by name, content, or tags..."
            className="flex-1 text-sm outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Type Filters */}
        <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2 overflow-x-auto">
          <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              !typeFilter
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            All ({nodes.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const Icon = NODE_TYPE_ICONS[type] || FileText;
            const isActive = typeFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(isActive ? null : type)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="capitalize">{type.replace("-", " ")}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto">
          {filteredNodes.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No nodes found
            </div>
          ) : (
            <div className="py-2">
              {filteredNodes.map((node, index) => {
                const Icon = NODE_TYPE_ICONS[node.data.type] || FileText;
                const colorClass = NODE_TYPE_COLORS[node.data.type] || "text-gray-500 bg-gray-50";
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={node.id}
                    data-index={index}
                    type="button"
                    onClick={() => goToNode(node.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-emerald-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? "text-emerald-700" : "text-gray-700"}`}>
                        {node.data.label || `Untitled ${node.data.type}`}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {node.data.type.replace("-", " ")}
                        {node.data.tags && node.data.tags.length > 0 && (
                          <span> · {node.data.tags.slice(0, 2).join(", ")}</span>
                        )}
                      </p>
                    </div>
                    <ArrowRight className={`h-4 w-4 ${isSelected ? "text-emerald-500" : "text-gray-300"}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>{filteredNodes.length} of {nodes.length} nodes</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">↑↓</kbd>
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">↵</kbd>
            <span>Go to</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NodeSearch;
