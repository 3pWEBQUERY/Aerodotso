"use client";

import { ReactNode, useRef } from "react";

interface DraggableItemProps {
  children: ReactNode;
  itemId: string;
  itemType: "document" | "link" | "note" | "scratch" | "canvas";
  className?: string;
}

export function DraggableItem({ children, itemId, itemType, className = "" }: DraggableItemProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/item-id", itemId);
    e.dataTransfer.setData("application/item-type", itemType);
    e.dataTransfer.effectAllowed = "move";
    
    // Create a clone of the element as drag image
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const clone = elementRef.current.cloneNode(true) as HTMLElement;
      
      // Style the clone
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.width = `${rect.width}px`;
      clone.style.opacity = "0.9";
      clone.style.transform = "rotate(3deg) scale(1.02)";
      clone.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
      clone.style.borderRadius = "12px";
      clone.style.pointerEvents = "none";
      
      document.body.appendChild(clone);
      
      // Set as drag image
      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
      
      // Remove clone after a short delay
      setTimeout(() => {
        document.body.removeChild(clone);
      }, 0);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset any visual changes
  };

  return (
    <div
      ref={elementRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
}
