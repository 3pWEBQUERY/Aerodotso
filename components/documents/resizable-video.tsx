"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Film } from "lucide-react";

interface ResizableVideoProps {
  src: string;
  title?: string;
  onDoubleClick?: () => void;
  className?: string;
}

export function ResizableVideo({
  src,
  title = "Video",
  onDoubleClick,
  className = "",
}: ResizableVideoProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 640, height: 360 });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get video dimensions when metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setNaturalSize({ width: video.videoWidth, height: video.videoHeight });
      setLoaded(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  // Resize handler
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsResizing(true);
    const startX = e.clientX;
    
    // Get current size
    const currentWidth = customSize?.width || 640;
    const currentHeight = customSize?.height || 360;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      
      // Keep aspect ratio
      const aspectRatio = naturalSize.width / naturalSize.height;
      const newWidth = Math.max(200, currentWidth + deltaX);
      const newHeight = Math.round(newWidth / aspectRatio);
      
      setCustomSize({ width: newWidth, height: Math.max(120, newHeight) });
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
    return { width: 640 };
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
        <div className="w-[640px] h-[360px] bg-gray-900 rounded-lg animate-pulse flex items-center justify-center">
          <Film className="h-12 w-12 text-gray-600" />
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        onDoubleClick={onDoubleClick}
        style={getSizeStyle()}
        className={`rounded-lg border shadow-lg bg-black pointer-events-auto ${!loaded ? "hidden" : ""}`}
      />

      {/* Resize handle - bottom right corner */}
      {loaded && (
        <div
          onPointerDown={handleResizeStart}
          className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize transition-opacity flex items-center justify-center ${isHovering || isResizing ? 'opacity-100' : 'opacity-0'}`}
          style={{ zIndex: 50, touchAction: "none" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-white drop-shadow-md">
            <path d="M10 6L6 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
