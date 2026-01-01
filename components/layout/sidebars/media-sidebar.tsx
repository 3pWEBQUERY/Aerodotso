"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, ImageIcon, Trash2, Pencil, Copy } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
  mime_type: string;
  created_at: string;
  previewUrl?: string;
}

interface MediaSidebarProps {
  workspaceId: string;
}

export function MediaSidebar({ workspaceId }: MediaSidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const fetchDocuments = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/documents/list?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Group documents by date
  const groupDocumentsByDate = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);
    const pastMonth = new Date(today);
    pastMonth.setDate(pastMonth.getDate() - 30);

    const groups: { [key: string]: Document[] } = {
      today: [],
      yesterday: [],
      pastWeek: [],
      pastMonth: [],
      older: [],
    };

    const sorted = [...documents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const doc of sorted) {
      const docDate = new Date(doc.created_at);
      if (docDate >= today) {
        groups.today.push(doc);
      } else if (docDate >= yesterday) {
        groups.yesterday.push(doc);
      } else if (docDate >= pastWeek) {
        groups.pastWeek.push(doc);
      } else if (docDate >= pastMonth) {
        groups.pastMonth.push(doc);
      } else {
        groups.older.push(doc);
      }
    }

    return groups;
  }, [documents]);

  const groupedDocs = groupDocumentsByDate();

  const startEditing = (doc: Document, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(doc.id);
    setEditingTitle(doc.title);
  };

  const saveTitle = async (docId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await fetch("/api/documents/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, name: editingTitle.trim() }),
      });

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, title: editingTitle.trim() } : d
        )
      );
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setEditingId(null);
    }
  };

  const copyDocumentLink = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/workspace/${workspaceId}/document/${docId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const deleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const renderDocList = (docs: Document[]) =>
    docs.map((doc) => (
      <div key={doc.id} className="group flex items-center rounded-md hover:bg-[var(--workspace-sidebar-muted)] mb-0.5 overflow-hidden">
        {editingId === doc.id ? (
          <div className="flex-1 flex items-center gap-2 px-2 py-1">
            {doc.mime_type === "application/pdf" ? (
              <img src="/pdf-icon.svg" alt="PDF" className="h-3 w-3 flex-shrink-0" />
            ) : (
              <ImageIcon className="h-3 w-3 flex-shrink-0" />
            )}
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => saveTitle(doc.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveTitle(doc.id);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingId(null);
                }
              }}
              className="flex-1 bg-[var(--workspace-sidebar-muted)] border border-[var(--workspace-sidebar-border)] rounded px-1 py-0.5 text-xs text-[var(--workspace-sidebar-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <>
            <Link
              href={`/workspace/${workspaceId}/document/${doc.id}`}
              className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--workspace-sidebar-muted-foreground)]"
            >
              {doc.mime_type === "application/pdf" ? (
                <img src="/pdf-icon.svg" alt="PDF" className="h-3 w-3 flex-shrink-0" />
              ) : (
                <ImageIcon className="h-3 w-3 flex-shrink-0" />
              )}
              <span className="truncate max-w-[80px]">{doc.title}</span>
            </Link>
            {/* Hover action buttons - 3 buttons like in the image */}
            <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => startEditing(doc, e)}
                className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                title="Rename"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => copyDocumentLink(doc.id, e)}
                className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                title="Copy Link"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => deleteDocument(doc.id, e)}
                className="p-1 hover:bg-red-500/20 rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </div>
    ));

  return (
    <aside className="w-64 flex-shrink-0 rounded-xl text-sm flex flex-col overflow-hidden border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-[var(--workspace-sidebar-border)] text-[var(--workspace-sidebar-foreground)]">
        <span className="font-medium">Media</span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {groupedDocs.today.length > 0 && (
          <>
            <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-2">Today</p>
            {renderDocList(groupedDocs.today)}
          </>
        )}
        
        {groupedDocs.yesterday.length > 0 && (
          <>
            <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-2 mt-3">Yesterday</p>
            {renderDocList(groupedDocs.yesterday)}
          </>
        )}

        {groupedDocs.pastWeek.length > 0 && (
          <>
            <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-2 mt-3">Past Week</p>
            {renderDocList(groupedDocs.pastWeek)}
          </>
        )}

        {groupedDocs.pastMonth.length > 0 && (
          <>
            <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-2 mt-3">Past Month</p>
            {renderDocList(groupedDocs.pastMonth)}
          </>
        )}

        {groupedDocs.older.length > 0 && (
          <>
            <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-2 mt-3">Older</p>
            {renderDocList(groupedDocs.older)}
          </>
        )}

        {documents.length === 0 && (
          <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] text-center py-4">No files yet</p>
        )}
      </div>

    </aside>
  );
}
