"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Home, Pencil, Download, Maximize2, Star, FileText, ImageIcon, ImagePlus, File, Sparkles, Trash2, X } from "lucide-react";
import { ItemHeaderActions } from "@/components/shared/item-header-actions";
import Link from "next/link";
import { DocumentToolbar } from "@/components/documents/document-toolbar";
import { AddMediaPopover } from "@/components/documents/add-media-popover";
import { AIImagePanel } from "@/components/documents/ai-image-panel";
import { ImageWithConnector } from "@/components/documents/image-with-connector";
import { ResizableVideo } from "@/components/documents/resizable-video";
import { DraggableElement, ElementBounds } from "@/components/documents/draggable-element";
import { DocumentFloatingToolbar } from "@/components/documents/document-floating-toolbar";
import { ResizablePdfViewer } from "@/components/documents/resizable-pdf-viewer";
import { ResizableGeneratedImage } from "@/components/documents/resizable-generated-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// AI Icon component
const AIIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    viewBox="0 0 122.3 122.28" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <g>
        <path d="M62.84,76.47c-2.1,0-3.79-1.7-3.79-3.79v-15.4c0-2.13-1.73-3.86-3.86-3.86s-3.86,1.73-3.86,3.86v15.4c0,2.1-1.7,3.79-3.79,3.79s-3.79-1.7-3.79-3.79v-15.4c0-6.31,5.14-11.45,11.45-11.45s11.45,5.14,11.45,11.45v15.4c0,2.1-1.7,3.79-3.79,3.79Z"/>
        <path d="M62.84,68.09h-15.32c-2.1,0-3.79-1.7-3.79-3.79s1.7-3.79,3.79-3.79h15.32c2.1,0,3.79,1.7,3.79,3.79s-1.7,3.79-3.79,3.79Z"/>
        <path d="M74.8,76.47c-2.1,0-3.79-1.7-3.79-3.79v-23.06c0-2.1,1.7-3.79,3.79-3.79s3.79,1.7,3.79,3.79v23.06c0,2.1-1.7,3.79-3.79,3.79Z"/>
      </g>
      <path d="M105.4,64.94c-1.25,0-2.48-.62-3.2-1.76-5.25-8.25-11.73-16.26-19.27-23.8C53.5,9.96,22.48,1.45,11.97,11.96c-6.46,6.47-5.74,19.93,1.95,36.02,.9,1.89,.1,4.16-1.79,5.06-1.89,.9-4.15,.1-5.06-1.79C-2.19,31.84-2.36,15.57,6.61,6.59c15.21-15.21,51.09-3.17,81.68,27.42,7.93,7.93,14.76,16.37,20.31,25.09,1.13,1.77,.6,4.11-1.16,5.24-.63,.4-1.34,.59-2.03,.59Z"/>
      <path d="M97.83,122.25c-17.92,0-42.51-12.7-63.79-33.98-7.93-7.93-14.76-16.37-20.31-25.09-1.13-1.77-.6-4.11,1.16-5.24,1.77-1.13,4.12-.6,5.24,1.16,5.25,8.25,11.73,16.26,19.27,23.8,24.15,24.15,53.14,37,67.43,29.93,1.87-.93,4.15-.17,5.08,1.71,.93,1.88,.16,4.15-1.71,5.08-3.56,1.77-7.75,2.61-12.38,2.61Z"/>
      <path d="M113.03,116.81c-.97,0-1.94-.37-2.68-1.11-1.48-1.48-1.48-3.88,0-5.37,1.22-1.21,2.19-2.69,2.9-4.38,.81-1.93,3.04-2.84,4.96-2.04,1.93,.81,2.84,3.03,2.04,4.96-1.09,2.61-2.62,4.91-4.54,6.82-.74,.74-1.71,1.11-2.68,1.11Z"/>
      <path d="M116.75,111.21c-.49,0-.99-.1-1.46-.3-1.93-.81-2.84-3.03-2.03-4.96,3.05-7.27,1.28-18.81-4.85-31.64-.9-1.89-.1-4.16,1.79-5.06,1.89-.9,4.16-.1,5.06,1.79,7.16,15,8.94,28.44,5,37.84-.61,1.45-2.02,2.33-3.5,2.33Z"/>
      <path d="M61.17,109.17c-1.25,0-2.48-.62-3.2-1.76-1.13-1.77-.6-4.11,1.16-5.24,8.25-5.25,16.26-11.73,23.8-19.27,29.42-29.42,37.93-60.44,27.42-70.95-6.28-6.28-19.33-5.75-34.9,1.42-1.91,.88-4.16,.04-5.03-1.86-.88-1.9-.05-4.16,1.86-5.03,18.85-8.69,34.69-8.65,43.44,.11,15.21,15.21,3.17,51.09-27.42,81.68-7.93,7.93-16.37,14.76-25.09,20.31-.63,.4-1.34,.59-2.03,.59Z"/>
      <path d="M24.64,122.28c-7.46,0-13.65-2.2-18.03-6.58-15.21-15.21-3.17-51.09,27.42-81.68,7.77-7.77,16.04-14.5,24.59-19.98,1.76-1.14,4.11-.62,5.24,1.14,1.13,1.76,.62,4.11-1.14,5.24-8.08,5.2-15.93,11.58-23.32,18.97-13.47,13.47-23.63,28.54-28.63,42.44-4.59,12.77-4.15,23.16,1.2,28.51,6.14,6.14,18.85,5.76,34-1.01,1.91-.85,4.16,0,5.01,1.91s0,4.16-1.91,5.01c-9,4.03-17.3,6.03-24.43,6.03Z"/>
    </g>
  </svg>
);

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Toolbar state
  const [zoom, setZoom] = useState(100);

  // Fullscreen preview dialog
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Add Media state
  const [showAddMediaPopover, setShowAddMediaPopover] = useState(false);
  const [addedMedia, setAddedMedia] = useState<Document[]>([]);
  
  // AI Panel state
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  // AI Panel connections with source side info
  interface AIConnection {
    imageId: string;
    elementId: string;
    sourceSide: "top" | "right" | "bottom" | "left";
    targetSide: "top" | "right" | "bottom" | "left";
  }
  const [aiConnections, setAIConnections] = useState<AIConnection[]>([]);
  
  // Helper to get connected image IDs (for backward compatibility)
  const connectedImageIds = new Set(aiConnections.map(c => c.imageId));
  
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
  
  // Context menu state for added media images (track by index for duplicates)
  const [mediaContextMenu, setMediaContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    mediaIndex: number | null;
  }>({ visible: false, x: 0, y: 0, mediaIndex: null });
  
  // Swap mode state - track index to swap only the specific duplicate
  const [swapMediaIndex, setSwapMediaIndex] = useState<number | null>(null);
  
  // Element bounds for drawing connection lines (n8n-style)
  const [elementBounds, setElementBounds] = useState<Record<string, ElementBounds>>({});
  
  // Alert Dialog state for save confirmation
  const [saveAlert, setSaveAlert] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({ open: false, success: false, message: "" });
  
  // Selected element state for showing connection points
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Canvas context menu state (right-click on empty canvas area)
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  
  // Element-to-element connections
  interface ElementConnection {
    sourceId: string;
    targetId: string;
    sourceSide: "top" | "right" | "bottom" | "left";
    targetSide: "top" | "right" | "bottom" | "left";
  }
  const [elementConnections, setElementConnections] = useState<ElementConnection[]>([]);
  const [pendingConnection, setPendingConnection] = useState<{ sourceId: string; sourceSide: "top" | "right" | "bottom" | "left" } | null>(null);
  
  // Visual offsets so lines end in the center of connection dots
  const CONNECTOR_SPACING = 12; // distance from element edge to dot top/left
  const CONNECTOR_SIZE = 10; // w-2.5 => 10px (tailwind)
  const getConnectorPoint = (bounds: ElementBounds, side: "top" | "right" | "bottom" | "left") => {
    switch (side) {
      case "top":
        return {
          x: bounds.x + bounds.width / 2,
          y: bounds.y - CONNECTOR_SPACING + CONNECTOR_SIZE / 2,
        };
      case "right":
        return {
          x: bounds.x + bounds.width + CONNECTOR_SPACING - CONNECTOR_SIZE / 2,
          y: bounds.y + bounds.height / 2,
        };
      case "bottom":
        return {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height + CONNECTOR_SPACING - CONNECTOR_SIZE / 2,
        };
      case "left":
      default:
        return {
          x: bounds.x - CONNECTOR_SPACING + CONNECTOR_SIZE / 2,
          y: bounds.y + bounds.height / 2,
        };
    }
  };
  
  // Drag connection state for drawing temporary connection line
  const [dragConnection, setDragConnection] = useState<{
    sourceId: string;
    sourceSide: "top" | "right" | "bottom" | "left";
    mouseX: number;
    mouseY: number;
  } | null>(null);
  
  // Check if mouse is near an element (for showing connection points)
  const getElementIdNearMouse = useCallback((mouseX: number, mouseY: number, excludeId: string): string | null => {
    const container = window.document.querySelector('[data-draggable-id="main-image"]')?.parentElement;
    const containerRect = container?.getBoundingClientRect();
    const offsetX = containerRect?.left || 0;
    const offsetY = containerRect?.top || 0;
    
    const relativeX = mouseX - offsetX;
    const relativeY = mouseY - offsetY;
    
    const proximityThreshold = 100; // pixels
    
    for (const [id, bounds] of Object.entries(elementBounds)) {
      if (id === excludeId) continue;
      
      // Check if mouse is within proximity of this element
      const nearLeft = relativeX >= bounds.x - proximityThreshold;
      const nearRight = relativeX <= bounds.x + bounds.width + proximityThreshold;
      const nearTop = relativeY >= bounds.y - proximityThreshold;
      const nearBottom = relativeY <= bounds.y + bounds.height + proximityThreshold;
      
      if (nearLeft && nearRight && nearTop && nearBottom) {
        return id;
      }
    }
    return null;
  }, [elementBounds]);
  
  // Element that should show connection points due to drag proximity
  const nearbyElementId = dragConnection 
    ? getElementIdNearMouse(dragConnection.mouseX, dragConnection.mouseY, dragConnection.sourceId)
    : null;
  
  // Handle element selection
  const handleElementSelect = useCallback((id: string) => {
    setSelectedElementId(prev => prev === id ? null : id);
  }, []);
  
  // Helper to get imageId from elementId at drag time (needs current addedMedia)
  const getImageIdFromElementIdAtDragTime = useCallback((elementId: string, currentAddedMedia: Document[]) => {
    if (elementId === "main-image") return documentId;
    if (elementId.startsWith("media-")) {
      const indexStr = elementId.replace("media-", "");
      const index = parseInt(indexStr, 10);
      if (!isNaN(index) && index >= 0 && index < currentAddedMedia.length) {
        return currentAddedMedia[index].id;
      }
    }
    return null;
  }, [documentId]);

  // Handle connection drag start
  const handleConnectionDragStart = useCallback((elementId: string, side: "top" | "right" | "bottom" | "left", e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startSourceId = elementId;
    
    setDragConnection({
      sourceId: elementId,
      sourceSide: side,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      setDragConnection(prev => prev ? {
        ...prev,
        mouseX: moveEvent.clientX,
        mouseY: moveEvent.clientY,
      } : null);
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      // Check if we're over a connection point or element
      const target = window.document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const targetConnectionPoint = target?.closest('[data-connection-side]') as HTMLElement | null;
      const explicitTargetSide = targetConnectionPoint?.getAttribute('data-connection-side') as "top" | "right" | "bottom" | "left" | null;
      const targetElement = target?.closest('[data-draggable-id]');
      
      if (targetElement) {
        const targetId = targetElement.getAttribute('data-draggable-id');
        
        if (targetId && targetId !== startSourceId) {
          // If dropping on AI panel, connect the image (and its connected cluster) to AI
          if (targetId === 'ai-panel') {
            // Get imageId using current addedMedia state
            setAddedMedia(currentAddedMedia => {
              const imageId = getImageIdFromElementIdAtDragTime(startSourceId, currentAddedMedia);
              if (imageId) {
                // Determine panel target side - prefer explicit, else relative to source
                const panelBounds = elementBounds["ai-panel"];
                const sourceBounds = elementBounds[startSourceId];
                let panelTargetSide: "top" | "right" | "bottom" | "left" = explicitTargetSide || "left";

                if (!explicitTargetSide && panelBounds && sourceBounds) {
                  const sourceCenter = { x: sourceBounds.x + sourceBounds.width / 2, y: sourceBounds.y + sourceBounds.height / 2 };
                  const targetCenter = { x: panelBounds.x + panelBounds.width / 2, y: panelBounds.y + panelBounds.height / 2 };
                  const dx = sourceCenter.x - targetCenter.x;
                  const dy = sourceCenter.y - targetCenter.y;

                  if (Math.abs(dx) > Math.abs(dy)) {
                    panelTargetSide = dx > 0 ? "right" : "left";
                  } else {
                    panelTargetSide = dy > 0 ? "bottom" : "top";
                  }
                }

                setAIConnections(prev => {
                  // Check by elementId to allow same image in different positions
                  const exists = prev.some(c => c.elementId === startSourceId);
                  if (exists) return prev;
                  return [...prev, { imageId, elementId: startSourceId, sourceSide: side, targetSide: panelTargetSide }];
                });
                // Also connect all linked elements in the cluster to the AI panel
                addAIConnectionsForCluster(startSourceId, panelTargetSide);
                setShowAIPanel(true);
              }
              return currentAddedMedia; // Don't modify state
            });
          } else {
            // Element-to-element connection
            // Determine the best target side based on relative position
            const sourceBounds = elementBounds[startSourceId];
            const targetBounds = elementBounds[targetId];
            
            if (sourceBounds && targetBounds) {
              // Prefer the explicit connection point the user hovered, otherwise fall back to geometric side
              let targetSide: "top" | "right" | "bottom" | "left" = explicitTargetSide || "left";
              
              if (!explicitTargetSide) {
                // Determine target side based on where the source is relative to target
                const sourceCenter = { x: sourceBounds.x + sourceBounds.width / 2, y: sourceBounds.y + sourceBounds.height / 2 };
                const targetCenter = { x: targetBounds.x + targetBounds.width / 2, y: targetBounds.y + targetBounds.height / 2 };
                
                const dx = sourceCenter.x - targetCenter.x;
                const dy = sourceCenter.y - targetCenter.y;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                  targetSide = dx > 0 ? "right" : "left";
                } else {
                  targetSide = dy > 0 ? "bottom" : "top";
                }
              }
              
              // Add connection (avoid duplicates)
              setElementConnections(prev => {
                const exists = prev.some(c => 
                  (c.sourceId === startSourceId && c.targetId === targetId) ||
                  (c.sourceId === targetId && c.targetId === startSourceId)
                );
                if (exists) return prev;
                return [...prev, {
                  sourceId: startSourceId,
                  targetId: targetId,
                  sourceSide: side,
                  targetSide: targetSide,
                }];
              });
            }
          }
        }
      }
      
      setDragConnection(null);
      window.document.removeEventListener('mousemove', handleMouseMove);
      window.document.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.document.addEventListener('mousemove', handleMouseMove);
    window.document.addEventListener('mouseup', handleMouseUp);
  // Note: addAIConnectionsForCluster is defined later but will be available when callback executes
  }, [documentId, elementBounds, getImageIdFromElementIdAtDragTime]);
  
  const handleBoundsChange = useCallback((id: string, bounds: ElementBounds) => {
    setElementBounds(prev => ({ ...prev, [id]: bounds }));
  }, []);
  
  // Close context menus when clicking elsewhere
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
      setMediaContextMenu(prev => ({ ...prev, visible: false }));
      setCanvasContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);
  
  // Handle right-click on generated image
  const handleContextMenu = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMediaContextMenu(prev => ({ ...prev, visible: false }));
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      imageId,
    });
  };
  
  // Handle right-click on added media image
  const handleMediaContextMenu = (e: React.MouseEvent, mediaIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(prev => ({ ...prev, visible: false }));
    setMediaContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      mediaIndex,
    });
  };
  
  // Handle right-click on canvas (empty area)
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    // Only show if clicking on the canvas surface itself, not on elements
    const target = e.target as HTMLElement;
    if (target.closest('[data-draggable-id]')) return;
    
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(prev => ({ ...prev, visible: false }));
    setMediaContextMenu(prev => ({ ...prev, visible: false }));
    setCanvasContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };
  
  // Delete added media (by index to handle duplicates)
  const handleDeleteMedia = () => {
    if (mediaContextMenu.mediaIndex === null) return;
    const indexToDelete = mediaContextMenu.mediaIndex;
    const elementIdToDelete = `media-${indexToDelete}`;
    // Remove only the specific instance by index
    setAddedMedia(prev => prev.filter((_, idx) => idx !== indexToDelete));
    // Also remove any connections for this specific element
    setAIConnections(prev => prev.filter(c => c.elementId !== elementIdToDelete));
    setElementConnections(prev => prev.filter(c => 
      c.sourceId !== elementIdToDelete && 
      c.targetId !== elementIdToDelete
    ));
    // Update element IDs for items after the deleted one
    setElementConnections(prev => prev.map(c => ({
      ...c,
      sourceId: c.sourceId.startsWith("media-") ? (() => {
        const idx = parseInt(c.sourceId.replace("media-", ""), 10);
        return !isNaN(idx) && idx > indexToDelete ? `media-${idx - 1}` : c.sourceId;
      })() : c.sourceId,
      targetId: c.targetId.startsWith("media-") ? (() => {
        const idx = parseInt(c.targetId.replace("media-", ""), 10);
        return !isNaN(idx) && idx > indexToDelete ? `media-${idx - 1}` : c.targetId;
      })() : c.targetId,
    })));
    setAIConnections(prev => prev.map(c => ({
      ...c,
      elementId: c.elementId.startsWith("media-") ? (() => {
        const idx = parseInt(c.elementId.replace("media-", ""), 10);
        return !isNaN(idx) && idx > indexToDelete ? `media-${idx - 1}` : c.elementId;
      })() : c.elementId,
    })));
    setMediaContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Duplicate added media
  const handleDuplicateMedia = () => {
    if (mediaContextMenu.mediaIndex === null) return;
    const mediaToDuplicate = addedMedia[mediaContextMenu.mediaIndex];
    if (mediaToDuplicate) {
      // Add a duplicate - same document but treated as new instance
      setAddedMedia(prev => [...prev, mediaToDuplicate]);
    }
    setMediaContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Start swap media flow
  const handleSwapMedia = () => {
    if (mediaContextMenu.mediaIndex === null) return;
    setSwapMediaIndex(mediaContextMenu.mediaIndex);
    setShowAddMediaPopover(true);
    setMediaContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Handle swap media selection (by index to handle duplicates)
  const handleSwapMediaSelect = (mediaIds: string[]) => {
    if (swapMediaIndex !== null && mediaIds.length > 0) {
      const newMediaId = mediaIds[0];
      const newMedia = allDocuments.find(doc => doc.id === newMediaId);
      const oldMedia = addedMedia[swapMediaIndex];
      if (newMedia) {
        // Replace only the specific instance by index
        setAddedMedia(prev => prev.map((m, idx) => 
          idx === swapMediaIndex ? newMedia : m
        ));
        // Update connections for the old media
        if (oldMedia) {
          setAIConnections(prev => prev.map(c => 
            c.imageId === oldMedia.id 
              ? { ...c, imageId: newMediaId, elementId: `media-${newMediaId}` }
              : c
          ));
        }
      }
    }
    setSwapMediaIndex(null);
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
          message: "Image successfully saved to Media!"
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

  // Inline title editing
  const startEditingTitle = () => {
    setEditingTitleValue(document?.title || "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveEditingTitle = async () => {
    if (!editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const newTitle = editingTitleValue.trim();
    setIsEditingTitle(false);
    try {
      await fetch(`/api/documents/${document?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      setDocument(prev => prev ? { ...prev, title: newTitle } : null);
    } catch (error) {
      console.error("Failed to save title:", error);
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitleValue("");
  };

  // Delete document
  const handleDelete = async () => {
    if (!document) return;
    try {
      await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      router.push(`/workspace/${workspaceId}`);
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
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
  const handleConnect = (
    imageId: string,
    elementId?: string,
    sourceSide?: "top" | "right" | "bottom" | "left",
    targetSide: "top" | "right" | "bottom" | "left" = "left"
  ) => {
    setAIConnections(prev => {
      const exists = prev.some(c => c.imageId === imageId);
      if (exists) return prev;
      return [...prev, { 
        imageId, 
        elementId: elementId || (imageId === document?.id ? "main-image" : `media-${imageId}`),
        sourceSide: sourceSide || "right",
        targetSide,
      }];
    });
    // Auto-open AI panel when connecting
    setShowAIPanel(true);
  };

  const handleDisconnect = (imageId: string) => {
    setAIConnections(prev => prev.filter(c => c.imageId !== imageId));
  };

  const addElementConnection = useCallback((sourceId: string, targetId: string, sourceSide: "top" | "right" | "bottom" | "left", targetSide: "top" | "right" | "bottom" | "left") => {
    setElementConnections(prev => {
      const exists = prev.some(c => 
        (c.sourceId === sourceId && c.targetId === targetId) ||
        (c.sourceId === targetId && c.targetId === sourceId)
      );
      if (exists) return prev;
      return [...prev, { sourceId, targetId, sourceSide, targetSide }];
    });
  }, []);

  const handleConnectionPointClick = useCallback((elementId: string, imageId: string, _isAIConnected: boolean, side: "top" | "right" | "bottom" | "left") => {
    if (pendingConnection) {
      // Finish connection to another element
      if (pendingConnection.sourceId !== elementId) {
        addElementConnection(pendingConnection.sourceId, elementId, pendingConnection.sourceSide, side);
      }
      setPendingConnection(null);
    } else {
      // Start connection from this element
      setPendingConnection({ sourceId: elementId, sourceSide: side });
    }
  }, [pendingConnection, handleDisconnect, addElementConnection]);

  // Get connected images for AI panel - traverse element connections to find all images in cluster
  const getConnectedImages = () => {
    const result: { id: string; title: string; previewUrl?: string; elementId: string }[] = [];
    const seenElementIds = new Set<string>();
    
    // For each AI connection, traverse the element graph to find all connected elements
    for (const conn of aiConnections) {
      // BFS to find all elements connected to this AI-connected element
      const queue = [conn.elementId];
      while (queue.length > 0) {
        const currentElementId = queue.shift()!;
        if (seenElementIds.has(currentElementId)) continue;
        seenElementIds.add(currentElementId);
        
        // Find the actual image data for this element
        let imgData: Document | undefined;
        if (currentElementId === "main-image") {
          imgData = document || undefined;
        } else if (currentElementId.startsWith("media-")) {
          const indexStr = currentElementId.replace("media-", "");
          const index = parseInt(indexStr, 10);
          if (!isNaN(index) && index >= 0 && index < addedMedia.length) {
            imgData = addedMedia[index];
          }
        }
        
        if (imgData) {
          result.push({
            id: imgData.id,
            title: imgData.title,
            previewUrl: imgData.previewUrl,
            elementId: currentElementId,
          });
        }
        
        // Add connected elements to queue
        for (const elemConn of elementConnections) {
          if (elemConn.sourceId === currentElementId && !seenElementIds.has(elemConn.targetId)) {
            queue.push(elemConn.targetId);
          }
          if (elemConn.targetId === currentElementId && !seenElementIds.has(elemConn.sourceId)) {
            queue.push(elemConn.sourceId);
          }
        }
      }
    }
    
    return result;
  };

  const elementHasAnyConnection = useCallback((elementId: string, imageId: string) => {
    if (connectedImageIds.has(imageId)) return true;
    return elementConnections.some(c => c.sourceId === elementId || c.targetId === elementId);
  }, [connectedImageIds, elementConnections]);
  
  const getImageIdFromElementId = useCallback((elementId: string) => {
    if (elementId === "main-image") return document?.id || null;
    // Handle indexed media elements: media-0, media-1, etc.
    if (elementId.startsWith("media-")) {
      const indexStr = elementId.replace("media-", "");
      const index = parseInt(indexStr, 10);
      if (!isNaN(index) && index >= 0 && index < addedMedia.length) {
        return addedMedia[index].id;
      }
      // Fallback for legacy format (media-uuid)
      return indexStr;
    }
    if (elementId.startsWith("output-")) return elementId.replace("output-", "");
    return null;
  }, [document?.id, addedMedia]);
  
  const getElementIdForImage = useCallback((imageId: string, index?: number) => {
    if (imageId === document?.id) return "main-image";
    // Use index-based ID for addedMedia to support duplicates
    if (index !== undefined) return `media-${index}`;
    // Fallback: find first matching index
    const mediaIndex = addedMedia.findIndex(m => m.id === imageId);
    return mediaIndex >= 0 ? `media-${mediaIndex}` : `media-${imageId}`;
  }, [document?.id, addedMedia]);
  
  const computeRelativeSide = useCallback((source: ElementBounds, target: ElementBounds): "top" | "right" | "bottom" | "left" => {
    const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    const dx = sourceCenter.x - targetCenter.x;
    const dy = sourceCenter.y - targetCenter.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    }
    return dy > 0 ? "bottom" : "top";
  }, []);
  
  // This function is intentionally empty - we don't want to create separate AI connections
  // for each element in a cluster. The cluster is already connected via element-to-element
  // connections, and getConnectedImages will traverse those to find all images.
  const addAIConnectionsForCluster = useCallback((
    _startElementId: string,
    _explicitTargetSide: "top" | "right" | "bottom" | "left" | null
  ) => {
    // No-op: We only need the single AI connection that was explicitly created.
    // The getConnectedImages function will traverse element connections to find all images.
  }, []);

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
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/workspace/${workspaceId}`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span>{workspaceName}</span>
            </Link>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-1 text-gray-700">
              <ImageIcon className="h-3.5 w-3.5" />
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={saveEditingTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditingTitle();
                    if (e.key === "Escape") cancelEditingTitle();
                  }}
                  className="font-medium bg-white border border-[var(--accent-primary)] rounded px-1 py-0.5 outline-none min-w-[100px]"
                />
              ) : (
                <span 
                  className="font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                  onClick={startEditingTitle}
                  title="Click to rename"
                >
                  {document.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Edited {new Date(document.created_at).toLocaleDateString()}
          </span>
          <button
            type="button"
            onClick={toggleStar}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Star className={`h-4 w-4 ${document.is_starred ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
          </button>
          
          <ItemHeaderActions
            itemId={documentId}
            itemType="document"
            itemTitle={document.title}
            workspaceId={workspaceId}
            isStarred={document.is_starred || false}
            createdAt={document.created_at}
            onToggleStar={toggleStar}
            onStartRename={startEditingTitle}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden document-canvas-surface">
          {/* Floating Top Toolbar - Fixed position above canvas */}
          <DocumentFloatingToolbar
            zoom={zoom}
            onDownload={handleDownload}
            onOpenPreview={() => setIsPreviewOpen(true)}
          />
          {/* Document Preview - Scrollable area */}
          <div className="flex-1 overflow-auto relative">
            <div 
              className="p-8 relative"
              style={{ 
                transform: `scale(${zoom / 100})`, 
                transformOrigin: "top left",
                width: `${100 / (zoom / 100)}%`,
                height: `${100 / (zoom / 100)}%`,
                minWidth: `${5000 * (zoom / 100)}px`,
                minHeight: `${5000 * (zoom / 100)}px`
              }}
            >

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent
                className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-4 overflow-hidden bg-black/95 border-none"
                showCloseButton={false}
              >
                <DialogTitle className="sr-only">Media preview</DialogTitle>
                {/* Custom close button for dark background */}
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
                >
                  <X className="h-5 w-5 text-white" />
                  <span className="sr-only">Schließen</span>
                </button>
                <div className="flex items-center justify-center">
                  {document.mime_type?.startsWith("image/") && document.previewUrl ? (
                    <img
                      src={document.previewUrl}
                      alt={document.title}
                      className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg"
                    />
                  ) : document.mime_type?.startsWith("video/") && document.previewUrl ? (
                    <video
                      src={document.previewUrl}
                      controls
                      playsInline
                      className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg"
                    />
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>

            {/* n8n-style Canvas: Freely draggable elements with curved connection lines */}
            <div 
              className="relative min-w-[5000px] min-h-[5000px]"
              onContextMenu={handleCanvasContextMenu}
            >
              {/* SVG Layer for Curved Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" style={{ overflow: 'visible' }}>
                <defs>
                  {/* Green arrow for input connections */}
                  <marker
                    id="arrow-green-n8n"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
                  </marker>
                  {/* Purple arrow for output connections */}
                  <marker
                    id="arrow-purple-n8n"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#8b5cf6" />
                  </marker>
                </defs>
                {/* Draw curved bezier lines from each connected image to AI panel */}
                {/* Input connections: Images → AI Panel */}
                {showAIPanel && elementBounds["ai-panel"] && aiConnections.map((conn) => {
                  const imageBounds = elementBounds[conn.elementId];
                  const panelBounds = elementBounds["ai-panel"];
                  
                  if (!imageBounds || !panelBounds) return null;
                  const targetSide = conn.targetSide || "left";
                  
                  // Calculate start point based on source side
                  const { x: startX, y: startY } = getConnectorPoint(imageBounds, conn.sourceSide);
                  let controlX1 = startX, controlY1 = startY;
                  const controlDistance = 60;
                  
                  switch (conn.sourceSide) {
                    case "top":
                      controlY1 = startY - controlDistance;
                      break;
                    case "right":
                      controlX1 = startX + controlDistance;
                      controlY1 = startY;
                      break;
                    case "bottom":
                      controlY1 = startY + controlDistance;
                      break;
                    case "left":
                      controlX1 = startX - controlDistance;
                      controlY1 = startY;
                      break;
                  }
                  
                  // End point based on target side of AI panel
                  const { x: endX, y: endY } = getConnectorPoint(panelBounds, targetSide);
                  let controlX2 = endX, controlY2 = endY;
                  switch (targetSide) {
                    case "top":
                      controlY2 = endY - controlDistance;
                      break;
                    case "right":
                      controlX2 = endX + controlDistance;
                      controlY2 = endY;
                      break;
                    case "bottom":
                      controlY2 = endY + controlDistance;
                      break;
                    case "left":
                    default:
                      controlX2 = endX - controlDistance;
                      controlY2 = endY;
                      break;
                  }
                  
                  // Create bezier path with proper control points
                  const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                  
                  return (
                    <path
                      key={`input-${conn.imageId}`}
                      d={path}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      markerEnd="url(#arrow-green-n8n)"
                    />
                  );
                })}
                
                {/* Element-to-element connections */}
                {elementConnections.map((conn, index) => {
                  const sourceBounds = elementBounds[conn.sourceId];
                  const targetBounds = elementBounds[conn.targetId];
                  
                  if (!sourceBounds || !targetBounds) return null;
                  
                  // Calculate start point based on source side
                  const { x: startX, y: startY } = getConnectorPoint(sourceBounds, conn.sourceSide);
                  let controlX1 = startX, controlY1 = startY;
                  const controlDistance = 60;
                  
                  switch (conn.sourceSide) {
                    case "top":
                      controlY1 = startY - controlDistance;
                      break;
                    case "right":
                      controlX1 = startX + controlDistance;
                      controlY1 = startY;
                      break;
                    case "bottom":
                      controlY1 = startY + controlDistance;
                      break;
                    case "left":
                      controlX1 = startX - controlDistance;
                      controlY1 = startY;
                      break;
                  }
                  
                  // Calculate end point based on target side
                  const { x: endX, y: endY } = getConnectorPoint(targetBounds, conn.targetSide);
                  let controlX2 = endX, controlY2 = endY;
                  
                  switch (conn.targetSide) {
                    case "top":
                      controlY2 = endY - controlDistance;
                      break;
                    case "right":
                      controlX2 = endX + controlDistance;
                      controlY2 = endY;
                      break;
                    case "bottom":
                      controlY2 = endY + controlDistance;
                      break;
                    case "left":
                      controlX2 = endX - controlDistance;
                      controlY2 = endY;
                      break;
                  }
                  
                  const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                  
                  return (
                    <path
                      key={`elem-conn-${index}`}
                      d={path}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
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
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      markerEnd="url(#arrow-purple-n8n)"
                    />
                  );
                })}
                
                {/* Temporary drag connection line */}
                {dragConnection && elementBounds[dragConnection.sourceId] && (() => {
                  const sourceBounds = elementBounds[dragConnection.sourceId];
                  const { x: startX, y: startY } = getConnectorPoint(sourceBounds, dragConnection.sourceSide);
                  let controlX1 = startX, controlY1 = startY;
                  
                  // Calculate start point and control point direction based on side
                  const controlDistance = 60;
                  switch (dragConnection.sourceSide) {
                    case "top":
                      controlY1 = startY - controlDistance;
                      break;
                    case "right":
                      controlX1 = startX + controlDistance;
                      controlY1 = startY;
                      break;
                    case "bottom":
                      controlY1 = startY + controlDistance;
                      break;
                    case "left":
                      controlX1 = startX - controlDistance;
                      controlY1 = startY;
                      break;
                  }
                  
                  // Get container offset for mouse position
                  const container = window.document.querySelector('[data-draggable-id="main-image"]')?.parentElement;
                  const containerRect = container?.getBoundingClientRect();
                  const offsetX = containerRect?.left || 0;
                  const offsetY = containerRect?.top || 0;
                  
                  const endX = dragConnection.mouseX - offsetX;
                  const endY = dragConnection.mouseY - offsetY;
                  
                  // Control point 2 - towards the end point
                  const controlX2 = endX;
                  const controlY2 = endY;
                  
                  // Create bezier path with proper control points
                  const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                  
                  return (
                    <g>
                      <path
                        d={path}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        style={{ pointerEvents: "none" }}
                      />
                      {/* Arrow head at end */}
                      <circle
                        cx={endX}
                        cy={endY}
                        r="4"
                        fill="#10b981"
                        style={{ pointerEvents: "none" }}
                      />
                    </g>
                  );
                })()}
              </svg>

              {/* Main Document - Draggable */}
              <DraggableElement
                id="main-image"
                initialX={100}
                initialY={80}
                onBoundsChange={handleBoundsChange}
                showDragIndicator={false}
                isSelected={selectedElementId === "main-image"}
                onSelect={handleElementSelect}
              >
                <div className="relative">
                  {document.mime_type?.startsWith("image/") && document.previewUrl ? (
                    <ImageWithConnector
                      id={document.id}
                      src={document.previewUrl}
                      alt={document.title}
                      isConnected={connectedImageIds.has(document.id)}
                      isSelected={true} // always show connection points
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onConnectionPointClick={(side) =>
                        handleConnectionPointClick(
                          "main-image",
                          document.id,
                          connectedImageIds.has(document.id),
                          side
                        )
                      }
                      onConnectionDragStart={(side, e) => handleConnectionDragStart("main-image", side, e)}
                    />
                  ) : document.mime_type?.startsWith("video/") && document.previewUrl ? (
                    <ResizableVideo
                      src={document.previewUrl}
                      title={document.title}
                      onDoubleClick={() => setIsPreviewOpen(true)}
                    />
                  ) : document.mime_type === "application/pdf" && document.previewUrl ? (
                    <ResizablePdfViewer 
                      url={document.previewUrl} 
                      title={document.title}
                      onDoubleClick={() => setIsPreviewOpen(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground py-16 bg-white rounded-xl shadow-lg px-8">
                      <File className="h-24 w-24" />
                      <p>Preview not available</p>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)]"
                      >
                        Download File
                      </button>
                    </div>
                  )}
                </div>
              </DraggableElement>

              {/* Added Media - Each as separate draggable element with unique index-based IDs */}
              {addedMedia.map((media, index) => {
                const elementId = `media-${index}`;
                // Check if THIS specific element is connected to AI
                const isElementConnectedToAI = aiConnections.some(c => c.elementId === elementId);
                return (
                <DraggableElement
                  key={`media-instance-${index}`}
                  id={elementId}
                  initialX={100}
                  initialY={450 + (index * 350)}
                  onBoundsChange={handleBoundsChange}
                  showDragIndicator={false}
                  isSelected={selectedElementId === elementId}
                  onSelect={handleElementSelect}
                >
                  <div 
                    className="relative"
                    onContextMenu={(e) => handleMediaContextMenu(e, index)}
                  >
                    {media.mime_type?.startsWith("image/") && media.previewUrl ? (
                      <ImageWithConnector
                        id={media.id}
                        src={media.previewUrl}
                        alt={media.title}
                        isConnected={isElementConnectedToAI}
                        isSelected={true} // always show connection points
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        onConnectionPointClick={(side) =>
                          handleConnectionPointClick(
                            elementId,
                            media.id,
                            isElementConnectedToAI,
                            side
                          )
                        }
                        onConnectionDragStart={(side, e) => handleConnectionDragStart(elementId, side, e)}
                      />
                    ) : media.mime_type?.startsWith("video/") && media.previewUrl ? (
                      <ResizableVideo
                        src={media.previewUrl}
                        title={media.title}
                      />
                    ) : null}
                  </div>
                </DraggableElement>
              );})}

              {/* Draggable AI Panel Node */}
              {showAIPanel && (
                <DraggableElement
                  id="ai-panel"
                  initialX={700}
                  initialY={200}
                  onBoundsChange={handleBoundsChange}
                  showDragIndicator={false}
                >
                  <AIImagePanel
                    isOpen={showAIPanel}
                    onClose={() => {
                      setShowAIPanel(false);
                      setAIConnections([]);
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
                  <ResizableGeneratedImage
                    id={genImg.id}
                    url={genImg.url}
                    title={genImg.title}
                    onContextMenu={(e) => handleContextMenu(e, genImg.id)}
                  />
                </DraggableElement>
              ))}
              
            </div>
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
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      {/* Add Media Popover */}
      <AddMediaPopover
        workspaceId={workspaceId || ""}
        isOpen={showAddMediaPopover}
        onClose={() => {
          setShowAddMediaPopover(false);
          setSwapMediaIndex(null);
        }}
        onAddMedia={swapMediaIndex !== null ? handleSwapMediaSelect : handleAddMedia}
        excludeIds={[document.id, ...addedMedia.map(m => m.id)]}
        singleSelect={swapMediaIndex !== null}
        title={swapMediaIndex !== null ? "Bild Tauschen" : undefined}
      />

      {/* Context Menu for Added Media Images */}
      {mediaContextMenu.visible && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-[9999]"
          style={{ left: mediaContextMenu.x, top: mediaContextMenu.y }}
        >
          <button
            type="button"
            onClick={handleSwapMedia}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
            <span>Bild Tauschen</span>
          </button>
          <button
            type="button"
            onClick={handleDuplicateMedia}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-gray-500" />
            <span>Duplizieren</span>
          </button>
          <div className="border-t border-gray-200 my-0.5" />
          <button
            type="button"
            onClick={handleDeleteMedia}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-500" />
            <span>Löschen</span>
          </button>
        </div>
      )}

      {/* Custom Context Menu for Generated Images - Outside all containers */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-[9999]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={handleSaveGeneratedImage}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>Speichern</span>
          </button>
          <div className="border-t border-gray-200 my-0.5" />
          <button
            type="button"
            onClick={handleDeleteGeneratedImage}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-500" />
            <span>Löschen</span>
          </button>
        </div>
      )}

      {/* Canvas Context Menu - Right-click on empty canvas area */}
      {canvasContextMenu.visible && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-[9999]"
          style={{ left: canvasContextMenu.x, top: canvasContextMenu.y }}
        >
          <button
            type="button"
            onClick={() => {
              setShowAddMediaPopover(true);
              setCanvasContextMenu(prev => ({ ...prev, visible: false }));
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ImagePlus className="h-4 w-4 text-gray-500" />
            <span>Add Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAIPanel(true);
              setCanvasContextMenu(prev => ({ ...prev, visible: false }));
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <AIIcon className="h-4 w-4 text-gray-500" />
            <span>Create Image</span>
          </button>
        </div>
      )}

      {/* Save Alert Dialog */}
      <AlertDialog open={saveAlert.open} onOpenChange={(open) => setSaveAlert(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={saveAlert.success ? "text-[var(--accent-primary-light)]" : "text-red-600"}>
              {saveAlert.success ? "Success!" : "Error"}
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
