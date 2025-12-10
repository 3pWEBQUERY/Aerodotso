"use client";

import { MousePointer2, Circle, Plus, Flag, Sparkles, Type, Pencil, ArrowRight, Square } from "lucide-react";

interface CanvasToolbarProps {
  activeTool?: string;
  onToolChange?: (tool: string) => void;
}

export function CanvasToolbar({ activeTool = "select", onToolChange }: CanvasToolbarProps) {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "pan", icon: Circle, label: "Pan" },
    { id: "divider", type: "divider" },
    { id: "add", icon: Plus, label: "Add" },
    { id: "flag", icon: Flag, label: "Flag" },
    { id: "ai", icon: Sparkles, label: "AI" },
    { id: "text", icon: Type, label: "Text" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "arrow", icon: ArrowRight, label: "Arrow" },
    { id: "shape", icon: Square, label: "Shape" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-xl shadow-lg border">
        {tools.map((tool) => {
          if (tool.type === "divider") {
            return <div key={tool.id} className="w-px h-6 bg-gray-200 mx-1" />;
          }
          
          const Icon = tool.icon!;
          const isActive = activeTool === tool.id;
          
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onToolChange?.(tool.id)}
              className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
              title={tool.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
