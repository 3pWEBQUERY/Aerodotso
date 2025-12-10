"use client";

import { useState } from "react";
import { ImageIcon, Link2, Sparkles } from "lucide-react";

interface ImageWithConnectorProps {
  id: string;
  src: string;
  alt: string;
  isConnected: boolean;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  className?: string;
}

export function ImageWithConnector({
  id,
  src,
  alt,
  isConnected,
  onConnect,
  onDisconnect,
  className = "",
}: ImageWithConnectorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "square">("landscape");
  const [loaded, setLoaded] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalHeight > img.naturalWidth) {
      setOrientation("portrait");
    } else if (img.naturalWidth > img.naturalHeight) {
      setOrientation("landscape");
    } else {
      setOrientation("square");
    }
    setLoaded(true);
  };

  const handleConnectorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnected) {
      onDisconnect(id);
    } else {
      onConnect(id);
    }
  };

  // Fixed sizes based on orientation
  const sizeClasses = {
    portrait: "h-[400px] w-auto",
    landscape: "w-[500px] h-auto",
    square: "w-[350px] h-[350px]",
  };

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {!loaded && (
        <div className="w-[300px] h-[200px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-gray-300" />
        </div>
      )}
      
      {/* Image with green border when connected */}
      <div className={`relative rounded-xl overflow-hidden ${isConnected ? "ring-2 ring-emerald-500 ring-offset-2" : ""}`}>
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          className={`${sizeClasses[orientation]} object-contain rounded-xl shadow-lg ${!loaded ? "hidden" : ""}`}
        />
      </div>

      {/* Connection button on the right edge - always visible when hovering or connected */}
      {loaded && (
        <button
          type="button"
          onClick={handleConnectorClick}
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 ${
            isConnected
              ? "right-[-20px] w-10 h-10 bg-emerald-500 border-2 border-emerald-600 text-white rounded-full shadow-lg"
              : isHovering
              ? "right-[-16px] w-8 h-8 bg-white border-2 border-gray-300 text-gray-500 rounded-full shadow-md hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
              : "right-[-16px] w-8 h-8 bg-white border-2 border-gray-200 text-gray-300 rounded-full opacity-0 group-hover:opacity-100"
          }`}
          title={isConnected ? "Disconnect from AI" : "Connect to AI"}
        >
          {isConnected ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Connection status badge - top right corner */}
      {isConnected && loaded && (
        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
          <Sparkles className="h-3 w-3" />
          <span>Connected</span>
        </div>
      )}
    </div>
  );
}
