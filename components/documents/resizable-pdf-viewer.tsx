"use client";

import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { PdfViewer } from "./pdf-viewer";

interface ResizablePdfViewerProps {
  url: string;
  title?: string;
  onDoubleClick?: () => void;
  className?: string;
}

export function ResizablePdfViewer({
  url,
  title = "PDF",
  onDoubleClick,
  className = "",
}: ResizablePdfViewerProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [customSize, setCustomSize] = useState<{ width: number; height: number }>({ 
    width: 900, 
    height: 700 
  });

  // Resize handler
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    
    const currentWidth = customSize.width;
    const currentHeight = customSize.height;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Allow independent width/height resize for PDF viewer
      const newWidth = Math.max(400, currentWidth + deltaX);
      const newHeight = Math.max(300, currentHeight + deltaY);
      
      setCustomSize({ width: newWidth, height: newHeight });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }, [customSize]);

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovering(false);
      }}
      onDoubleClick={onDoubleClick}
    >
      <div 
        className="rounded-lg border shadow-lg bg-white pointer-events-auto overflow-hidden"
        style={{ width: customSize.width, height: customSize.height }}
      >
        <PdfViewer url={url} title={title} />
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        onPointerDown={handleResizeStart}
        className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize transition-opacity flex items-center justify-center ${isHovering || isResizing ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 50, touchAction: "none" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-gray-600 drop-shadow-md">
          <path d="M10 6L6 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
