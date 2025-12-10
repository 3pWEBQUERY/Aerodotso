// Keyboard Shortcuts Hook for Spatial AI Canvas
// Handles all keyboard interactions for the canvas

import { useEffect, useCallback } from "react";
import { useCanvasStore } from "@/lib/canvas/store";

export function useCanvasKeyboard() {
  const {
    selectedNodeIds,
    undo,
    redo,
    canUndo,
    canRedo,
    copyNodes,
    cutNodes,
    pasteNodes,
    deleteNodes,
    selectAll,
    clearSelection,
    duplicateNode,
  } = useCanvasStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Cmd/Ctrl + Z
      if (modKey && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((modKey && event.key === "z" && event.shiftKey) || (modKey && event.key === "y")) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // Copy: Cmd/Ctrl + C
      if (modKey && event.key === "c" && !event.shiftKey) {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          copyNodes(selectedNodeIds);
        }
        return;
      }

      // Cut: Cmd/Ctrl + X
      if (modKey && event.key === "x") {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          cutNodes(selectedNodeIds);
        }
        return;
      }

      // Paste: Cmd/Ctrl + V
      if (modKey && event.key === "v") {
        event.preventDefault();
        pasteNodes();
        return;
      }

      // Select All: Cmd/Ctrl + A
      if (modKey && event.key === "a") {
        event.preventDefault();
        selectAll();
        return;
      }

      // Duplicate: Cmd/Ctrl + D
      if (modKey && event.key === "d") {
        event.preventDefault();
        if (selectedNodeIds.length === 1) {
          duplicateNode(selectedNodeIds[0]);
        }
        return;
      }

      // Delete: Backspace or Delete
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          deleteNodes(selectedNodeIds);
        }
        return;
      }

      // Escape: Clear selection
      if (event.key === "Escape") {
        event.preventDefault();
        clearSelection();
        return;
      }
    },
    [
      selectedNodeIds,
      undo,
      redo,
      canUndo,
      canRedo,
      copyNodes,
      cutNodes,
      pasteNodes,
      deleteNodes,
      selectAll,
      clearSelection,
      duplicateNode,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export default useCanvasKeyboard;
