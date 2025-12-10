"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, FolderClosed, ImageIcon, FileText, File, Check, Move, Star, Share2, Trash2, X, Home } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  previewUrl?: string;
  folder_id?: string | null;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  workspace_id: string;
  parent_folder_id?: string | null;
  created_at: string;
}

export default function FolderPage() {
  const params = useParams<{ workspaceId: string; folderId: string }>();
  const { workspaceId, folderId } = params || {};

  const [folder, setFolder] = useState<Folder | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [showMovePopover, setShowMovePopover] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState("");

  const loadData = useCallback(async () => {
    if (!workspaceId || !folderId) return;
    setLoading(true);
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch(`/api/documents/list?workspaceId=${workspaceId}`),
        fetch(`/api/folders?workspaceId=${workspaceId}`),
      ]);
      const [docsData, foldersData] = await Promise.all([
        docsRes.json(),
        foldersRes.json(),
      ]);
      if (docsData.documents) {
        setDocuments(docsData.documents.filter((d: Document) => d.folder_id === folderId));
      }
      if (foldersData.folders) {
        setAllFolders(foldersData.folders);
        const currentFolder = foldersData.folders.find((f: Folder) => f.id === folderId);
        setFolder(currentFolder || null);
      }
    } catch (error) {
      console.error("Failed to load folder data:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, folderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) newSet.delete(docId);
      else newSet.add(docId);
      return newSet;
    });
  };

  const clearSelection = () => setSelectedDocs(new Set());

  const moveToFolder = async (targetFolderId: string | null) => {
    if (selectedDocs.size === 0) return;
    try {
      const res = await fetch("/api/documents/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedDocs), folderId: targetFolderId }),
      });
      if (res.ok) {
        if (targetFolderId !== folderId) {
          setDocuments(docs => docs.filter(d => !selectedDocs.has(d.id)));
        }
        clearSelection();
        setShowMovePopover(false);
      }
    } catch (error) {
      console.error("Failed to move documents:", error);
    }
  };

  const deleteSelected = async () => {
    if (selectedDocs.size === 0) return;
    try {
      const res = await fetch("/api/documents/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedDocs) }),
      });
      if (res.ok) {
        setDocuments(docs => docs.filter(d => !selectedDocs.has(d.id)));
        clearSelection();
      }
    } catch (error) {
      console.error("Failed to delete documents:", error);
    }
  };

  const startEditingDoc = (docId: string, currentName: string) => {
    setEditingDocId(docId);
    setEditingDocName(currentName);
  };

  const saveDocName = async (docId: string) => {
    if (!editingDocName.trim()) { setEditingDocId(null); return; }
    try {
      const res = await fetch("/api/documents/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, name: editingDocName.trim() }),
      });
      if (res.ok) {
        setDocuments(docs => docs.map(d => d.id === docId ? { ...d, title: editingDocName.trim() } : d));
      }
    } catch (error) {
      console.error("Failed to rename document:", error);
    } finally {
      setEditingDocId(null);
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r pr-3 text-sm flex flex-col">
        <header className="flex items-center gap-2 px-2 py-2 border-b">
          <FolderClosed className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{folder?.name || "Folder"}</span>
        </header>
        <div className="flex-1 overflow-y-auto px-2 pt-2 space-y-1">
          {documents.map((doc) => (
            <Link 
              key={doc.id} 
              href={`/workspace/${workspaceId}/document/${doc.id}`}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="truncate">{doc.title}</span>
            </Link>
          ))}
        </div>
        <div className="border-t px-2 py-2 text-xs text-muted-foreground flex items-center gap-1">
          <Trash2 className="h-3.5 w-3.5" /><span>Trash</span>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 pr-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href={`/workspace/${workspaceId}`} className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />Back to Workspace
            </Link>
          </div>

          <h1 className="text-2xl font-bold flex items-center gap-3 mb-8">
            <FolderClosed className="h-8 w-8 text-amber-500" />{folder?.name || "Loading..."}
          </h1>

          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">This folder is empty.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="w-44 hover:shadow-lg transition-shadow cursor-pointer relative group">
                  {/* Selection checkbox */}
                  <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleDocSelection(doc.id); }}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedDocs.has(doc.id) ? "bg-emerald-600 border-emerald-600 text-white opacity-100" : "bg-white/80 border-gray-300 hover:border-emerald-500 opacity-0 group-hover:opacity-100"}`}>
                    {selectedDocs.has(doc.id) && <Check className="h-4 w-4" />}
                  </button>
                  
                  {/* Clickable link to document page */}
                  <Link href={`/workspace/${workspaceId}/document/${doc.id}`}>
                    {doc.mime_type?.startsWith("image/") && doc.previewUrl ? (
                      <div className={`h-56 rounded-xl overflow-hidden bg-gray-100 relative ${selectedDocs.has(doc.id) ? "ring-2 ring-emerald-500" : ""}`}>
                        <img src={doc.previewUrl} alt={doc.title} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                            <span className="text-xs text-white truncate flex-1 min-w-0">{doc.title}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`h-56 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center border relative ${selectedDocs.has(doc.id) ? "ring-2 ring-emerald-500" : ""}`}>
                        {doc.mime_type === "application/pdf" ? <FileText className="h-12 w-12 text-red-500" /> : <File className="h-12 w-12 text-gray-400" />}
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2.5 rounded-b-xl border-t">
                          <div className="flex items-center gap-1.5">
                            <File className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">{doc.title}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDocs.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-1 bg-white border rounded-xl shadow-lg px-2 py-1.5">
              <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 rounded-lg">{selectedDocs.size} selected</span>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <div className="relative">
                <button type="button" onClick={() => setShowMovePopover(!showMovePopover)} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg">
                  <Move className="h-4 w-4" />Move
                </button>
                {showMovePopover && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border rounded-xl shadow-lg py-2">
                    <button type="button" onClick={() => moveToFolder(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left">
                      <Home className="h-4 w-4" />Root (no folder)
                    </button>
                    {allFolders.filter(f => f.id !== folderId).map((f) => (
                      <button key={f.id} type="button" onClick={() => moveToFolder(f.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left">
                        <FolderClosed className="h-4 w-4 text-amber-500" />{f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg"><Star className="h-4 w-4" />Star</button>
              <button type="button" className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg"><Share2 className="h-4 w-4" />Share</button>
              <button type="button" onClick={deleteSelected} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-50 text-red-600 rounded-lg"><Trash2 className="h-4 w-4" />Delete</button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <button type="button" onClick={clearSelection} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
