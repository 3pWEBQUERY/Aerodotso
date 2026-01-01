"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { FolderClosed } from "lucide-react";
import { AnimatedFolder } from "./animated-folder";

interface DroppableFolderProps {
  folderId: string;
  folderName: string;
  workspaceId: string;
  fileCount: number;
  previewFiles: Array<{ type: string; name: string; previewUrl?: string }>;
  onDrop: (folderId: string, itemId: string, itemType: string) => void;
  acceptTypes?: string[];
}

export function DroppableFolder({
  folderId,
  folderName,
  workspaceId,
  fileCount,
  previewFiles,
  onDrop,
  acceptTypes = ["document", "link", "note"],
}: DroppableFolderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const itemType = e.dataTransfer.types.includes("application/item-type");
    if (itemType) {
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const itemId = e.dataTransfer.getData("application/item-id");
    const itemType = e.dataTransfer.getData("application/item-type");
    
    if (itemId && itemType && acceptTypes.includes(itemType)) {
      onDrop(folderId, itemId, itemType);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-44 cursor-pointer block group"
    >
      <Link href={`/workspace/${workspaceId}/folder/${folderId}`}>
        <div 
          className={`h-56 rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 border overflow-hidden transition-all duration-200 ${
            isDragOver 
              ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 scale-105" 
              : "border-amber-200/50"
          }`}
        >
          <AnimatedFolder 
            name={folderName} 
            fileCount={fileCount} 
            previewFiles={previewFiles} 
          />
        </div>
        <p className={`text-[10px] truncate flex items-center gap-1 mt-2 transition-colors ${
          isDragOver ? "text-[var(--accent-primary-light)]" : "text-muted-foreground group-hover:text-amber-600"
        }`}>
          <FolderClosed className={`h-3 w-3 ${isDragOver ? "text-[var(--accent-primary-light)]" : "text-amber-500"}`} />
          {isDragOver ? "Drop here" : folderName}
        </p>
      </Link>
    </div>
  );
}
