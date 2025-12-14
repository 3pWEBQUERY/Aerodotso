"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import { Collaborator } from "@/lib/canvas/types";

// Cursor colors for different users
const CURSOR_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

function getCursorColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

interface CollaboratorCursorsProps {
  currentUserId: string;
}

export function CollaboratorCursors({ currentUserId }: CollaboratorCursorsProps) {
  const { collaborators } = useCanvasStore();
  const [localCursors, setLocalCursors] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Filter out current user
  const otherCollaborators = collaborators.filter((c) => c.userId !== currentUserId);

  // Animate cursor positions
  useEffect(() => {
    const newCursors = new Map<string, { x: number; y: number }>();
    
    otherCollaborators.forEach((collaborator) => {
      if (collaborator.cursor) {
        newCursors.set(collaborator.userId, collaborator.cursor);
      }
    });
    
    setLocalCursors(newCursors);
  }, [otherCollaborators]);

  if (otherCollaborators.length === 0) return null;

  return (
    <>
      {otherCollaborators.map((collaborator, index) => {
        const cursor = localCursors.get(collaborator.userId);
        if (!cursor) return null;

        const color = collaborator.color || getCursorColor(index);
        const initials = collaborator.userName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={collaborator.userId}
            className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            {/* Cursor SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            >
              <path
                d="M5.65376 12.4563L12.8168 20.6152C13.2645 21.1133 14.0748 20.8043 14.0748 20.1349V12.5765L20.4395 10.7869C20.9785 10.6353 21.1108 9.92553 20.6796 9.59357L6.27555 -1.00001C5.77281 -1.37881 5.04389 -0.930867 5.17892 -0.310814L7.16376 9.79424L5.65376 12.4563Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Name badge */}
            <div
              className="absolute left-4 top-4 flex items-center gap-1.5 px-2 py-1 rounded-xl text-white text-xs font-medium whitespace-nowrap shadow-lg"
              style={{ backgroundColor: color }}
            >
              {collaborator.userAvatar ? (
                <img
                  src={collaborator.userAvatar}
                  alt={collaborator.userName}
                  className="w-4 h-4 rounded-xl"
                />
              ) : (
                <div
                  className="w-4 h-4 rounded-xl flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  {initials}
                </div>
              )}
              <span>{collaborator.userName}</span>
            </div>

            {/* Selection highlight if user is selecting */}
            {collaborator.selectedNodeIds && collaborator.selectedNodeIds.length > 0 && (
              <div
                className="absolute -top-1 -left-1 w-3 h-3 rounded-xl animate-ping"
                style={{ backgroundColor: color, opacity: 0.5 }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

// ============================================================================
// PRESENCE INDICATOR (shows who's online)
// ============================================================================

export function PresenceIndicator() {
  const { collaborators } = useCanvasStore();

  if (collaborators.length <= 1) return null;

  return (
    <div className="fixed top-20 right-4 z-40">
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-lg border">
        <div className="flex -space-x-2">
          {collaborators.slice(0, 5).map((collaborator, index) => {
            const color = getCursorColor(index);
            const initials = collaborator.userName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={collaborator.userId}
                className="relative"
                title={collaborator.userName}
              >
                {collaborator.userAvatar ? (
                  <img
                    src={collaborator.userAvatar}
                    alt={collaborator.userName}
                    className="w-8 h-8 rounded-xl border-2 border-white"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                )}
                {/* Online indicator */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-xl border-2 border-white"
                  style={{ backgroundColor: "#22C55E" }}
                />
              </div>
            );
          })}
        </div>

        {collaborators.length > 5 && (
          <span className="text-xs text-gray-500 font-medium">
            +{collaborators.length - 5}
          </span>
        )}

        <div className="text-xs text-gray-500">
          {collaborators.length} online
        </div>
      </div>
    </div>
  );
}

export default CollaboratorCursors;
