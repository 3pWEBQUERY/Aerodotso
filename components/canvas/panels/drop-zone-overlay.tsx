"use client";

import { useState, useCallback } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import { Upload, Image as ImageIcon, Video, FileText, X } from "lucide-react";

interface DropZoneOverlayProps {
  onFilesDropped?: (files: File[]) => void;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/mov", "video/quicktime"];
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "text/plain", "text/markdown"];

export function DropZoneOverlay({ onFilesDropped }: DropZoneOverlayProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedFileType, setDraggedFileType] = useState<"image" | "video" | "document" | "mixed" | null>(null);
  const { addNode } = useCanvasStore();

  const getFileCategory = (type: string): "image" | "video" | "document" | null => {
    if (ACCEPTED_IMAGE_TYPES.includes(type)) return "image";
    if (ACCEPTED_VIDEO_TYPES.includes(type)) return "video";
    if (ACCEPTED_DOCUMENT_TYPES.includes(type)) return "document";
    return null;
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items = Array.from(e.dataTransfer.items);
    const fileItems = items.filter((item) => item.kind === "file");

    if (fileItems.length === 0) return;

    // Determine file type category
    const categories = new Set<string>();
    fileItems.forEach((item) => {
      const category = getFileCategory(item.type);
      if (category) categories.add(category);
    });

    if (categories.size === 1) {
      setDraggedFileType(Array.from(categories)[0] as "image" | "video" | "document");
    } else if (categories.size > 1) {
      setDraggedFileType("mixed");
    }

    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
      setDraggedFileType(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setDraggedFileType(null);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // Get drop position
      const dropX = e.clientX;
      const dropY = e.clientY;

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const category = getFileCategory(file.type);
        if (!category) continue;

        // Calculate position with offset for multiple files
        const position = {
          x: dropX + i * 50 - 100,
          y: dropY + i * 50 - 100,
        };

        // Create node based on file type
        if (category === "image") {
          const url = URL.createObjectURL(file);
          const img = new Image();
          
          img.onload = () => {
            addNode({
              id: `image-${Date.now()}-${i}`,
              type: "image",
              position,
              data: {
                type: "image",
                label: file.name,
                url,
                thumbnail: url,
                width: img.width,
                height: img.height,
                fileSize: file.size,
                mimeType: file.type,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: "",
              } as any,
            });
          };
          img.src = url;
        } else if (category === "video") {
          const url = URL.createObjectURL(file);
          addNode({
            id: `video-${Date.now()}-${i}`,
            type: "video",
            position,
            data: {
              type: "video",
              label: file.name,
              url,
              thumbnail: "",
              duration: 0,
              width: 1920,
              height: 1080,
              fileSize: file.size,
              mimeType: file.type,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: "",
            } as any,
          });
        } else if (category === "document") {
          const url = URL.createObjectURL(file);
          const fileType = file.name.split(".").pop() || "pdf";
          addNode({
            id: `document-${Date.now()}-${i}`,
            type: "document",
            position,
            data: {
              type: "document",
              label: file.name,
              url,
              fileType,
              fileSize: file.size,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: "",
            } as any,
          });
        }
      }

      if (onFilesDropped) {
        onFilesDropped(files);
      }
    },
    [addNode, onFilesDropped]
  );

  const getIcon = () => {
    switch (draggedFileType) {
      case "image":
        return <ImageIcon className="h-12 w-12" />;
      case "video":
        return <Video className="h-12 w-12" />;
      case "document":
        return <FileText className="h-12 w-12" />;
      default:
        return <Upload className="h-12 w-12" />;
    }
  };

  const getMessage = () => {
    switch (draggedFileType) {
      case "image":
        return "Drop to add image";
      case "video":
        return "Drop to add video";
      case "document":
        return "Drop to add document";
      case "mixed":
        return "Drop to add files";
      default:
        return "Drop files here";
    }
  };

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ pointerEvents: isDragOver ? "auto" : "none" }}
    >
      {isDragOver && (
        <div className="absolute inset-0 bg-[var(--accent-primary)]/100/10 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-2xl border-2 border-dashed border-[var(--accent-primary)]">
            <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary-light)]">
              {getIcon()}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">{getMessage()}</p>
              <p className="text-sm text-gray-500 mt-1">
                Images, videos, and documents supported
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DropZoneOverlay;
