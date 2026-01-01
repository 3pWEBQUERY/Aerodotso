"use client";

import { ReactNode } from "react";
import { PanelProvider } from "@/contexts/panel-context";
import { SidePanel } from "./side-panel";

interface WorkspacePanelLayoutProps {
  children: ReactNode;
  workspaceId: string;
}

export function WorkspacePanelLayout({ children, workspaceId }: WorkspacePanelLayoutProps) {
  return (
    <PanelProvider>
      <div className="flex-1 flex min-w-0 h-screen overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>
        <SidePanel workspaceId={workspaceId} />
      </div>
    </PanelProvider>
  );
}
