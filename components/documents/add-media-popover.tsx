"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ImageIcon, Check, Search } from "lucide-react";

interface MediaDocument {
  id: string;
  title: string;
  mime_type: string;
  previewUrl?: string;
}

interface AddMediaPopoverProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onAddMedia: (mediaIds: string[]) => void;
  excludeIds?: string[];
}

export function AddMediaPopover({
  workspaceId,
  isOpen,
  onClose,
  onAddMedia,
  excludeIds = [],
}: AddMediaPopoverProps) {
  const [documents, setDocuments] = useState<MediaDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!workspaceId || !isOpen) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/list?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.documents) {
        // Filter to only show images and exclude already added ones
        const imageDocs = data.documents.filter(
          (doc: MediaDocument) =>
            doc.mime_type?.startsWith("image/") && !excludeIds.includes(doc.id)
        );
        setDocuments(imageDocs);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isOpen, excludeIds]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  }, [isOpen]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAdd = () => {
    if (selectedIds.size > 0) {
      onAddMedia(Array.from(selectedIds));
      onClose();
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[500px] max-h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">Add Media from Workspace</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground text-sm">No media found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleSelection(doc.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIds.has(doc.id)
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  {doc.previewUrl ? (
                    <img
                      src={doc.previewUrl}
                      alt={doc.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  {/* Selection indicator */}
                  {selectedIds.has(doc.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">{doc.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
