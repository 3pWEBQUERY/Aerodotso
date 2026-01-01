"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Link2,
  MoreHorizontal,
} from "lucide-react";

interface SelectionToolbarProps {
  canvasRect?: DOMRect;
}

export function SelectionToolbar({ canvasRect }: SelectionToolbarProps) {
  const {
    selectedNodeIds,
    nodes,
    deleteNodes,
    copyNodes,
    duplicateNode,
    updateNode,
  } = useCanvasStore();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  const hasSelection = selectedNodes.length > 0;
  const singleSelection = selectedNodes.length === 1;
  const multiSelection = selectedNodes.length > 1;

  // Calculate toolbar position based on selected nodes
  useEffect(() => {
    if (!hasSelection) return;

    // Find bounding box of selected nodes
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    selectedNodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 300); // approximate node width
      maxY = Math.max(maxY, node.position.y + 200); // approximate node height
    });

    // Position toolbar above the selection
    setPosition({
      x: (minX + maxX) / 2,
      y: minY - 60,
    });
  }, [selectedNodes, hasSelection]);

  if (!hasSelection) return null;

  const handleDelete = () => {
    deleteNodes(selectedNodeIds);
  };

  const handleCopy = () => {
    copyNodes(selectedNodeIds);
  };

  const handleDuplicate = () => {
    if (singleSelection) {
      duplicateNode(selectedNodeIds[0]);
    } else {
      // Duplicate all selected nodes
      selectedNodeIds.forEach((id) => duplicateNode(id));
    }
  };

  const handleToggleLock = () => {
    const anyLocked = selectedNodes.some((n) => n.data.isLocked);
    selectedNodeIds.forEach((id) => {
      updateNode(id, { isLocked: !anyLocked });
    });
  };

  // Alignment functions
  const alignNodes = (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (!multiSelection) return;

    const positions = selectedNodes.map((n) => n.position);
    
    let targetValue: number;
    
    switch (alignment) {
      case "left":
        targetValue = Math.min(...positions.map((p) => p.x));
        selectedNodeIds.forEach((id, i) => {
          const node = nodes.find((n) => n.id === id);
          if (node) {
            updateNode(id, {} as any);
            // Would need to update position through React Flow
          }
        });
        break;
      case "center":
        const minX = Math.min(...positions.map((p) => p.x));
        const maxX = Math.max(...positions.map((p) => p.x + 300));
        targetValue = (minX + maxX) / 2;
        break;
      case "right":
        targetValue = Math.max(...positions.map((p) => p.x + 300));
        break;
      case "top":
        targetValue = Math.min(...positions.map((p) => p.y));
        break;
      case "middle":
        const minY = Math.min(...positions.map((p) => p.y));
        const maxY = Math.max(...positions.map((p) => p.y + 200));
        targetValue = (minY + maxY) / 2;
        break;
      case "bottom":
        targetValue = Math.max(...positions.map((p) => p.y + 200));
        break;
    }
    
    setShowAlignMenu(false);
  };

  const anyLocked = selectedNodes.some((n) => n.data.isLocked);

  return (
    <div
      className="absolute z-40 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: "translateX(-50%)",
      }}
    >
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg border"
        style={{
          backgroundColor: "var(--workspace-sidebar)",
          borderColor: "var(--workspace-sidebar-border)",
        }}
      >
        {/* Selection count */}
        <div
          className="px-2 py-1 text-xs font-medium border-r mr-1"
          style={{
            color: "rgba(255,255,255,0.7)",
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          {selectedNodes.length} selected
        </div>

        {/* Copy */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--workspace-sidebar-muted-foreground)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--workspace-sidebar-muted-foreground)")}
          title="Copy (⌘C)"
        >
          <Copy className="h-4 w-4" />
        </button>

        {/* Duplicate */}
        <button
          type="button"
          onClick={handleDuplicate}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--workspace-sidebar-muted-foreground)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--workspace-sidebar-muted-foreground)")}
          title="Duplicate (⌘D)"
        >
          <Layers className="h-4 w-4" />
        </button>

        {/* Lock/Unlock */}
        <button
          type="button"
          onClick={handleToggleLock}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--workspace-sidebar-muted-foreground)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--workspace-sidebar-muted-foreground)")}
          title={anyLocked ? "Unlock" : "Lock"}
        >
          {anyLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </button>

        {/* Align (only for multi-selection) */}
        {multiSelection && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAlignMenu(!showAlignMenu)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--workspace-sidebar-muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--workspace-sidebar-muted-foreground)")}
              title="Align"
            >
              <AlignCenter className="h-4 w-4" />
            </button>

            {showAlignMenu && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-xl border z-50"
                style={{
                  backgroundColor: "var(--workspace-sidebar)",
                  borderColor: "var(--workspace-sidebar-border)",
                  color: "#fff",
                }}
              >
                <div className="text-[10px] uppercase tracking-wider mb-2 px-1 text-white/60">
                  Horizontal
                </div>
                <div className="flex gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => alignNodes("left")}
                    className="p-1.5 rounded transition-colors hover:bg-[var(--workspace-sidebar-muted)]"
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4 text-white/80" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alignNodes("center")}
                    className="p-1.5 rounded transition-colors hover:bg-[var(--workspace-sidebar-muted)]"
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4 text-white/80" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alignNodes("right")}
                    className="p-1.5 rounded transition-colors hover:bg-[var(--workspace-sidebar-muted)]"
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4 text-white/80" />
                  </button>
                </div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider mb-2 px-1">
                  Vertical
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => alignNodes("top")}
                    className="p-1.5 rounded transition-colors hover:bg-[var(--workspace-sidebar-muted)]"
                    title="Align Top"
                  >
                    <AlignStartVertical className="h-4 w-4 text-white/80" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alignNodes("middle")}
                    className="p-1.5 rounded transition-colors hover:bg-[var(--workspace-sidebar-muted)]"
                    title="Align Middle"
                  >
                    <AlignCenterVertical className="h-4 w-4 text-white/80" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alignNodes("bottom")}
                    className="p-1.5 rounded transition-colors hover:bg-[var(--workspace-sidebar-muted)]"
                    title="Align Bottom"
                  >
                    <AlignEndVertical className="h-4 w-4 text-white/80" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className="w-px h-5 mx-1"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        />

        {/* AI Actions */}
        <button
          type="button"
          className="p-1.5 text-violet-300 hover:bg-violet-500/20 hover:text-white rounded-lg transition-colors"
          title="Analyze with AI"
        >
          <Image
            src="/ai.svg"
            alt="AI"
            width={16}
            height={16}
            className="h-4 w-4 invert brightness-200"
            priority={false}
          />
        </button>

        {/* Connect */}
        <button
          type="button"
          className="p-1.5 text-blue-300 hover:bg-blue-500/20 hover:text-white rounded-lg transition-colors"
          title="Create Connection"
        >
          <Link2 className="h-4 w-4" />
        </button>

        <div
          className="w-px h-5 mx-1"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        />

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          className="p-1.5 text-red-300 hover:bg-red-500/20 hover:text-white rounded-lg transition-colors"
          title="Delete (⌫)"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default SelectionToolbar;
