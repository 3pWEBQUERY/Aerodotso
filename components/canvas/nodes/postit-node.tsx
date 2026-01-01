"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, NodeProps } from "reactflow";
import { PostItNodeData, PostItCheckItem } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Plus,
  Check,
  Square,
  Highlighter,
  Type,
  CheckSquare,
  ArrowLeft,
  Home,
  Star,
  MoreHorizontal
} from "lucide-react";

const COLORS = {
  green: { bg: "bg-green-200", border: "border-green-300", text: "text-green-900" },
  yellow: { bg: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-900" },
  pink: { bg: "bg-pink-200", border: "border-pink-300", text: "text-pink-900" },
  blue: { bg: "bg-blue-200", border: "border-blue-300", text: "text-blue-900" },
  orange: { bg: "bg-orange-200", border: "border-orange-300", text: "text-orange-900" },
  purple: { bg: "bg-purple-200", border: "border-purple-300", text: "text-purple-900" },
};

const HIGHLIGHT_COLORS = [
  { id: "yellow", bg: "bg-yellow-300", label: "Yellow" },
  { id: "green", bg: "bg-green-300", label: "Green" },
  { id: "pink", bg: "bg-pink-300", label: "Pink" },
  { id: "blue", bg: "bg-blue-300", label: "Blue" },
];

function PostItNode({ id, data, selected }: NodeProps<PostItNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [fullscreenEditingItemId, setFullscreenEditingItemId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [showHighlightPicker, setShowHighlightPicker] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const { deleteNode, updateNode } = useCanvasStore();

  // Block keyboard events from reaching canvas when fullscreen editor is open
  // BUT allow typing in inputs
  useEffect(() => {
    if (!isEditorOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow typing in inputs - don't block those events
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        // Only stop Delete/Backspace from deleting nodes, but allow other keys for typing
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.stopPropagation();
        }
        return; // Let the input handle the event
      }
      // Block all other keyboard events from reaching canvas
      e.stopPropagation();
    };
    
    // Use capture phase to intercept before canvas handler
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isEditorOpen]);

  const color = COLORS[data.backgroundColor || "green"];
  const items = data.items || [];

  // Use custom size if set, otherwise default dimensions
  const nodeWidth = (data as any).nodeWidth || 180;
  const nodeHeight = (data as any).nodeHeight || 140;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Resize handler
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = nodeWidth;
    const startHeight = nodeHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(140, startWidth + deltaX);
      const newHeight = Math.max(100, startHeight + deltaY);
      updateNode(id, { nodeWidth: newWidth, nodeHeight: newHeight } as any);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }, [id, nodeWidth, nodeHeight, updateNode]);

  // Add text item
  const handleAddTextItem = useCallback(() => {
    const newItem: PostItCheckItem = {
      id: generateId(),
      text: "",
      checked: false,
      isCheckbox: false,
    };
    updateNode(id, { items: [...items, newItem] } as Partial<PostItNodeData>);
    setEditingItemId(newItem.id);
  }, [id, items, updateNode]);

  // Add checkbox item
  const handleAddCheckboxItem = useCallback(() => {
    const newItem: PostItCheckItem = {
      id: generateId(),
      text: "",
      checked: false,
      isCheckbox: true,
    };
    updateNode(id, { items: [...items, newItem] } as Partial<PostItNodeData>);
    setEditingItemId(newItem.id);
  }, [id, items, updateNode]);

  const handleUpdateItem = useCallback((itemId: string, updates: Partial<PostItCheckItem>) => {
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateNode(id, { items: updatedItems } as Partial<PostItNodeData>);
  }, [id, items, updateNode]);

  const handleDeleteItem = useCallback((itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    updateNode(id, { items: updatedItems } as Partial<PostItNodeData>);
  }, [id, items, updateNode]);

  const handleToggleCheck = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      handleUpdateItem(itemId, { checked: !item.checked });
    }
  }, [items, handleUpdateItem]);

  const handleToggleHighlight = useCallback((itemId: string, highlightColor?: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      if (item.highlighted && item.highlightColor === highlightColor) {
        handleUpdateItem(itemId, { highlighted: false, highlightColor: undefined });
      } else {
        handleUpdateItem(itemId, { highlighted: true, highlightColor: highlightColor || "yellow" });
      }
    }
    setShowHighlightPicker(null);
  }, [items, handleUpdateItem]);

  const handleColorChange = useCallback((newColor: PostItNodeData['backgroundColor']) => {
    updateNode(id, { backgroundColor: newColor } as Partial<PostItNodeData>);
  }, [id, updateNode]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  return (
    <div
      className="relative"
      style={{ width: nodeWidth, height: nodeHeight, zIndex: 1000 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovered(false);
        setShowHighlightPicker(null);
      }}
    >
      {/* Main PostIt card */}
      <div
        className={`
          w-full h-full rounded-lg shadow-md overflow-hidden
          transition-all duration-200 cursor-pointer
          ${color.bg} ${color.border} border
          ${selected ? "ring-2 ring-[var(--accent-primary)]" : ""}
        `}
        style={{ 
          boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
          transform: "rotate(-1deg)"
        }}
        onDoubleClick={() => setIsEditorOpen(true)}
      >
        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className={`!w-2 !h-2 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-left-3 !opacity-100' : '!opacity-0'}`}
          style={{ top: '50%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className={`!w-2 !h-2 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-right-3 !opacity-100' : '!opacity-0'}`}
          style={{ top: '50%' }}
        />

        {/* Content */}
        <div className="p-3">
          {/* Items list */}
          <div className="space-y-1.5">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="flex items-start gap-1.5 group"
              >
                {/* Checkbox - only show if isCheckbox */}
                {item.isCheckbox !== false && (
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(item.id)}
                    className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      item.checked 
                        ? "bg-gray-800 border-gray-800" 
                        : "border-gray-500 hover:border-gray-700"
                    }`}
                  >
                    {item.checked && <Check className="h-3 w-3 text-white" />}
                  </button>
                )}

                {/* Text */}
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                    onBlur={() => setEditingItemId(null)}
                    onKeyDown={(e) => {
                      e.stopPropagation(); // Prevent canvas keyboard shortcuts
                      if (e.key === "Enter") {
                        setEditingItemId(null);
                        if (item.text.trim()) {
                          item.isCheckbox ? handleAddCheckboxItem() : handleAddTextItem();
                        }
                      }
                      if (e.key === "Escape") setEditingItemId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    autoFocus
                    ref={(input) => input?.focus()}
                    className={`flex-1 text-xs bg-transparent outline-none ${color.text}`}
                    placeholder="Add text..."
                  />
                ) : (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItemId(item.id);
                    }}
                    className={`flex-1 text-xs cursor-text ${color.text} ${
                      item.checked ? "line-through opacity-60" : ""
                    } ${
                      item.highlighted 
                        ? `px-0.5 rounded ${
                            item.highlightColor === "green" ? "bg-green-300" :
                            item.highlightColor === "pink" ? "bg-pink-300" :
                            item.highlightColor === "blue" ? "bg-blue-300" :
                            "bg-yellow-300"
                          }`
                        : ""
                    }`}
                  >
                    {item.text || <span className="opacity-50 italic">Click to edit...</span>}
                  </span>
                )}

                {/* Item actions - visible on hover */}
                <div className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Highlight button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHighlightPicker(showHighlightPicker === item.id ? null : item.id);
                      }}
                      className={`p-0.5 rounded hover:bg-black/10 ${item.highlighted ? 'text-yellow-600' : 'text-gray-500'}`}
                      title="Highlight"
                    >
                      <Highlighter className="h-3 w-3" />
                    </button>
                    
                    {/* Highlight color picker */}
                    {showHighlightPicker === item.id && (
                      <div className="absolute top-full left-0 mt-1 p-1 bg-white rounded shadow-lg border z-50 flex gap-1">
                        {HIGHLIGHT_COLORS.map((hc) => (
                          <button
                            key={hc.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHighlight(item.id, hc.id);
                            }}
                            className={`w-4 h-4 rounded ${hc.bg} hover:scale-110 transition-transform`}
                            title={hc.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete item button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    className="p-0.5 rounded hover:bg-black/10 text-gray-500 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add item buttons */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTextItem}
              className={`flex items-center gap-1 text-xs ${color.text} opacity-60 hover:opacity-100 transition-opacity`}
              title="Add text"
            >
              <Type className="h-3 w-3" />
              <span>Text</span>
            </button>
            <button
              type="button"
              onClick={handleAddCheckboxItem}
              className={`flex items-center gap-1 text-xs ${color.text} opacity-60 hover:opacity-100 transition-opacity`}
              title="Add checkbox"
            >
              <CheckSquare className="h-3 w-3" />
              <span>Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        className={`absolute bottom-0 right-0 w-5 h-5 cursor-se-resize transition-opacity flex items-center justify-center nodrag nopan ${isHovered || isResizing || selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 50, touchAction: "none" }}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" className="text-gray-600">
          <path d="M10 6L6 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Color picker - visible on selection */}
      {selected && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm border">
          {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map((colorKey) => (
            <button
              key={colorKey}
              type="button"
              onClick={() => handleColorChange(colorKey)}
              className={`w-5 h-5 rounded-full ${COLORS[colorKey].bg} ${
                data.backgroundColor === colorKey ? "ring-2 ring-gray-800" : ""
              } hover:scale-110 transition-transform`}
              title={colorKey}
            />
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
            title="Delete PostIt"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Fullscreen Edit Modal with Framer Motion - Portal to body */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isEditorOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999]"
              onClick={() => {
                setIsEditorOpen(false);
                setFullscreenEditingItemId(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute inset-0 flex flex-col ${color.bg}`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                tabIndex={-1}
              >
                {/* Header */}
                <div className={`relative z-10 flex items-center justify-between px-6 py-3 border-b ${color.border}`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditorOpen(false);
                        setFullscreenEditingItemId(null);
                      }}
                      className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className={`h-4 w-4 ${color.text}`} />
                    </button>
                    
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`flex items-center gap-1 ${color.text} opacity-70`}>
                        <Home className="h-3.5 w-3.5" />
                        <span>Home</span>
                      </div>
                      <span className={`${color.text} opacity-50`}>/</span>
                      <div className={`flex items-center gap-1 ${color.text}`}>
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span className="font-medium">Post-it</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsStarred(!isStarred)}
                      className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                    >
                      <Star className={`h-4 w-4 ${isStarred ? "text-amber-500 fill-amber-500" : color.text} opacity-70`} />
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className={`h-4 w-4 ${color.text} opacity-70`} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-2xl mx-auto px-6 py-12">
                    {/* Color picker */}
                    <div className="mb-6 flex items-center gap-2">
                      <span className={`text-sm ${color.text} opacity-70`}>Color:</span>
                      {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map((colorKey) => (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => handleColorChange(colorKey)}
                          className={`w-6 h-6 rounded-full ${COLORS[colorKey].bg} ${
                            data.backgroundColor === colorKey ? "ring-2 ring-offset-2 ring-gray-800" : ""
                          } hover:scale-110 transition-transform`}
                          title={colorKey}
                        />
                      ))}
                    </div>

                    {/* Items list - larger in fullscreen */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-start gap-3 group"
                        >
                          {/* Checkbox - only show if isCheckbox */}
                          {item.isCheckbox !== false && (
                            <button
                              type="button"
                              onClick={() => handleToggleCheck(item.id)}
                              className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                item.checked 
                                  ? "bg-gray-800 border-gray-800" 
                                  : "border-gray-500 hover:border-gray-700"
                              }`}
                            >
                              {item.checked && <Check className="h-3.5 w-3.5 text-white" />}
                            </button>
                          )}

                          {/* Text */}
                          {fullscreenEditingItemId === item.id ? (
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                              onBlur={() => setFullscreenEditingItemId(null)}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === "Enter") {
                                  setFullscreenEditingItemId(null);
                                  if (item.text.trim()) {
                                    item.isCheckbox ? handleAddCheckboxItem() : handleAddTextItem();
                                  }
                                }
                                if (e.key === "Escape") setFullscreenEditingItemId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              autoFocus
                              className={`flex-1 text-lg bg-transparent outline-none border-b-2 border-gray-400 ${color.text}`}
                              placeholder="Type here..."
                            />
                          ) : (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setFullscreenEditingItemId(item.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              style={{ pointerEvents: 'auto' }}
                              className={`flex-1 text-lg cursor-text ${color.text} ${
                                item.checked ? "line-through opacity-60" : ""
                              } ${
                                item.highlighted 
                                  ? `px-1 rounded ${
                                      item.highlightColor === "green" ? "bg-green-300" :
                                      item.highlightColor === "pink" ? "bg-pink-300" :
                                      item.highlightColor === "blue" ? "bg-blue-300" :
                                      "bg-yellow-300"
                                    }`
                                  : ""
                              }`}
                            >
                              {item.text || <span className="opacity-50 italic">Click to edit...</span>}
                            </div>
                          )}

                          {/* Item actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Highlight picker */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowHighlightPicker(showHighlightPicker === item.id ? null : item.id)}
                                className={`p-1 rounded hover:bg-black/10 ${item.highlighted ? 'text-yellow-600' : color.text} opacity-70`}
                                title="Highlight"
                              >
                                <Highlighter className="h-4 w-4" />
                              </button>
                              
                              {showHighlightPicker === item.id && (
                                <div className="absolute top-full right-0 mt-1 p-1.5 bg-white rounded-lg shadow-lg border z-50 flex gap-1">
                                  {HIGHLIGHT_COLORS.map((hc) => (
                                    <button
                                      key={hc.id}
                                      type="button"
                                      onClick={() => handleToggleHighlight(item.id, hc.id)}
                                      className={`w-5 h-5 rounded ${hc.bg} hover:scale-110 transition-transform`}
                                      title={hc.label}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className={`p-1 rounded hover:bg-black/10 ${color.text} opacity-70 hover:text-red-500`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add item buttons - larger */}
                    <div className="mt-6 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleAddTextItem}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${color.text} opacity-70 hover:opacity-100 hover:bg-black/10 transition-all`}
                      >
                        <Type className="h-4 w-4" />
                        <span>Add Text</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCheckboxItem}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${color.text} opacity-70 hover:opacity-100 hover:bg-black/10 transition-all`}
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default memo(PostItNode);
