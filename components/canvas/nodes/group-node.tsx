"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps, NodeResizer } from "reactflow";
import { GroupNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  Folder, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Pencil
} from "lucide-react";

function GroupNode({ id, data, selected }: NodeProps<GroupNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || "Group");
  const { deleteNode, updateNode } = useCanvasStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNode(id, { isCollapsed: !data.isCollapsed });
  };

  const handleSaveLabel = () => {
    updateNode(id, { label: label.trim() || "Group" });
    setIsEditing(false);
  };

  const bgColor = data.backgroundColor || "gray";
  const borderColor = data.borderColor || "gray";

  // Default dimensions (stored in data as any)
  const width = (data as any).width || 300;
  const height = (data as any).height || 200;

  return (
    <div 
      style={{ width, height, minWidth: 200, minHeight: 150 }}
      className="relative"
    >
      {/* Resizer */}
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-emerald-500"
        handleClassName="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
      />

      <div
        className={`
          w-full h-full rounded-xl border-2 border-dashed
          transition-all duration-200
          ${selected ? "border-emerald-500" : "border-gray-300"}
        `}
        style={{
          backgroundColor: `rgba(156,163,175, 0.08)`,
          borderColor: selected ? "#10b981" : "rgba(156,163,175, 0.4)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
          style={{ top: 20 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
          style={{ top: 20 }}
        />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-gray-400" />
            
            {isEditing ? (
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
                className="px-1 py-0.5 text-sm font-medium bg-white border rounded outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            ) : (
              <span
                className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800"
                onDoubleClick={() => setIsEditing(true)}
              >
                {data.label || "Group"}
              </span>
            )}

            {/* Item count */}
            {data.childNodeIds && data.childNodeIds.length > 0 && (
              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[10px] rounded-xl">
                {data.childNodeIds.length}
              </span>
            )}
          </div>

          {/* Actions */}
          {isHovered && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-white/50 rounded text-gray-400 hover:text-gray-600"
                title="Rename"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleToggleCollapse}
                className="p-1 hover:bg-white/50 rounded text-gray-400 hover:text-gray-600"
                title={data.isCollapsed ? "Expand" : "Collapse"}
              >
                {data.isCollapsed ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                title="Delete group"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Content area - nodes inside will be rendered by React Flow */}
        <div className="absolute inset-0 top-10 pointer-events-none" />
      </div>
    </div>
  );
}

export default memo(GroupNode);
