"use client";

import { useState, useCallback } from "react";

interface ResizableGeneratedImageProps {
  id: string;
  url: string;
  title: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function ResizableGeneratedImage({
  id,
  url,
  title,
  onContextMenu,
}: ResizableGeneratedImageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 300, height: 300 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setLoaded(true);
  };

  // Resize handler
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Get current size
    const currentWidth = customSize?.width || 300;
    const currentHeight = customSize?.height || (naturalSize.height / naturalSize.width) * 300;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      
      // Keep aspect ratio
      const aspectRatio = naturalSize.width / naturalSize.height;
      const newWidth = Math.max(150, currentWidth + deltaX);
      const newHeight = Math.round(newWidth / aspectRatio);
      
      setCustomSize({ width: newWidth, height: Math.max(100, newHeight) });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }, [customSize, naturalSize]);

  // Get size style
  const getSizeStyle = () => {
    if (customSize) {
      return { width: customSize.width, height: customSize.height };
    }
    return { width: 300 };
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovering(false);
      }}
      onContextMenu={onContextMenu}
    >
      {/* Image */}
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={url}
          alt={title}
          onLoad={handleImageLoad}
          style={getSizeStyle()}
          className="object-contain rounded-xl shadow-lg"
        />
      </div>
      
      {/* Resize handle - bottom right corner */}
      {loaded && (
        <div
          onPointerDown={handleResizeStart}
          className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize transition-opacity flex items-center justify-center ${isHovering || isResizing ? 'opacity-100' : 'opacity-0'}`}
          style={{ zIndex: 50, touchAction: "none" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-gray-500 drop-shadow-md">
            <path d="M10 6L6 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
