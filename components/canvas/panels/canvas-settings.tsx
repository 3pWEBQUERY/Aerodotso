"use client";

import { useCanvasStore } from "@/lib/canvas/store";
import {
  Settings,
  X,
  Grid3X3,
  Magnet,
  Map,
  Palette,
  Download,
  Upload,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { downloadCanvasAsJSON, importCanvasFromFile } from "@/lib/canvas/export-import";

interface CanvasSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CanvasSettings({ isOpen, onClose }: CanvasSettingsProps) {
  const { nodes, edges, metadata, clearCanvas, loadCanvas, settings: storeSettings, updateSettings } = useCanvasStore();

  // Settings with defaults
  const settings = {
    showGrid: storeSettings?.showGrid ?? true,
    snapToGrid: storeSettings?.snapToGrid ?? true,
    gridSize: storeSettings?.gridSize ?? 16,
    showMinimap: storeSettings?.showMinimap ?? true,
    backgroundColor: storeSettings?.backgroundColor ?? '#f9fafb',
  };

  const handleExport = () => {
    downloadCanvasAsJSON(nodes, edges, metadata);
  };

  const handleImport = async () => {
    const imported = await importCanvasFromFile();
    if (imported) {
      loadCanvas({
        nodes: imported.canvas.nodes,
        edges: imported.canvas.edges,
      });
      onClose();
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the canvas? This cannot be undone.")) {
      clearCanvas();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 bottom-20 w-72 bg-white rounded-xl shadow-xl border overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm">Canvas Settings</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Grid Settings */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">
            Grid
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Show Grid</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => updateSettings({ showGrid: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Magnet className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Snap to Grid</span>
              </div>
              <input
                type="checkbox"
                checked={settings.snapToGrid}
                onChange={(e) => updateSettings({ snapToGrid: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Grid Size</span>
              <select
                value={settings.gridSize}
                onChange={(e) => updateSettings({ gridSize: Number(e.target.value) })}
                className="text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={8}>8px</option>
                <option value={16}>16px</option>
                <option value={24}>24px</option>
                <option value={32}>32px</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Settings */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">
            View
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Show Minimap</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showMinimap}
                onChange={(e) => updateSettings({ showMinimap: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Background</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  className="w-6 h-6 rounded border cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => updateSettings({ backgroundColor: "#f9fafb" })}
                  className="p-1 hover:bg-gray-100 rounded text-xs text-gray-500"
                  title="Reset"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">
            Data
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleExport}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Canvas
            </button>

            <button
              type="button"
              onClick={handleImport}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import Canvas
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear Canvas
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-800">{nodes.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Nodes</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-800">{edges.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Connections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CanvasSettings;
