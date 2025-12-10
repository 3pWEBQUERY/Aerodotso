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
}

export function DraggableElement({
  children,
  id,
  initialX = 0,
  initialY = 0,
  className = "",
  onBoundsChange,
}: DraggableElementProps) {
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  // Report bounds whenever position changes or on mount
  useEffect(() => {
    if (onBoundsChange && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      onBoundsChange(id, {
        x: position.x,
        y: position.y,
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
        onBoundsChange(id, {
          x: position.x,
          y: position.y,
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
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;
      
      setPosition({
        x: elementStartPos.current.x + deltaX,
        y: elementStartPos.current.y + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [position]);

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
      <div 
        className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-white border rounded-full px-3 py-1 shadow-md flex items-center gap-1.5 transition-opacity z-20 ${isDragging ? "opacity-100" : "opacity-0 hover:opacity-100"}`}
        style={{ pointerEvents: "none" }}
      >
        <Move className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs text-gray-600 font-medium">Drag to move</span>
      </div>
      {children}
    </div>
  );
}
