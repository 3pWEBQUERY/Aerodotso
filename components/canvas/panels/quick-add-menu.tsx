"use client";

import { useState } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import {
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  StickyNote,
  MessageSquare,
  Wand2,
  Link2,
  Folder,
  Upload,
  X,
} from "lucide-react";

const QUICK_ADD_OPTIONS = [
  { type: "note", label: "Note", icon: StickyNote, color: "bg-amber-100 text-amber-600" },
  { type: "ai-chat", label: "AI Chat", icon: MessageSquare, color: "bg-violet-100 text-violet-600" },
  { type: "ai-generator", label: "Generator", icon: Wand2, color: "bg-emerald-100 text-emerald-600" },
  { type: "image", label: "Image", icon: ImageIcon, color: "bg-blue-100 text-blue-600" },
  { type: "document", label: "Document", icon: FileText, color: "bg-orange-100 text-orange-600" },
  { type: "url", label: "URL", icon: Link2, color: "bg-indigo-100 text-indigo-600" },
];

interface QuickAddMenuProps {
  centerPosition?: { x: number; y: number };
}

export function QuickAddMenu({ centerPosition }: QuickAddMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { addNode } = useCanvasStore();

  const handleAddNode = (type: string) => {
    const position = centerPosition || { x: 400 + Math.random() * 100, y: 300 + Math.random() * 100 };

    const defaultData: Record<string, any> = {
      note: { content: "", backgroundColor: "yellow" },
      "ai-chat": {
        model: "claude-sonnet-4",
        conversation: [],
        connectedAssetIds: [],
        isExpanded: true,
      },
      "ai-generator": {
        provider: "flux-pro",
        prompt: "",
        referenceImageIds: [],
        parameters: { aspectRatio: "1:1", quality: "standard" },
        generationHistory: [],
        status: "idle",
      },
      image: { url: "", width: 0, height: 0 },
      document: { url: "", fileType: "pdf" },
      url: { url: "" },
      group: { childNodeIds: [], width: 300, height: 200 },
    };

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        type,
        label: `New ${type.replace("-", " ")}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "",
        ...defaultData[type],
      } as any,
    };

    addNode(newNode);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      {/* Expanded Options */}
      {isExpanded && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-xl border">
            {QUICK_ADD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleAddNode(option.type)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl ${option.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] text-gray-600 font-medium">
                    {option.label}
                  </span>
                </button>
              );
            })}

            {/* Upload option */}
            <div className="w-px h-12 bg-gray-200 mx-1" />
            <button
              type="button"
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center transition-transform group-hover:scale-110">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium">
                Upload
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all
          ${isExpanded 
            ? "bg-gray-100 text-gray-700 border-gray-200" 
            : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
          }
        `}
      >
        {isExpanded ? (
          <>
            <X className="h-5 w-5" />
            <span className="font-medium text-sm">Close</span>
          </>
        ) : (
          <>
            <Plus className="h-5 w-5" />
            <span className="font-medium text-sm">Add to Canvas</span>
          </>
        )}
      </button>
    </div>
  );
}

export default QuickAddMenu;
