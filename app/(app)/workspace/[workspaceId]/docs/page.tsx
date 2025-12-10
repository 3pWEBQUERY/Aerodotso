import type { ReactNode } from "react";

interface WorkspaceDocsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceDocsPage(
  _props: WorkspaceDocsPageProps
): Promise<ReactNode> {
  // Platzhalter-Seite für zukünftige Dokumente/Notizen im Workspace
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
      <p className="text-sm text-muted-foreground">
        Hier kannst du später strukturierte Notizen, Specs oder andere Texte zu
        deinem Workspace sammeln.
      </p>
    </div>
  );
}
