"use client";

import { useState, useRef, useCallback, ReactNode, useEffect } from "react";
import { Move } from "lucide-react";

export interface Position {
  x: number;
  y: number;
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableElementProps {
  children: ReactNode;
  id: string;
  initialX?: number;
  initialY?: number;
  className?: string;
  onBoundsChange?: (id: string, bounds: ElementBounds) => void;
  showDragIndicator?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const DRAG_THRESHOLD = 5; // Minimum pixels to move before drag starts

export function DraggableElement({
  children,
  id,
  initialX = 0,
  initialY = 0,
  className = "",
  onBoundsChange,
  showDragIndicator = true,
  isSelected = false,
  onSelect,
}: DraggableElementProps) {
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Report bounds whenever position changes or on mount
  useEffect(() => {
    if (onBoundsChange && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const parentRect = elementRef.current.parentElement?.getBoundingClientRect();
      const offsetX = parentRect?.left || 0;
      const offsetY = parentRect?.top || 0;
      onBoundsChange(id, {
        x: rect.left - offsetX,
        y: rect.top - offsetY,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [position, id, onBoundsChange]);

  // Also report on resize
  useEffect(() => {
    if (!elementRef.current || !onBoundsChange) return;
    
    const observer = new ResizeObserver(() => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const parentRect = elementRef.current.parentElement?.getBoundingClientRect();
        const offsetX = parentRect?.left || 0;
        const offsetY = parentRect?.top || 0;
        onBoundsChange(id, {
          x: rect.left - offsetX,
          y: rect.top - offsetY,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    
    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [id, position, onBoundsChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent drag when clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("a")
    ) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };
    hasDragged.current = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;
      
      // Check if we've moved past the threshold
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > DRAG_THRESHOLD) {
        hasDragged.current = true;
        setIsDragging(true);
        setPosition({
          x: elementStartPos.current.x + deltaX,
          y: elementStartPos.current.y + deltaY,
        });
      }
    };

    const handleMouseUp = () => {
      // If we didn't drag, treat it as a click (select)
      if (!hasDragged.current) {
        onSelect?.(id);
      }
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [position, id, onSelect]);

  return (
    <div
      ref={elementRef}
      data-draggable-id={id}
      className={`absolute cursor-grab active:cursor-grabbing select-none ${isDragging ? "z-50" : "z-10"} ${className}`}
      style={{
        left: position.x,
        top: position.y,
        transition: isDragging ? "none" : "box-shadow 0.2s",
        boxShadow: isDragging ? "0 10px 40px rgba(0,0,0,0.15)" : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag indicator - shows on hover */}
      {showDragIndicator && (
        <div 
          className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-white border rounded-full px-3 py-1 shadow-md flex items-center gap-1.5 transition-opacity z-20 ${isDragging ? "opacity-100" : "opacity-0 hover:opacity-100"}`}
          style={{ pointerEvents: "none" }}
        >
          <Move className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-600 font-medium">Drag to move</span>
        </div>
      )}
      {children}
    </div>
  );
}
