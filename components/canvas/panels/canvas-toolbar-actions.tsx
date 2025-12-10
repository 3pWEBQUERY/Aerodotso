"use client";

import { useState } from "react";
import {
  Search,
  History,
  Settings,
  Keyboard,
  LayoutGrid,
  Download,
  Sparkles,
  ChevronDown,
  Grid3X3,
  Circle,
  Clock,
  Layers,
  GitBranch,
  Wand2,
} from "lucide-react";
import { useCanvasStore } from "@/lib/canvas/store";
import { applySmartLayout, suggestBestLayout } from "@/lib/canvas/layout-engine";
import { LayoutStyle } from "@/lib/canvas/types";

interface CanvasToolbarActionsProps {
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenKeyboardHelp: () => void;
}

const LAYOUT_OPTIONS = [
  { style: LayoutStyle.GRID, label: "Grid", icon: Grid3X3 },
  { style: LayoutStyle.RADIAL, label: "Radial", icon: Circle },
  { style: LayoutStyle.TIMELINE, label: "Timeline", icon: Clock },
  { style: LayoutStyle.STORYBOARD, label: "Storyboard", icon: Layers },
  { style: LayoutStyle.CLUSTER, label: "Cluster", icon: GitBranch },
];

export function CanvasToolbarActions({
  onOpenSearch,
  onOpenHistory,
  onOpenSettings,
  onOpenKeyboardHelp,
}: CanvasToolbarActionsProps) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const { nodes, loadCanvas } = useCanvasStore();

  const applyLayout = (style: LayoutStyle) => {
    const layoutedNodes = applySmartLayout(nodes, {
      style,
      spacing: 50,
      padding: 100,
      animate: true,
    });
    loadCanvas({ nodes: layoutedNodes });
    setShowLayoutMenu(false);
  };

  const autoLayout = () => {
    const suggested = suggestBestLayout(nodes);
    applyLayout(suggested);
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-xl shadow-lg border">
        {/* Search */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Search Nodes (⌘F)"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </button>

        <div className="w-px h-5 bg-gray-200" />

        {/* Layout */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Layout Options"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Layout</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showLayoutMenu && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border py-1 z-50">
              {/* Auto Layout */}
              <button
                type="button"
                onClick={autoLayout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>Auto Layout</span>
              </button>

              <div className="border-t my-1" />

              {/* Manual layouts */}
              {LAYOUT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.style}
                    type="button"
                    onClick={() => applyLayout(option.style)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* History */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="History (⌘H)"
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </button>

        <div className="w-px h-5 bg-gray-200" />

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Settings (⌘,)"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Keyboard Help */}
        <button
          type="button"
          onClick={onOpenKeyboardHelp}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default CanvasToolbarActions;
