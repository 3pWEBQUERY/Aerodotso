"use client";

interface ConnectionPointsProps {
  isSelected: boolean;
  onPointClick?: (side: "top" | "right" | "bottom" | "left") => void;
  onDragStart?: (side: "top" | "right" | "bottom" | "left", e: React.MouseEvent) => void;
  spacing?: number;
}

export function ConnectionPoints({
  isSelected,
  onPointClick,
  onDragStart,
  spacing = 12,
}: ConnectionPointsProps) {
  if (!isSelected) return null;

  const handleMouseDown = (e: React.MouseEvent, side: "top" | "right" | "bottom" | "left") => {
    // Stop propagation to prevent parent DraggableElement from dragging
    e.stopPropagation();
    e.preventDefault();
    // Start drag connection
    onDragStart?.(side, e);
  };

  const handleClick = (e: React.MouseEvent, side: "top" | "right" | "bottom" | "left") => {
    e.stopPropagation();
    e.preventDefault();
    onPointClick?.(side);
  };

  const pointStyle = "w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]/100 border border-[var(--accent-primary)] cursor-pointer hover:scale-125 transition-transform z-50";

  return (
    <>
      {/* Top connection point */}
      <div
        onMouseDown={(e) => handleMouseDown(e, "top")}
        onClick={(e) => handleClick(e, "top")}
        data-connection-side="top"
        className={pointStyle}
        style={{
          position: "absolute",
          top: -spacing,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      
      {/* Right connection point */}
      <div
        onMouseDown={(e) => handleMouseDown(e, "right")}
        onClick={(e) => handleClick(e, "right")}
        data-connection-side="right"
        className={pointStyle}
        style={{
          position: "absolute",
          right: -spacing,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      
      {/* Bottom connection point */}
      <div
        onMouseDown={(e) => handleMouseDown(e, "bottom")}
        onClick={(e) => handleClick(e, "bottom")}
        data-connection-side="bottom"
        className={pointStyle}
        style={{
          position: "absolute",
          bottom: -spacing,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      
      {/* Left connection point */}
      <div
        onMouseDown={(e) => handleMouseDown(e, "left")}
        onClick={(e) => handleClick(e, "left")}
        data-connection-side="left"
        className={pointStyle}
        style={{
          position: "absolute",
          left: -spacing,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
    </>
  );
}
