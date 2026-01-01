"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  Trash2,
  Pencil,
  FolderClosed,
  StickyNote,
  ImageIcon,
  Link2,
  LayoutTemplate,
  Star,
  Copy,
} from "lucide-react";
import Link from "next/link";

interface HomeSidebarProps {
  workspaceId: string;
}

interface Note {
  id: string;
  title: string;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  mime_type: string;
  previewUrl?: string;
  created_at: string;
  is_starred?: boolean;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  created_at: string;
  link_type?: string;
}

interface CanvasItem {
  id: string;
  name: string;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  parent_folder_id?: string | null;
}

export function HomeSidebar({ workspaceId }: HomeSidebarProps) {
  const [workspaceName, setWorkspaceName] = useState("Loading...");
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [canvases, setCanvases] = useState<CanvasItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await res.json();
      if (data.workspace?.name) {
        setWorkspaceName(data.workspace.name);
      }
    } catch (error) {
      console.error("Failed to load workspace:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setEditName(workspaceName);
    setIsEditing(true);
  };

  const saveWorkspaceName = async () => {
    if (!editName.trim() || editName === workspaceName) {
      setIsEditing(false);
      return;
    }

    try {
      const res = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: editName.trim() }),
      });

      if (res.ok) {
        setWorkspaceName(editName.trim());
        window.dispatchEvent(new CustomEvent("workspace-renamed"));
      }
    } catch (error) {
      console.error("Failed to rename workspace:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const fetchContent = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [notesRes, docsRes, linksRes, canvasRes, foldersRes] =
        await Promise.all([
          fetch(`/api/notes?workspaceId=${workspaceId}`),
          fetch(`/api/documents/list?workspaceId=${workspaceId}`),
          fetch(`/api/links?workspaceId=${workspaceId}`),
          fetch(`/api/canvas?workspaceId=${workspaceId}`),
          fetch(`/api/folders?workspaceId=${workspaceId}`),
        ]);

      const [notesData, docsData, linksData, canvasData, foldersData] =
        await Promise.all([
          notesRes.json(),
          docsRes.json(),
          linksRes.json(),
          canvasRes.json(),
          foldersRes.json(),
        ]);

      if (notesData.notes) setNotes(notesData.notes);
      if (docsData.documents) setDocuments(docsData.documents);
      if (linksData.links) setLinks(linksData.links);
      if (canvasData.canvases) setCanvases(canvasData.canvases);
      if (foldersData.folders) setFolders(foldersData.folders);
    } catch (error) {
      console.error("Failed to fetch workspace content:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const rootFolders = folders.filter((f) => !f.parent_folder_id);
  const starredDocs = documents.filter((d) => d.is_starred);

  type SidebarItem = {
    id: string;
    type: "note" | "document" | "link" | "canvas";
    label: string;
    created_at: string;
    href: string;
  };

  const unifiedItems: SidebarItem[] = [
    ...notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      label: n.title || "Untitled",
      created_at: n.created_at,
      href: `/workspace/${workspaceId}/notes/${n.id}`,
    })),
    ...documents.map((d) => ({
      id: d.id,
      type: "document" as const,
      label: d.title,
      created_at: d.created_at,
      href: `/workspace/${workspaceId}/document/${d.id}`,
    })),
    ...links.map((l) => ({
      id: l.id,
      type: "link" as const,
      label: l.title || l.url,
      created_at: l.created_at,
      href: `/workspace/${workspaceId}/links/${l.id}`,
    })),
    ...canvases.map((c) => ({
      id: c.id,
      type: "canvas" as const,
      label: c.name || "Untitled Canvas",
      created_at: c.created_at,
      href: `/workspace/${workspaceId}/canvas/${c.id}`,
    })),
  ];

  const recentItems = unifiedItems
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 12);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveWorkspaceName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <aside className="w-64 rounded-xl text-sm flex flex-col border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      <header className="flex items-center justify-between px-2 py-2 border-b border-[var(--workspace-sidebar-border)] relative z-10 text-[var(--workspace-sidebar-foreground)]">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveWorkspaceName}
            onKeyDown={handleKeyDown}
            className="font-medium bg-transparent border-b border-[var(--accent-primary)] outline-none w-full text-[var(--workspace-sidebar-foreground)]"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="font-medium hover:text-[var(--accent-primary)] flex items-center gap-1 group cursor-pointer text-left"
          >
            <span>{workspaceName}</span>
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-2 pt-2 space-y-3 scrollbar-hide">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)]"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="truncate">{workspaceName}</span>
        </button>

        {/* Starred section */}
        {starredDocs.length > 0 && (
          <div className="mt-1">
            <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1">
              Starred
            </p>
            {starredDocs.slice(0, 5).map((doc) => (
              <Link
                key={doc.id}
                href={`/workspace/${workspaceId}/document/${doc.id}`}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)]"
              >
                <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <span className="truncate max-w-[140px]">{doc.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Workspace section */}
        <div>
          <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1">
            Workspace
          </p>

          {/* Folders */}
          {rootFolders.map((folder) => (
            <Link
              key={folder.id}
              href={`/workspace/${workspaceId}/folder/${folder.id}`}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)]"
            >
              <FolderClosed className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
              <span className="truncate max-w-[140px]">{folder.name}</span>
            </Link>
          ))}

          {/* Recent items */}
          {recentItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="group flex items-center rounded-md hover:bg-[var(--workspace-sidebar-muted)] mt-0.5 overflow-hidden"
            >
              <Link
                href={item.href}
                className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--workspace-sidebar-muted-foreground)]"
              >
                {item.type === "note" && (
                  <StickyNote className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                {item.type === "document" && (
                  <ImageIcon className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                {item.type === "link" && (
                  <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                {item.type === "canvas" && (
                  <LayoutTemplate className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span className="truncate max-w-[100px]">{item.label}</span>
              </Link>
              {/* Hover action buttons - 3 buttons */}
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Copy link
                    navigator.clipboard.writeText(`${window.location.origin}${item.href}`);
                  }}
                  className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                  title="Copy Link"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Delete based on type
                    const apiPath = item.type === "note" ? `/api/notes/${item.id}` 
                      : item.type === "document" ? `/api/documents/${item.id}`
                      : item.type === "link" ? `/api/links/${item.id}`
                      : `/api/canvas/${item.id}`;
                    try {
                      await fetch(apiPath, { method: "DELETE" });
                      fetchContent();
                    } catch (error) {
                      console.error("Failed to delete:", error);
                    }
                  }}
                  className="p-1 hover:bg-red-500/20 rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {rootFolders.length === 0 && recentItems.length === 0 && (
            <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] mt-2">
              No content yet
            </p>
          )}
        </div>
      </div>

    </aside>
  );
}
