"use client";

import { memo } from "react";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";
import { CanvasConnectionData, ConnectionStyles, ConnectionType } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { Link2, Sparkles, Palette, ArrowRight, X } from "lucide-react";

const ConnectionIcons: Record<ConnectionType, typeof Link2> = {
  reference: Link2,
  "ai-input": Sparkles,
  "ai-output": Sparkles,
  inspiration: Palette,
  "style-source": Palette,
};

function AIConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps<CanvasConnectionData>) {
  const { deleteEdge } = useCanvasStore();
  
  const connectionType = data?.connectionType || "reference";
  const connectionStyle = ConnectionStyles[connectionType];
  const Icon = ConnectionIcons[connectionType];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate stroke dasharray based on style
  const getStrokeDasharray = () => {
    switch (connectionStyle.style) {
      case "dashed":
        return "8 4";
      case "dotted":
        return "2 4";
      default:
        return undefined;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEdge(id);
  };

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: data?.color || connectionStyle.color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: getStrokeDasharray(),
          filter: selected ? "drop-shadow(0 0 4px rgba(0,0,0,0.2))" : undefined,
        }}
      />

      {/* Animated particles for AI connections */}
      {(connectionType === "ai-input" || connectionType === "ai-output") && data?.animated !== false && (
        <circle r="4" fill={connectionStyle.color}>
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {/* Edge label with icon */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {/* Connection type badge */}
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-medium
              transition-all duration-200 cursor-pointer group
              ${selected ? "scale-110" : "hover:scale-105"}
            `}
            style={{
              backgroundColor: `${connectionStyle.color}15`,
              color: connectionStyle.color,
              border: `1px solid ${connectionStyle.color}30`,
            }}
          >
            <Icon className="h-3 w-3" />
            <span>{data?.label || connectionStyle.label}</span>
            
            {/* Delete button - visible on hover */}
            <button
              type="button"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 -mr-1 p-0.5 rounded-xl hover:bg-red-100 transition-all"
              title="Remove connection"
            >
              <X className="h-2.5 w-2.5 text-red-500" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(AIConnectionEdge);
