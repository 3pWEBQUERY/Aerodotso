"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import { applySmartLayout, suggestBestLayout } from "@/lib/canvas/layout-engine";
import { LayoutStyle } from "@/lib/canvas/types";
import {
  Search,
  Image as ImageIcon,
  Video,
  FileText,
  StickyNote,
  MessageSquare,
  Wand2,
  Link2,
  Folder,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Clipboard,
  Layout,
  Grid3X3,
  Circle,
  GitBranch,
  Clock,
  Layers,
  Download,
  Upload,
  Settings,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  shortcut?: string;
  category: "add" | "edit" | "layout" | "view" | "file";
  action: () => void;
  disabled?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImage?: (position: { x: number; y: number }) => void;
}

export function CommandPalette({ isOpen, onClose, onAddImage }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    addNode,
    nodes,
    selectedNodeIds,
    undo,
    redo,
    canUndo,
    canRedo,
    copyNodes,
    pasteNodes,
    deleteNodes,
    clearCanvas,
    selectAll,
  } = useCanvasStore();

  // Generate unique ID
  const genId = (type: string) => `${type}-${Date.now()}`;

  // Create new node at center
  const addNodeAtCenter = (type: string, additionalData = {}) => {
    const newNode = {
      id: genId(type),
      type,
      position: { x: 400 + Math.random() * 100, y: 300 + Math.random() * 100 },
      data: {
        type,
        label: `New ${type.replace("-", " ")}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "",
        ...additionalData,
      } as any,
    };
    addNode(newNode);
    onClose();
  };

  const addImageAtCenter = () => {
    const position = { x: 400 + Math.random() * 100, y: 300 + Math.random() * 100 };
    if (onAddImage) {
      onAddImage(position);
      onClose();
      return;
    }
    addNodeAtCenter("image", { url: "", width: 0, height: 0 });
  };

  // Apply layout
  const applyLayout = (style: LayoutStyle) => {
    const { loadCanvas } = useCanvasStore.getState();
    const layoutedNodes = applySmartLayout(nodes, {
      style,
      spacing: 50,
      padding: 100,
      animate: true,
    });
    loadCanvas({ nodes: layoutedNodes });
    onClose();
  };

  const commands: Command[] = useMemo(() => [
    // Add nodes
    {
      id: "add-note",
      label: "Add Note",
      description: "Create a new sticky note",
      icon: StickyNote,
      category: "add",
      action: () => addNodeAtCenter("note", { content: "", backgroundColor: "yellow" }),
    },
    {
      id: "add-image",
      label: "Add Image",
      description: "Add an image from workspace media",
      icon: ImageIcon,
      category: "add",
      action: () => addImageAtCenter(),
    },
    {
      id: "add-ai-chat",
      label: "Add AI Chat",
      description: "Create an AI chat node",
      icon: MessageSquare,
      category: "add",
      action: () => addNodeAtCenter("ai-chat", {
        model: "claude-sonnet-4",
        conversation: [],
        connectedAssetIds: [],
        isExpanded: true,
      }),
    },
    {
      id: "add-ai-generator",
      label: "Add AI Generator",
      description: "Create an image generator node",
      icon: Wand2,
      category: "add",
      action: () => addNodeAtCenter("ai-generator", {
        provider: "flux-pro",
        prompt: "",
        referenceImageIds: [],
        parameters: { aspectRatio: "1:1", quality: "standard" },
        generationHistory: [],
        status: "idle",
      }),
    },
    {
      id: "add-url",
      label: "Add URL",
      description: "Add a link node",
      icon: Link2,
      category: "add",
      action: () => addNodeAtCenter("url", { url: "" }),
    },
    {
      id: "add-folder",
      label: "Add Folder",
      description: "Create a folder node",
      icon: Folder,
      category: "add",
      action: () => addNodeAtCenter("folder", { childNodeIds: [], width: 200, height: 240, description: "" }),
    },

    // Edit commands
    {
      id: "undo",
      label: "Undo",
      icon: Undo2,
      shortcut: "⌘Z",
      category: "edit",
      action: () => { undo(); onClose(); },
      disabled: !canUndo(),
    },
    {
      id: "redo",
      label: "Redo",
      icon: Redo2,
      shortcut: "⌘⇧Z",
      category: "edit",
      action: () => { redo(); onClose(); },
      disabled: !canRedo(),
    },
    {
      id: "copy",
      label: "Copy Selection",
      icon: Copy,
      shortcut: "⌘C",
      category: "edit",
      action: () => { copyNodes(selectedNodeIds); onClose(); },
      disabled: selectedNodeIds.length === 0,
    },
    {
      id: "paste",
      label: "Paste",
      icon: Clipboard,
      shortcut: "⌘V",
      category: "edit",
      action: () => { pasteNodes(); onClose(); },
    },
    {
      id: "delete",
      label: "Delete Selection",
      icon: Trash2,
      shortcut: "⌫",
      category: "edit",
      action: () => { deleteNodes(selectedNodeIds); onClose(); },
      disabled: selectedNodeIds.length === 0,
    },
    {
      id: "select-all",
      label: "Select All",
      icon: Layers,
      shortcut: "⌘A",
      category: "edit",
      action: () => { selectAll(); onClose(); },
    },

    // Layout commands
    {
      id: "layout-grid",
      label: "Grid Layout",
      description: "Arrange nodes in a grid",
      icon: Grid3X3,
      category: "layout",
      action: () => applyLayout(LayoutStyle.GRID),
    },
    {
      id: "layout-radial",
      label: "Radial Layout",
      description: "Arrange nodes in a circle",
      icon: Circle,
      category: "layout",
      action: () => applyLayout(LayoutStyle.RADIAL),
    },
    {
      id: "layout-timeline",
      label: "Timeline Layout",
      description: "Arrange by creation date",
      icon: Clock,
      category: "layout",
      action: () => applyLayout(LayoutStyle.TIMELINE),
    },
    {
      id: "layout-storyboard",
      label: "Storyboard Layout",
      description: "4-column storyboard style",
      icon: Layout,
      category: "layout",
      action: () => applyLayout(LayoutStyle.STORYBOARD),
    },
    {
      id: "layout-cluster",
      label: "Cluster Layout",
      description: "Group by node type",
      icon: GitBranch,
      category: "layout",
      action: () => applyLayout(LayoutStyle.CLUSTER),
    },
    {
      id: "layout-auto",
      label: "Auto Layout",
      description: "AI suggests best layout",
      icon: Sparkles,
      category: "layout",
      action: () => {
        const suggested = suggestBestLayout(nodes);
        applyLayout(suggested);
      },
    },

    // File commands
    {
      id: "clear-canvas",
      label: "Clear Canvas",
      description: "Remove all nodes",
      icon: Trash2,
      category: "file",
      action: () => {
        if (confirm("Are you sure you want to clear the canvas?")) {
          clearCanvas();
          onClose();
        }
      },
    },
  ], [nodes, selectedNodeIds, canUndo, canRedo]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const lower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.description?.toLowerCase().includes(lower) ||
        cmd.category.includes(lower)
    );
  }, [commands, search]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      add: [],
      edit: [],
      layout: [],
      view: [],
      file: [],
    };
    filteredCommands.forEach((cmd) => {
      groups[cmd.category]?.push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd && !cmd.disabled) {
          cmd.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    add: "Add Nodes",
    edit: "Edit",
    layout: "Layout",
    view: "View",
    file: "File",
  };

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search */}
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
            placeholder="Type a command or search..."
            className="flex-1 text-sm outline-none"
          />
          <kbd className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => {
            if (cmds.length === 0) return null;

            return (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                  {categoryLabels[category]}
                </div>
                {cmds.map((cmd) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  const Icon = cmd.icon;

                  return (
                    <button
                      key={cmd.id}
                      data-index={currentIndex}
                      type="button"
                      onClick={() => !cmd.disabled && cmd.action()}
                      disabled={cmd.disabled}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected ? "bg-[var(--accent-primary)]/10" : "hover:bg-gray-50"
                      } ${cmd.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? "text-[var(--accent-primary-light)]" : "text-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isSelected ? "text-[var(--accent-primary)] font-medium" : "text-gray-700"}`}>
                          {cmd.label}
                        </p>
                        {cmd.description && (
                          <p className="text-xs text-gray-400 truncate">
                            {cmd.description}
                          </p>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No commands found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
