"use client";

import { LayoutGrid, Grid3X3, List } from "lucide-react";

export type ViewMode = "grid" | "list" | "compact";

interface ViewModeSwitchProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeSwitch({ value, onChange }: ViewModeSwitchProps) {
  return (
    <div className="inline-flex items-center h-9 rounded-xl border border-emerald-200 bg-emerald-50/70 p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        className={`h-7 w-8 inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          value === "grid"
            ? "bg-emerald-600 text-white shadow"
            : "text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        className={`h-7 w-8 inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          value === "list"
            ? "bg-emerald-600 text-white shadow"
            : "text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("compact")}
        aria-pressed={value === "compact"}
        className={`h-7 w-8 inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          value === "compact"
            ? "bg-emerald-600 text-white shadow"
            : "text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
