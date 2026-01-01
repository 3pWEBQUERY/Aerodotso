"use client";

import { useState } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import {
  History,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  Plus,
  Trash2,
  Move,
  Link2,
  X,
} from "lucide-react";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const {
    history,
    historyIndex,
    undo,
    redo,
    canUndo,
    canRedo,
    jumpToHistory,
  } = useCanvasStore();

  if (!isOpen) return null;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionIcon = (entry: typeof history[0]) => {
    const nodeCount = entry.nodes.length;
    const edgeCount = entry.edges.length;
    
    // Simple heuristic based on counts
    return <Clock className="h-3.5 w-3.5" />;
  };

  const getActionLabel = (entry: typeof history[0], index: number) => {
    if (index === 0) return "Initial state";
    
    const prevEntry = history[index - 1];
    const nodesDiff = entry.nodes.length - prevEntry.nodes.length;
    const edgesDiff = entry.edges.length - prevEntry.edges.length;
    
    if (nodesDiff > 0) return `Added ${nodesDiff} node${nodesDiff > 1 ? "s" : ""}`;
    if (nodesDiff < 0) return `Removed ${Math.abs(nodesDiff)} node${Math.abs(nodesDiff) > 1 ? "s" : ""}`;
    if (edgesDiff > 0) return `Added connection`;
    if (edgesDiff < 0) return `Removed connection`;
    
    return "Modified canvas";
  };

  return (
    <div className="absolute left-4 top-16 w-64 bg-white rounded-xl shadow-xl border overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm">History</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => undo()}
            disabled={!canUndo()}
            className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => redo()}
            disabled={!canRedo()}
            className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded ml-1"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="max-h-80 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No history yet
          </div>
        ) : (
          <div className="py-2">
            {history.map((entry, index) => {
              const isActive = index === historyIndex;
              const isFuture = index > historyIndex;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => jumpToHistory(index)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-left transition-colors
                    ${isActive ? "bg-[var(--accent-primary)]/10" : "hover:bg-gray-50"}
                    ${isFuture ? "opacity-50" : ""}
                  `}
                >
                  {/* Timeline indicator */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 ${
                        isActive
                          ? "bg-[var(--accent-primary)]/100 border-[var(--accent-primary)]"
                          : isFuture
                          ? "bg-white border-gray-300"
                          : "bg-gray-300 border-gray-300"
                      }`}
                    />
                    {index < history.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${
                          index >= historyIndex ? "bg-gray-200" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        isActive ? "text-[var(--accent-primary)] font-medium" : "text-gray-700"
                      }`}
                    >
                      {getActionLabel(entry, index)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {entry.nodes.length} nodes, {entry.edges.length} connections
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {formatTime(entry.timestamp)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>
            {historyIndex + 1} / {history.length} states
          </span>
          <span>
            Max: {50} states
          </span>
        </div>
      </div>
    </div>
  );
}

export default HistoryPanel;
