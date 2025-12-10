"use client";

import { useCallback, useEffect, useState } from "react";
import { useReactFlow, useViewport } from "reactflow";
import { Minus, Plus, Maximize2, Settings } from "lucide-react";

interface IntegratedZoomControlsProps {
  onOpenSettings?: () => void;
}

export function IntegratedZoomControls({ onOpenSettings }: IntegratedZoomControlsProps) {
  const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();
  const viewport = useViewport();
  const [zoomLevel, setZoomLevel] = useState(100);

  // Update zoom level when viewport changes
  useEffect(() => {
    setZoomLevel(Math.round(viewport.zoom * 100));
  }, [viewport.zoom]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleZoomReset = useCallback(() => {
    const currentViewport = getViewport();
    setViewport({ ...currentViewport, zoom: 1 }, { duration: 200 });
  }, [getViewport, setViewport]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-xl shadow-lg border">
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
          title="Zoom out (⌘-)"
        >
          <Minus className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={handleZoomReset}
          className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors min-w-[50px]"
          title="Reset zoom to 100%"
        >
          {zoomLevel}%
        </button>
        
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
          title="Zoom in (⌘+)"
        >
          <Plus className="h-4 w-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-200 mx-1" />
        
        <button
          type="button"
          onClick={handleFitView}
          className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
          title="Fit to screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
            title="Settings (⌘,)"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default IntegratedZoomControls;
