"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface Panel {
  id: string;
  type: "note" | "document" | "link" | "canvas" | "folder" | "scratch";
  itemId: string;
  title: string;
  width: number; // Width in pixels
}

interface PanelContextType {
  panels: Panel[];
  activePanel: string | null;
  openPanel: (panel: Omit<Panel, "id" | "width">) => void;
  closePanel: (panelId: string) => void;
  setActivePanel: (panelId: string | null) => void;
  closeAllPanels: () => void;
  updatePanelWidth: (panelId: string, width: number) => void;
  isPanelOpen: boolean;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

const DEFAULT_PANEL_WIDTH = 450;
const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 800;

export function PanelProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const openPanel = useCallback((panel: Omit<Panel, "id" | "width">) => {
    const id = `panel-${Date.now()}`;
    const newPanel: Panel = { ...panel, id, width: DEFAULT_PANEL_WIDTH };
    
    // Check if this item is already open
    const existingIndex = panels.findIndex(p => p.itemId === panel.itemId && p.type === panel.type);
    if (existingIndex >= 0) {
      setActivePanel(panels[existingIndex].id);
      return;
    }
    
    // Allow multiple panels (up to 3)
    setPanels(prev => {
      if (prev.length >= 3) {
        return [...prev.slice(1), newPanel];
      }
      return [...prev, newPanel];
    });
    setActivePanel(id);
  }, [panels]);

  const closePanel = useCallback((panelId: string) => {
    setPanels(prev => prev.filter(p => p.id !== panelId));
    setActivePanel(prev => prev === panelId ? null : prev);
  }, []);

  const closeAllPanels = useCallback(() => {
    setPanels([]);
    setActivePanel(null);
  }, []);

  const updatePanelWidth = useCallback((panelId: string, width: number) => {
    const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));
    setPanels(prev => prev.map(p => 
      p.id === panelId ? { ...p, width: clampedWidth } : p
    ));
  }, []);

  return (
    <PanelContext.Provider
      value={{
        panels,
        activePanel,
        openPanel,
        closePanel,
        setActivePanel,
        closeAllPanels,
        updatePanelWidth,
        isPanelOpen: panels.length > 0,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}

export function usePanels() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error("usePanels must be used within a PanelProvider");
  }
  return context;
}

export { MIN_PANEL_WIDTH, MAX_PANEL_WIDTH };
