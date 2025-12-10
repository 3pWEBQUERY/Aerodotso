// Hook for Canvas Zoom Controls
// Provides zoom functionality integrated with React Flow

import { useCallback, useState, useEffect } from "react";
import { useReactFlow, useViewport } from "reactflow";

export function useCanvasZoom() {
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

  const handleSetZoom = useCallback((zoom: number) => {
    const currentViewport = getViewport();
    setViewport({ ...currentViewport, zoom: zoom / 100 }, { duration: 200 });
  }, [getViewport, setViewport]);

  return {
    zoomLevel,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    zoomReset: handleZoomReset,
    fitView: handleFitView,
    setZoom: handleSetZoom,
  };
}

export default useCanvasZoom;
