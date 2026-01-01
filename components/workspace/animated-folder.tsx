"use client";

import { useState } from "react";
import { FolderOpen, ImageIcon, FileText, File } from "lucide-react";

interface PreviewFile {
  type: string;
  name: string;
  previewUrl?: string;
}

interface AnimatedFolderProps {
  name: string;
  fileCount?: number;
  previewFiles?: PreviewFile[];
}

export function AnimatedFolder({ name, fileCount = 0, previewFiles = [] }: AnimatedFolderProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Take first 3 files for preview
  const previews = previewFiles.slice(0, 3);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-3 w-3" />;
    if (type === "application/pdf") return <FileText className="h-3 w-3" />;
    return <File className="h-3 w-3" />;
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Files peeking out */}
      <div className="absolute inset-0 flex items-center justify-center">
        {previews.map((file, index) => (
          <div
            key={index}
            className={`absolute bg-white rounded-lg shadow-md border overflow-hidden transition-all duration-300 ease-out ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: "60px",
              height: "44px",
              transform: isHovered
                ? `translateY(${-50 - index * 12}px) rotate(${(index - 1) * 8}deg) scale(1)`
                : `translateY(0px) rotate(0deg) scale(0.8)`,
              transitionDelay: `${index * 50}ms`,
              zIndex: 3 - index,
            }}
          >
            {file.type.startsWith("image/") && file.previewUrl ? (
              <img 
                src={file.previewUrl} 
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {getFileIcon(file.type)}
              </div>
            )}
          </div>
        ))}
        
        {/* Empty state files */}
        {previews.length === 0 && (
          <>
            <div
              className={`absolute bg-white rounded-lg shadow-md border flex items-center justify-center transition-all duration-300 ease-out ${
                isHovered ? "opacity-60" : "opacity-0"
              }`}
              style={{
                width: "60px",
                height: "44px",
                transform: isHovered
                  ? "translateY(-50px) rotate(-8deg)"
                  : "translateY(0px) rotate(0deg) scale(0.8)",
              }}
            >
              <File className="h-3 w-3 text-gray-300" />
            </div>
            <div
              className={`absolute bg-white rounded-lg shadow-md border flex items-center justify-center transition-all duration-300 ease-out ${
                isHovered ? "opacity-60" : "opacity-0"
              }`}
              style={{
                width: "60px",
                height: "44px",
                transform: isHovered
                  ? "translateY(-62px) rotate(0deg)"
                  : "translateY(0px) rotate(0deg) scale(0.8)",
                transitionDelay: "50ms",
              }}
            >
              <ImageIcon className="h-3 w-3 text-gray-300" />
            </div>
            <div
              className={`absolute bg-white rounded-lg shadow-md border flex items-center justify-center transition-all duration-300 ease-out ${
                isHovered ? "opacity-60" : "opacity-0"
              }`}
              style={{
                width: "60px",
                height: "44px",
                transform: isHovered
                  ? "translateY(-74px) rotate(8deg)"
                  : "translateY(0px) rotate(0deg) scale(0.8)",
                transitionDelay: "100ms",
              }}
            >
              <FileText className="h-3 w-3 text-gray-300" />
            </div>
          </>
        )}
      </div>

      {/* Folder */}
      <div className="relative z-10 transition-transform duration-300 ease-out"
        style={{ transform: isHovered ? "translateY(10px)" : "translateY(0)" }}
      >
        {/* Folder back */}
        <svg
          viewBox="0 0 80 60"
          className="w-24 h-18 drop-shadow-md"
          style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
        >
          {/* Back of folder */}
          <path
            d="M4 12 L4 52 Q4 56 8 56 L72 56 Q76 56 76 52 L76 12 Q76 8 72 8 L32 8 L28 4 Q26 2 24 2 L8 2 Q4 2 4 6 Z"
            fill="#f59e0b"
            className="transition-all duration-300"
          />
          
          {/* Front flap - animated */}
          <path
            d={isHovered 
              ? "M2 24 L2 52 Q2 58 8 58 L72 58 Q78 58 78 52 L78 24 Q78 20 74 20 L6 20 Q2 20 2 24 Z"
              : "M2 16 L2 52 Q2 58 8 58 L72 58 Q78 58 78 52 L78 16 Q78 12 74 12 L6 12 Q2 12 2 16 Z"
            }
            fill="#fbbf24"
            className="transition-all duration-300"
          />
          
          {/* Tab highlight */}
          <path
            d="M8 2 L24 2 Q26 2 28 4 L32 8 L8 8 Q4 8 4 6 L4 6 Q4 2 8 2 Z"
            fill="#fcd34d"
          />
        </svg>

        {/* File count badge */}
        {fileCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-[var(--accent-primary)]/100 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
            {fileCount > 99 ? "99+" : fileCount}
          </div>
        )}
      </div>
    </div>
  );
}
