"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Home, Pencil, Download, Maximize2, Star, MoreHorizontal, FileText, ImageIcon, File, ChevronRight, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { DocumentToolbar } from "@/components/documents/document-toolbar";
import { AddMediaPopover } from "@/components/documents/add-media-popover";
import { AIImagePanel } from "@/components/documents/ai-image-panel";
import { ImageWithConnector } from "@/components/documents/image-with-connector";
import { DraggableElement, ElementBounds } from "@/components/documents/draggable-element";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  previewUrl?: string;
  storage_path?: string;
  is_starred?: boolean;
  created_at: string;
}

export default function DocumentViewPage() {
  const params = useParams<{ workspaceId: string; documentId: string }>();
  const router = useRouter();
  const { workspaceId, documentId } = params;

  const [document, setDocument] = useState<Document | null>(null);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [loading, setLoading] = useState(true);
  
  // Toolbar state
  const [zoom, setZoom] = useState(100);
  
  // Add Media state
  const [showAddMediaPopover, setShowAddMediaPopover] = useState(false);
  const [addedMedia, setAddedMedia] = useState<Document[]>([]);
  
  // AI Panel state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [connectedImageIds, setConnectedImageIds] = useState<Set<string>>(new Set());
  
  // Generated images state (output from AI)
  interface GeneratedImage {
    id: string;
    url: string;
    title: string;
    timestamp: number;
  }
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  // Context menu state for generated images
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    imageId: string | null;
  }>({ visible: false, x: 0, y: 0, imageId: null });
  
  // Element bounds for drawing connection lines (n8n-style)
  const [elementBounds, setElementBounds] = useState<Record<string, ElementBounds>>({});
  
  // Alert Dialog state for save confirmation
  const [saveAlert, setSaveAlert] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({ open: false, success: false, message: "" });
  
  const handleBoundsChange = useCallback((id: string, bounds: ElementBounds) => {
    setElementBounds(prev => ({ ...prev, [id]: bounds }));
  }, []);
  
  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);
  
  // Handle right-click on generated image
  const handleContextMenu = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      imageId,
    });
  };
  
  // Save generated image to Media
  const handleSaveGeneratedImage = async () => {
    const image = generatedImages.find(img => img.id === contextMenu.imageId);
    if (!image || !workspaceId) return;
    
    try {
      // Fetch the image and convert to blob
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", blob, `${image.title.replace(/[^a-zA-Z0-9]/g, "_")}.png`);
      formData.append("workspaceId", workspaceId);
      formData.append("title", image.title);
      
      // Upload to documents API
      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      if (uploadRes.ok) {
        setSaveAlert({
          open: true,
          success: true,
          message: "Bild wurde erfolgreich in Media gespeichert!"
        });
        // Optionally remove from generated images after saving
        // setGeneratedImages(prev => prev.filter(img => img.id !== contextMenu.imageId));
      } else {
        setSaveAlert({
          open: true,
          success: false,
          message: "Fehler beim Speichern des Bildes."
        });
      }
    } catch (error) {
      console.error("Error saving image:", error);
      setSaveAlert({
        open: true,
        success: false,
        message: "Fehler beim Speichern des Bildes."
      });
    }
    
    setContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Delete generated image
  const handleDeleteGeneratedImage = () => {
    setGeneratedImages(prev => prev.filter(img => img.id !== contextMenu.imageId));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const loadData = useCallback(async () => {
    if (!workspaceId || !documentId) return;
    setLoading(true);
    try {
      // Load workspace info
      const wsRes = await fetch(`/api/workspaces/${workspaceId}`);
      const wsData = await wsRes.json();
      if (wsData.workspace?.name) {
        setWorkspaceName(wsData.workspace.name);
      }

      // Load all documents
      const docsRes = await fetch(`/api/documents/list?workspaceId=${workspaceId}`);
      const docsData = await docsRes.json();
      if (docsData.documents) {
        setAllDocuments(docsData.documents);
        const currentDoc = docsData.documents.find((d: Document) => d.id === documentId);
        if (currentDoc) {
          setDocument(currentDoc);
        }
      }
    } catch (error) {
      console.error("Failed to load document:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, documentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = async () => {
    if (!document?.previewUrl) return;
    const link = window.document.createElement("a");
    link.href = document.previewUrl;
    link.download = document.title;
    link.click();
  };

  const toggleStar = async () => {
    if (!document) return;
    try {
      await fetch("/api/documents/star", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: [document.id],
          starred: !document.is_starred,
        }),
      });
      setDocument(prev => prev ? { ...prev, is_starred: !prev.is_starred } : null);
    } catch (error) {
      console.error("Failed to star document:", error);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 25));
  const handleZoomReset = () => setZoom(100);
  const handleFitToScreen = () => setZoom(100);

  // Add Media handler
  const handleAddMedia = (mediaIds: string[]) => {
    const newMedia = allDocuments.filter(doc => mediaIds.includes(doc.id));
    setAddedMedia(prev => [...prev, ...newMedia]);
  };

  // Connection handlers
  const handleConnect = (imageId: string) => {
    setConnectedImageIds(prev => {
      const newSet = new Set(prev);
      newSet.add(imageId);
      return newSet;
    });
    // Auto-open AI panel when connecting
    setShowAIPanel(true);
  };

  const handleDisconnect = (imageId: string) => {
    setConnectedImageIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  };

  // Get connected images for AI panel
  const getConnectedImages = () => {
    const allImages = document ? [document, ...addedMedia] : addedMedia;
    return allImages
      .filter(img => connectedImageIds.has(img.id))
      .map(img => ({
        id: img.id,
        title: img.title,
        previewUrl: img.previewUrl,
      }));
  };

  // Handle AI generated image - show it to the right of the chat panel
  const handleImageGenerated = (imageUrl: string, title: string) => {
    const newGeneratedImage: GeneratedImage = {
      id: `generated-${Date.now()}`,
      url: imageUrl,
      title,
      timestamp: Date.now(),
    };
    setGeneratedImages(prev => [...prev, newGeneratedImage]);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link href={`/workspace/${workspaceId}`} className="flex items-center gap-1 hover:text-foreground text-muted-foreground">
            <Home className="h-4 w-4" />
            {workspaceName}
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" />
            {document.title}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <span>Edited {new Date(document.created_at).toLocaleDateString()}</span>
          <button onClick={toggleStar} className="p-1.5 hover:bg-muted rounded ml-2">
            <Star className={`h-4 w-4 ${document.is_starred ? "text-amber-500 fill-amber-500" : ""}`} />
          </button>
          <button className="p-1.5 hover:bg-muted rounded">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Document List */}
        <div className="w-48 border-r overflow-y-auto py-2">
          {allDocuments.map((doc) => (
            <Link
              key={doc.id}
              href={`/workspace/${workspaceId}/document/${doc.id}`}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 ${
                doc.id === documentId ? "bg-muted" : ""
              }`}
            >
              {doc.mime_type?.startsWith("image/") ? (
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : doc.mime_type === "application/pdf" ? (
                <img src="/pdf-icon.svg" alt="PDF" className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <File className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{doc.title}</span>
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Document Preview - Scrollable area */}
          <div 
            className="flex-1 overflow-auto p-8 bg-muted/30"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            {/* Floating Top Toolbar */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-white border rounded-full shadow-sm px-2 py-1 z-10" style={{ transform: `scale(${100 / zoom})`, transformOrigin: "top right" }}>
              <button className="p-2 hover:bg-muted rounded-full">
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={handleDownload} className="p-2 hover:bg-muted rounded-full">
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => document.previewUrl && window.open(document.previewUrl, "_blank")}
                className="p-2 hover:bg-muted rounded-full"
              >
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* n8n-style Canvas: Freely draggable elements with curved connection lines */}
            <div className="relative w-full h-full min-h-[900px] overflow-hidden">
              {/* SVG Layer for Curved Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" style={{ overflow: 'visible' }}>
                <defs>
                  {/* Green arrow for input connections */}
                  <marker
                    id="arrow-green-n8n"
                    markerWidth="12"
                    markerHeight="8"
                    refX="10"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 0, 12 4, 0 8" fill="#10b981" />
                  </marker>
                  {/* Purple arrow for output connections */}
                  <marker
                    id="arrow-purple-n8n"
                    markerWidth="12"
                    markerHeight="8"
                    refX="10"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 0, 12 4, 0 8" fill="#8b5cf6" />
                  </marker>
                </defs>
                {/* Draw curved bezier lines from each connected image to AI panel */}
                {/* Input connections: Images → AI Panel */}
                {showAIPanel && elementBounds["ai-panel"] && Array.from(connectedImageIds).map((imageId) => {
                  const nodeId = imageId === document?.id ? "main-image" : `media-${imageId}`;
                  const imageBounds = elementBounds[nodeId];
                  const panelBounds = elementBounds["ai-panel"];
                  
                  if (!imageBounds || !panelBounds) return null;
                  
                  // Start point: right edge of image, vertically centered
                  const startX = imageBounds.x + imageBounds.width + 10;
                  const startY = imageBounds.y + imageBounds.height / 2;
                  
                  // End point: left edge of panel, vertically centered
                  const endX = panelBounds.x - 5;
                  const endY = panelBounds.y + panelBounds.height / 2;
                  
                  // Control points for smooth bezier curve
                  const controlOffset = Math.min(100, Math.abs(endX - startX) / 3);
                  
                  // Create bezier path
                  const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
                  
                  return (
                    <path
                      key={`input-${imageId}`}
                      d={path}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="10 6"
                      markerEnd="url(#arrow-green-n8n)"
                    />
                  );
                })}
                
                {/* Output connections: AI Panel → Generated Images */}
                {showAIPanel && elementBounds["ai-panel"] && generatedImages.map((genImg) => {
                  const panelBounds = elementBounds["ai-panel"];
                  const outputBounds = elementBounds[`output-${genImg.id}`];
                  
                  if (!panelBounds || !outputBounds) return null;
                  
                  // Start point: right edge of panel, vertically centered
                  const startX = panelBounds.x + panelBounds.width + 10;
                  const startY = panelBounds.y + panelBounds.height / 2;
                  
                  // End point: left edge of generated image, vertically centered
                  const endX = outputBounds.x - 5;
                  const endY = outputBounds.y + outputBounds.height / 2;
                  
                  // Control points for smooth bezier curve
                  const controlOffset = Math.min(100, Math.abs(endX - startX) / 3);
                  
                  // Create bezier path
                  const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
                  
                  return (
                    <path
                      key={`output-${genImg.id}`}
                      d={path}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      strokeDasharray="10 6"
                      markerEnd="url(#arrow-purple-n8n)"
                    />
                  );
                })}
              </svg>

              {/* Main Document - Draggable */}
              <DraggableElement
                id="main-image"
                initialX={100}
                initialY={80}
                onBoundsChange={handleBoundsChange}
              >
                <div className="relative">
                  {document.mime_type?.startsWith("image/") && document.previewUrl ? (
                    <ImageWithConnector
                      id={document.id}
                      src={document.previewUrl}
                      alt={document.title}
                      isConnected={connectedImageIds.has(document.id)}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                    />
                  ) : document.mime_type === "application/pdf" && document.previewUrl ? (
                    <iframe
                      src={`${document.previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full max-w-4xl rounded-lg border shadow-lg bg-white pointer-events-auto"
                      title={document.title}
                      style={{ minHeight: "600px" }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground py-16 bg-white rounded-xl shadow-lg px-8">
                      <File className="h-24 w-24" />
                      <p>Preview not available</p>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Download File
                      </button>
                    </div>
                  )}
                  {/* Main image title */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border text-xs text-muted-foreground whitespace-nowrap max-w-[200px] truncate">
                    {document.title}
                  </div>
                </div>
              </DraggableElement>

              {/* Added Media - Each as separate draggable element */}
              {addedMedia.map((media, index) => (
                <DraggableElement
                  key={media.id}
                  id={`media-${media.id}`}
                  initialX={100}
                  initialY={450 + (index * 350)}
                  onBoundsChange={handleBoundsChange}
                >
                  <div className="relative">
                    {media.previewUrl && (
                      <ImageWithConnector
                        id={media.id}
                        src={media.previewUrl}
                        alt={media.title}
                        isConnected={connectedImageIds.has(media.id)}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                      />
                    )}
                    {/* Media label */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border text-xs text-muted-foreground whitespace-nowrap">
                      {media.title}
                    </div>
                  </div>
                </DraggableElement>
              ))}

              {/* Draggable AI Panel Node */}
              {showAIPanel && (
                <DraggableElement
                  id="ai-panel"
                  initialX={700}
                  initialY={200}
                  onBoundsChange={handleBoundsChange}
                >
                  <AIImagePanel
                    isOpen={showAIPanel}
                    onClose={() => {
                      setShowAIPanel(false);
                      setConnectedImageIds(new Set());
                    }}
                    workspaceId={workspaceId || ""}
                    connectedImages={getConnectedImages()}
                    onImageGenerated={handleImageGenerated}
                  />
                </DraggableElement>
              )}

              {/* Generated Images - Output from AI Panel */}
              {generatedImages.map((genImg, index) => (
                <DraggableElement
                  key={genImg.id}
                  id={`output-${genImg.id}`}
                  initialX={1150}
                  initialY={100 + (index * 350)}
                  onBoundsChange={handleBoundsChange}
                >
                  <div 
                    className="relative group"
                    onContextMenu={(e) => handleContextMenu(e, genImg.id)}
                  >
                    {/* Generated badge */}
                    <div className="absolute -top-3 -right-3 bg-violet-500 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md z-10">
                      <Sparkles className="h-3 w-3" />
                      <span>Generated</span>
                    </div>
                    {/* Image with purple border */}
                    <div className="relative rounded-xl overflow-hidden ring-2 ring-violet-500 ring-offset-2">
                      <img
                        src={genImg.url}
                        alt={genImg.title}
                        className="w-[300px] h-auto object-contain rounded-xl shadow-lg"
                      />
                    </div>
                    {/* Title label */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border text-xs text-muted-foreground whitespace-nowrap max-w-[280px] truncate">
                      {genImg.title}
                    </div>
                  </div>
                </DraggableElement>
              ))}
              
            </div>
          </div>
        </div>
      </div>

      {/* Document Toolbar - Bottom Right */}
      <DocumentToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onFitToScreen={handleFitToScreen}
        onAddMedia={() => setShowAddMediaPopover(true)}
        onCreateImage={() => setShowAIPanel(true)}
      />

      {/* Add Media Popover */}
      <AddMediaPopover
        workspaceId={workspaceId || ""}
        isOpen={showAddMediaPopover}
        onClose={() => setShowAddMediaPopover(false)}
        onAddMedia={handleAddMedia}
        excludeIds={[document.id, ...addedMedia.map(m => m.id)]}
      />

      {/* Custom Context Menu for Generated Images - Outside all containers */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white rounded-xl shadow-xl border py-1.5 min-w-[180px] z-[9999]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleSaveGeneratedImage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Speichern</span>
          </button>
          <div className="border-t my-1" />
          <button
            type="button"
            onClick={handleDeleteGeneratedImage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Löschen</span>
          </button>
        </div>
      )}

      {/* Save Alert Dialog */}
      <AlertDialog open={saveAlert.open} onOpenChange={(open) => setSaveAlert(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={saveAlert.success ? "text-emerald-600" : "text-red-600"}>
              {saveAlert.success ? "Erfolg!" : "Fehler"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {saveAlert.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSaveAlert(prev => ({ ...prev, open: false }))}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
