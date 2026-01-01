"use client";

import { useState, useCallback } from "react";
import { ImageIcon } from "lucide-react";
import { ConnectionPoints } from "./connection-points";

interface ImageWithConnectorProps {
  id: string;
  src: string;
  alt: string;
  isConnected: boolean;
  isSelected?: boolean;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onSelect?: (id: string) => void;
  onConnectionDragStart?: (side: "top" | "right" | "bottom" | "left", e: React.MouseEvent) => void;
  onConnectionPointClick?: (side: "top" | "right" | "bottom" | "left") => void;
  className?: string;
}

export function ImageWithConnector({
  id,
  src,
  alt,
  isConnected,
  isSelected = false,
  onConnect,
  onDisconnect,
  onSelect,
  onConnectionDragStart,
  onConnectionPointClick,
  className = "",
}: ImageWithConnectorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "square">("landscape");
  const [loaded, setLoaded] = useState(false);
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 500, height: 300 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    if (img.naturalHeight > img.naturalWidth) {
      setOrientation("portrait");
    } else if (img.naturalWidth > img.naturalHeight) {
      setOrientation("landscape");
    } else {
      setOrientation("square");
    }
    setLoaded(true);
  };

  const handleConnectorClick = (side: "top" | "right" | "bottom" | "left") => {
    // If a custom handler is provided (e.g., element-to-element linking), delegate to it
    if (onConnectionPointClick) {
      onConnectionPointClick(side);
      return;
    }
    // Fallback to previous AI connect/disconnect behavior
    if (isConnected) onDisconnect(id);
    else onConnect(id);
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
    const currentWidth = customSize?.width || (orientation === "portrait" ? 300 : orientation === "square" ? 350 : 500);
    const currentHeight = customSize?.height || (orientation === "portrait" ? 400 : orientation === "square" ? 350 : 300);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
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
  }, [customSize, orientation, naturalSize]);

  // Get size style
  const getSizeStyle = () => {
    if (customSize) {
      return { width: customSize.width, height: customSize.height };
    }
    // Default sizes based on orientation
    if (orientation === "portrait") return { height: 400 };
    if (orientation === "square") return { width: 350, height: 350 };
    return { width: 500 };
  };

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovering(false);
      }}
    >
      {!loaded && (
        <div className="w-[300px] h-[200px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-gray-300" />
        </div>
      )}
      
      {/* Image with green border when connected */}
      <div className={`relative rounded-xl overflow-hidden ${isConnected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""}`}>
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          style={getSizeStyle()}
          className={`object-contain rounded-xl shadow-lg ${!loaded ? "hidden" : ""}`}
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

      {/* Connection points - only visible when selected */}
      {loaded && (
        <ConnectionPoints
          isSelected={isSelected || isConnected}
          onPointClick={(side) => handleConnectorClick(side)}
          onDragStart={onConnectionDragStart}
          spacing={12}
        />
      )}
    </div>
  );
}
