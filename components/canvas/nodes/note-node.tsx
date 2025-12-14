"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NoteNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  StickyNote, 
  Trash2, 
  Copy, 
  Palette,
  MoreHorizontal 
} from "lucide-react";

const COLORS = [
  { bg: "bg-yellow-50", border: "border-yellow-200", name: "Yellow" },
  { bg: "bg-blue-50", border: "border-blue-200", name: "Blue" },
  { bg: "bg-green-50", border: "border-green-200", name: "Green" },
  { bg: "bg-pink-50", border: "border-pink-200", name: "Pink" },
  { bg: "bg-purple-50", border: "border-purple-200", name: "Purple" },
  { bg: "bg-orange-50", border: "border-orange-200", name: "Orange" },
];

function NoteNode({ id, data, selected }: NodeProps<NoteNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [content, setContent] = useState(data.content || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { deleteNode, duplicateNode, updateNode } = useCanvasStore();

  const colorIndex = data.backgroundColor 
    ? COLORS.findIndex(c => c.bg.includes(data.backgroundColor!))
    : 0;
  const currentColor = COLORS[colorIndex >= 0 ? colorIndex : 0];

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (content !== data.content) {
      updateNode(id, { content });
    }
  };

  const handleColorChange = (colorBg: string) => {
    updateNode(id, { backgroundColor: colorBg.replace("bg-", "").replace("-50", "") });
    setShowColorPicker(false);
  };

  return (
    <div
      className={`
        relative rounded-xl border shadow-sm overflow-hidden
        transition-all duration-200 cursor-pointer
        ${currentColor.bg} ${currentColor.border}
        ${selected ? "ring-2 ring-emerald-500" : ""}
      `}
      style={{ width: 240, minHeight: 160 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowColorPicker(false);
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-gray-600">
            {data.label || "Note"}
          </span>
        </div>

        {/* Actions */}
        {isHovered && (
          <div className="flex items-center gap-0.5">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="p-1 hover:bg-black/5 rounded text-gray-400 hover:text-gray-600"
                title="Change color"
              >
                <Palette className="h-3 w-3" />
              </button>

              {/* Color Picker Dropdown */}
              {showColorPicker && (
                <div className="absolute top-full right-0 mt-1 p-2 bg-white rounded-lg shadow-lg border z-50 flex gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorChange(color.bg);
                      }}
                      className={`w-5 h-5 rounded-xl ${color.bg} ${color.border} border hover:scale-110 transition-transform`}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleDuplicate}
              className="p-1 hover:bg-black/5 rounded text-gray-400 hover:text-gray-600"
              title="Duplicate"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            className="w-full h-24 bg-transparent text-sm text-gray-700 resize-none outline-none"
            placeholder="Write your note..."
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
            {content || (
              <span className="text-gray-400 italic">Double-click to edit...</span>
            )}
          </p>
        )}
      </div>

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {data.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-black/5 text-[10px] text-gray-500 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(NoteNode);
