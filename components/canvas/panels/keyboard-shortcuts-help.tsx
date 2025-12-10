"use client";

import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "General",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open Command Palette" },
      { keys: ["⌘", "H"], description: "Toggle History Panel" },
      { keys: ["⌘", "I"], description: "Toggle Node Inspector" },
      { keys: ["?"], description: "Show Keyboard Shortcuts" },
      { keys: ["Esc"], description: "Close Panel / Clear Selection" },
    ],
  },
  {
    category: "Editing",
    shortcuts: [
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘", "C"], description: "Copy Selection" },
      { keys: ["⌘", "X"], description: "Cut Selection" },
      { keys: ["⌘", "V"], description: "Paste" },
      { keys: ["⌘", "D"], description: "Duplicate" },
      { keys: ["⌘", "A"], description: "Select All" },
      { keys: ["⌫"], description: "Delete Selection" },
    ],
  },
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["Scroll"], description: "Zoom In/Out" },
      { keys: ["Space", "Drag"], description: "Pan Canvas" },
      { keys: ["⌘", "0"], description: "Reset Zoom" },
      { keys: ["⌘", "+"], description: "Zoom In" },
      { keys: ["⌘", "-"], description: "Zoom Out" },
    ],
  },
  {
    category: "Selection",
    shortcuts: [
      { keys: ["Click"], description: "Select Node" },
      { keys: ["⇧", "Click"], description: "Multi-Select" },
      { keys: ["Drag"], description: "Box Select" },
    ],
  },
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <p className="text-xs text-gray-500">Quick reference for canvas controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            {SHORTCUTS.map((group) => (
              <div key={group.category}>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">
                  {group.category}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded border border-gray-200 shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsHelp;
