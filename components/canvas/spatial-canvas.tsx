"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  addEdge,
  BackgroundVariant,
  OnConnect,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

import { useCanvasStore } from "@/lib/canvas/store";
import { CanvasNode, CanvasConnection, CanvasNodeData, ConnectionStyles } from "@/lib/canvas/types";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { useSocialUrlPaste } from "@/hooks/use-social-url-paste";
import { AddMediaPopover } from "@/components/documents/add-media-popover";
import { AddVideoPopover } from "@/components/documents/add-video-popover";
import { AddLinkPopover } from "@/components/documents/add-link-popover";

// Components
import { CanvasNodePalette } from "./canvas-node-palette";
import { DraggableNodePalette } from "./draggable-node-palette";
import { CanvasContextMenu } from "./canvas-context-menu";
import { CanvasToolbar } from "./canvas-toolbar";
import { 
  NodeInspector, 
  CommandPalette, 
  QuickAddMenu, 
  DropZoneOverlay, 
  PresenceIndicator, 
  HistoryPanel,
  KeyboardShortcutsHelp,
  NodeSearch,
  CanvasSettings,
  CanvasToolbarActions,
  IntegratedZoomControls,
} from "./panels";

interface SpatialCanvasProps {
  canvasId: string;
  workspaceId: string;
  initialNodes?: CanvasNode[];
  initialEdges?: CanvasConnection[];
  onSave?: (nodes: CanvasNode[], edges: CanvasConnection[]) => void;
}

function SpatialCanvasFlow({
  canvasId,
  workspaceId,
  initialNodes = [],
  initialEdges = [],
  onSave,
}: SpatialCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
  } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNodeInspector, setShowNodeInspector] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showNodeSearch, setShowNodeSearch] = useState(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);

  const [showAddImagePopover, setShowAddImagePopover] = useState(false);
  const [pendingImagePosition, setPendingImagePosition] = useState<{ x: number; y: number } | null>(null);
  const [showAddVideoPopover, setShowAddVideoPopover] = useState(false);
  const [pendingVideoPosition, setPendingVideoPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAddLinkPopover, setShowAddLinkPopover] = useState(false);
  const [pendingLinkPosition, setPendingLinkPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "pan" | "shape">("select");
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  
  // Shape drawing state
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartPos, setShapeStartPos] = useState<{ x: number; y: number } | null>(null);
  const [shapeCurrentPos, setShapeCurrentPos] = useState<{ x: number; y: number } | null>(null);

  // Store
  const {
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    onNodesChange,
    onEdgesChange,
    addEdge: storeAddEdge,
    addNode,
    setViewport,
    clearSelection,
    setSelectedNodes,
    loadCanvas,
    setCanvasId,
    setWorkspaceId,
    pushHistory,
    settings: storeSettings,
    addNodeToFolder,
    getFolderAtPosition,
  } = useCanvasStore();

  // Settings with defaults
  const settings = {
    showGrid: storeSettings?.showGrid ?? true,
    snapToGrid: storeSettings?.snapToGrid ?? true,
    gridSize: storeSettings?.gridSize ?? 16,
    showMinimap: storeSettings?.showMinimap ?? true,
    backgroundColor: storeSettings?.backgroundColor ?? '#f9fafb',
  };

  // Social URL paste/drop handler
  useSocialUrlPaste(reactFlowWrapper, { enabled: true });

  // Initialize canvas
  useEffect(() => {
    setCanvasId(canvasId);
    setWorkspaceId(workspaceId);
    
    if (initialNodes.length > 0 || initialEdges.length > 0) {
      // Set zIndex for nodes - PostIt should always be on top
      const nodesWithZIndex = initialNodes.map(node => {
        if (node.type === 'postit') {
          return { ...node, zIndex: 1000 };
        }
        // Other content nodes get lower zIndex
        if (node.type === 'image' || node.type === 'video' || node.type === 'document' || node.type === 'url' || node.type === 'note') {
          return { ...node, zIndex: node.zIndex ?? 1 };
        }
        return node;
      });
      
      loadCanvas({
        nodes: nodesWithZIndex,
        edges: initialEdges,
        canvasId,
        workspaceId,
      });
    }
    
    // Push initial state to history
    pushHistory();
  }, [canvasId, workspaceId]);

  // Auto-save effect
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (onSave && (nodes.length > 0 || edges.length > 0)) {
        onSave(nodes, edges);
      }
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(saveTimeout);
  }, [nodes, edges, onSave]);

  // ================================================================
  // EVENT HANDLERS
  // ================================================================

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const edge: CanvasConnection = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        type: "ai-connection",
        data: {
          connectionType: "reference",
          label: "",
          color: ConnectionStyles.reference.color,
          style: "solid",
          animated: false,
        },
      } as CanvasConnection;

      storeAddEdge(edge);
    },
    [storeAddEdge]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow-type");
      const nodeDataStr = event.dataTransfer.getData("application/reactflow-data");

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // For image nodes, open a picker first (select existing workspace media)
      if (type === 'image') {
        setPendingImagePosition(position);
        setShowAddImagePopover(true);
        return;
      }

      // For video nodes, open a picker first (select existing workspace videos)
      if (type === 'video') {
        setPendingVideoPosition(position);
        setShowAddVideoPopover(true);
        return;
      }

      // For URL/Link nodes, open a picker first (select existing workspace links or create new)
      if (type === 'url') {
        setPendingLinkPosition(position);
        setShowAddLinkPopover(true);
        return;
      }

      let nodeData: Partial<CanvasNodeData> = {};
      if (nodeDataStr) {
        try {
          nodeData = JSON.parse(nodeDataStr);
        } catch (e) {
          console.error("Failed to parse node data:", e);
        }
      }

      // Set default properties based on node type
      let typeSpecificData: Record<string, unknown> = {};
      
      if (type === 'social-post') {
        typeSpecificData = {
          url: '',
          status: 'idle',
          displayMode: 'full',
          theme: 'dark',
          showMetrics: true,
        };
      } else if (type === 'note') {
        typeSpecificData = {
          content: '',
          backgroundColor: '#fef3c7',
        };
      } else if (type === 'postit') {
        typeSpecificData = {
          items: [],
          backgroundColor: 'green',
        };
      } else if (type === 'url') {
        typeSpecificData = {
          url: '',
        };
      }

      // Set zIndex based on node type - PostIt on top, others below
      const getZIndex = () => {
        if (type === 'postit') return 1000;
        if (['image', 'video', 'document', 'url', 'note', 'social-post'].includes(type)) return 1;
        return undefined;
      };

      const newNode: CanvasNode = {
        id: `${type}-${Date.now()}`,
        type: type,
        position,
        zIndex: getZIndex(),
        data: {
          type: type as CanvasNodeData["type"],
          label: nodeData.label || `New ${type}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "", // Will be set by API
          ...typeSpecificData,
          ...nodeData,
        } as CanvasNodeData,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const handleAddWorkspaceImagesToCanvas = useCallback(
    (docs: Array<{ id: string; title: string; mime_type: string; previewUrl?: string; file_size?: number }>) => {
      if (!pendingImagePosition) return;

      docs.forEach((doc, index) => {
        const url = doc.previewUrl || '';
        const position = {
          x: pendingImagePosition.x + index * 40,
          y: pendingImagePosition.y + index * 40,
        };

        // Load dimensions so the node can match the image aspect ratio
        const img = new Image();
        img.onload = () => {
          addNode({
            id: `image-${Date.now()}-${index}`,
            type: 'image',
            position,
            zIndex: 1, // Keep images below PostIt nodes
            data: {
              type: 'image',
              label: doc.title || 'Image',
              url,
              thumbnail: url,
              width: img.naturalWidth || img.width || 0,
              height: img.naturalHeight || img.height || 0,
              fileSize: doc.file_size || 0,
              mimeType: doc.mime_type || 'image/*',
              mediaLibraryId: doc.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: '',
            } as any,
          });
        };
        img.onerror = () => {
          addNode({
            id: `image-${Date.now()}-${index}`,
            type: 'image',
            position,
            zIndex: 1, // Keep images below PostIt nodes
            data: {
              type: 'image',
              label: doc.title || 'Image',
              url,
              thumbnail: url,
              width: 0,
              height: 0,
              fileSize: doc.file_size || 0,
              mimeType: doc.mime_type || 'image/*',
              mediaLibraryId: doc.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: '',
            } as any,
          });
        };
        img.src = url;
      });

      setPendingImagePosition(null);
      setShowAddImagePopover(false);
    },
    [addNode, pendingImagePosition]
  );

  const handleAddWorkspaceVideosToCanvas = useCallback(
    (docs: Array<{ id: string; title: string; mime_type: string; previewUrl?: string; file_size?: number }>) => {
      if (!pendingVideoPosition) return;

      docs.forEach((doc, index) => {
        const url = doc.previewUrl || '';
        const position = {
          x: pendingVideoPosition.x + index * 40,
          y: pendingVideoPosition.y + index * 40,
        };

        addNode({
          id: `video-${Date.now()}-${index}`,
          type: 'video',
          position,
          zIndex: 1,
          data: {
            type: 'video',
            label: doc.title || 'Video',
            url,
            thumbnail: url,
            duration: 0,
            width: 0,
            height: 0,
            fileSize: doc.file_size || 0,
            mimeType: doc.mime_type || 'video/*',
            mediaLibraryId: doc.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: '',
          } as any,
        });
      });

      setPendingVideoPosition(null);
      setShowAddVideoPopover(false);
    },
    [addNode, pendingVideoPosition]
  );

  const handleAddWorkspaceLinksToCanvas = useCallback(
    (links: Array<{ id: string; url: string; title: string; description?: string; thumbnail_url?: string; link_type?: string }>) => {
      if (!pendingLinkPosition) return;

      links.forEach((link, index) => {
        const position = {
          x: pendingLinkPosition.x + index * 40,
          y: pendingLinkPosition.y + index * 40,
        };

        addNode({
          id: `url-${Date.now()}-${index}`,
          type: 'url',
          position,
          zIndex: 1,
          data: {
            type: 'url',
            label: link.title || 'Link',
            url: link.url,
            title: link.title,
            description: link.description,
            thumbnail: link.thumbnail_url,
            linkType: link.link_type,
            workspaceLinkId: link.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: '',
          } as any,
        });
      });

      setPendingLinkPosition(null);
      setShowAddLinkPopover(false);
    },
    [addNode, pendingLinkPosition]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
    setContextMenu(null);
  }, [clearSelection]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      // Multi-select with shift key
      if (event.shiftKey) {
        setSelectedNodes(
          selectedNodeIds.includes(node.id)
            ? selectedNodeIds.filter((id) => id !== node.id)
            : [...selectedNodeIds, node.id]
        );
      } else {
        setSelectedNodes([node.id]);
      }
    },
    [selectedNodeIds, setSelectedNodes]
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const openImagePickerAtCanvasCenter = useCallback(() => {
    const el = reactFlowWrapper.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const position = screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    setPendingImagePosition(position);
    setShowAddImagePopover(true);
  }, [screenToFlowPosition]);

  // Get center position for creating nodes
  const getCanvasCenterPosition = useCallback(() => {
    const el = reactFlowWrapper.current;
    if (!el) return { x: 0, y: 0 };

    const rect = el.getBoundingClientRect();
    return screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [screenToFlowPosition]);

  // Toolbar action handlers
  const handleInsertFromWorkspace = useCallback(() => {
    setShowCommandPalette(true);
  }, []);

  const handleCreateNote = useCallback(() => {
    const position = getCanvasCenterPosition();
    const newNode: CanvasNode = {
      id: `note-${Date.now()}`,
      type: 'note',
      position,
      zIndex: 1,
      data: {
        type: 'note',
        label: 'New Note',
        content: '',
        backgroundColor: '#fef3c7',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
      } as CanvasNodeData,
    };
    addNode(newNode);
    setSelectedNodes([newNode.id]);
  }, [getCanvasCenterPosition, addNode, setSelectedNodes]);

  const handleOpenChat = useCallback(() => {
    const position = getCanvasCenterPosition();
    const newNode: CanvasNode = {
      id: `ai-chat-${Date.now()}`,
      type: 'ai-chat',
      position,
      zIndex: 1,
      data: {
        type: 'ai-chat',
        label: 'AI Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
      } as CanvasNodeData,
    };
    addNode(newNode);
    setSelectedNodes([newNode.id]);
  }, [getCanvasCenterPosition, addNode, setSelectedNodes]);

  const handleCreateText = useCallback(() => {
    const position = getCanvasCenterPosition();
    const newNode: CanvasNode = {
      id: `note-${Date.now()}`,
      type: 'note',
      position,
      zIndex: 1,
      data: {
        type: 'note',
        label: 'Text',
        content: '',
        backgroundColor: '#ffffff',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
      } as CanvasNodeData,
    };
    addNode(newNode);
    setSelectedNodes([newNode.id]);
  }, [getCanvasCenterPosition, addNode, setSelectedNodes]);

  const handleStartDrawing = useCallback(() => {
    // For now, create a note as a placeholder for drawing functionality
    const position = getCanvasCenterPosition();
    const newNode: CanvasNode = {
      id: `note-${Date.now()}`,
      type: 'note',
      position,
      zIndex: 1,
      data: {
        type: 'note',
        label: 'Drawing',
        content: '✏️ Drawing placeholder - coming soon!',
        backgroundColor: '#f3e8ff',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
      } as CanvasNodeData,
    };
    addNode(newNode);
    setSelectedNodes([newNode.id]);
  }, [getCanvasCenterPosition, addNode, setSelectedNodes]);

  const handleCreateArrow = useCallback(() => {
    // Create two connected nodes to demonstrate arrow functionality
    const centerPosition = getCanvasCenterPosition();
    const startPosition = { x: centerPosition.x - 100, y: centerPosition.y };
    const endPosition = { x: centerPosition.x + 100, y: centerPosition.y };
    
    const startNode: CanvasNode = {
      id: `postit-start-${Date.now()}`,
      type: 'postit',
      position: startPosition,
      zIndex: 1000,
      data: {
        type: 'postit',
        label: 'Start',
        items: [],
        backgroundColor: 'blue',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
      } as CanvasNodeData,
    };
    
    const endNode: CanvasNode = {
      id: `postit-end-${Date.now()}`,
      type: 'postit',
      position: endPosition,
      zIndex: 1000,
      data: {
        type: 'postit',
        label: 'End',
        items: [],
        backgroundColor: 'green',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
      } as CanvasNodeData,
    };
    
    addNode(startNode);
    addNode(endNode);
    
    // Create an edge between them
    const edge: CanvasConnection = {
      id: `edge-${startNode.id}-${endNode.id}`,
      source: startNode.id,
      target: endNode.id,
      type: 'ai-connection',
      data: {
        connectionType: 'reference',
        label: '',
        color: '#6366f1',
        style: 'solid',
        animated: false,
      },
    } as CanvasConnection;
    
    storeAddEdge(edge);
    setSelectedNodes([startNode.id, endNode.id]);
  }, [getCanvasCenterPosition, addNode, storeAddEdge, setSelectedNodes]);

  const handleCreateShape = useCallback(() => {
    // Enable shape drawing mode
    setActiveTool("shape");
  }, []);

  // Shape drawing handlers
  const handleShapeMouseDown = useCallback((event: React.MouseEvent) => {
    if (activeTool !== "shape") return;
    
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (!rect) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setIsDrawingShape(true);
    setShapeStartPos(position);
    setShapeCurrentPos(position);
  }, [activeTool, screenToFlowPosition]);

  const handleShapeMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawingShape || activeTool !== "shape") return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setShapeCurrentPos(position);
  }, [isDrawingShape, activeTool, screenToFlowPosition]);

  const handleShapeMouseUp = useCallback(() => {
    if (!isDrawingShape || !shapeStartPos || !shapeCurrentPos) {
      setIsDrawingShape(false);
      return;
    }

    const minX = Math.min(shapeStartPos.x, shapeCurrentPos.x);
    const minY = Math.min(shapeStartPos.y, shapeCurrentPos.y);
    const width = Math.abs(shapeCurrentPos.x - shapeStartPos.x);
    const height = Math.abs(shapeCurrentPos.y - shapeStartPos.y);

    // Only create if size is reasonable
    if (width > 20 && height > 20) {
      const newNode: CanvasNode = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        position: { x: minX, y: minY },
        zIndex: 1,
        data: {
          type: 'shape',
          label: 'Shape',
          shapeType: 'rectangle',
          width,
          height,
          backgroundColor: '#1f2937',
          hasShadow: false,
          hasRoundedCorners: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '',
        } as CanvasNodeData,
      };
      addNode(newNode);
      setSelectedNodes([newNode.id]);
    }

    // Reset drawing state
    setIsDrawingShape(false);
    setShapeStartPos(null);
    setShapeCurrentPos(null);
    setActiveTool("select");
  }, [isDrawingShape, shapeStartPos, shapeCurrentPos, addNode, setSelectedNodes]);

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  // Handle node drag stop - check if dropped on a folder
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, node) => {
      // Don't allow folders to be dropped into folders
      if (node.type === 'folder') return;
      
      // Check if node was dropped on a folder
      const folder = getFolderAtPosition(
        node.position.x + 50,
        node.position.y + 50,
        node.id
      );
      
      if (folder) {
        // Add all selected nodes to the folder (multi-select support)
        const nodesToAdd = selectedNodeIds.length > 0 && selectedNodeIds.includes(node.id)
          ? selectedNodeIds.filter(id => {
              const n = nodes.find(n => n.id === id);
              return n && n.type !== 'folder';
            })
          : [node.id];
        
        nodesToAdd.forEach(nodeId => {
          addNodeToFolder(nodeId, folder.id);
        });
      }
    },
    [getFolderAtPosition, addNodeToFolder, selectedNodeIds, nodes]
  );

  // ================================================================
  // KEYBOARD SHORTCUTS
  // ================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if focus is not in an input or editable element
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]') ||
        target.closest('.ProseMirror') ||
        target.closest('.tiptap')
      ) {
        return;
      }

      const { undo, redo, copyNodes, pasteNodes, deleteNodes, selectAll } = useCanvasStore.getState();

      // Undo: Cmd/Ctrl + Z
      if ((event.metaKey || event.ctrlKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if ((event.metaKey || event.ctrlKey) && event.key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
      }

      // Copy: Cmd/Ctrl + C
      if ((event.metaKey || event.ctrlKey) && event.key === "c") {
        event.preventDefault();
        copyNodes(selectedNodeIds);
      }

      // Paste: Cmd/Ctrl + V
      if ((event.metaKey || event.ctrlKey) && event.key === "v") {
        event.preventDefault();
        pasteNodes();
      }

      // Delete: Backspace or Delete
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        deleteNodes(selectedNodeIds);
      }

      // Select All: Cmd/Ctrl + A
      if ((event.metaKey || event.ctrlKey) && event.key === "a") {
        event.preventDefault();
        selectAll();
      }

      // Escape: Clear selection
      if (event.key === "Escape") {
        clearSelection();
        setContextMenu(null);
        setShowCommandPalette(false);
        setShowNodeInspector(false);
      }

      // Command Palette: Cmd/Ctrl + K
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setShowCommandPalette(true);
      }

      // Node Inspector: Cmd/Ctrl + I
      if ((event.metaKey || event.ctrlKey) && event.key === "i") {
        event.preventDefault();
        if (selectedNodeIds.length === 1) {
          setShowNodeInspector((prev) => !prev);
        }
      }

      // History Panel: Cmd/Ctrl + H
      if ((event.metaKey || event.ctrlKey) && event.key === "h") {
        event.preventDefault();
        setShowHistoryPanel((prev) => !prev);
      }

      // Node Search: Cmd/Ctrl + F
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        event.preventDefault();
        setShowNodeSearch(true);
      }

      // Canvas Settings: Cmd/Ctrl + ,
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setShowCanvasSettings((prev) => !prev);
      }

      // Keyboard Help: ?
      if (event.key === "?" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setShowKeyboardHelp(true);
      }

      // Select Tool: V
      if (event.key === "v" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setActiveTool("select");
      }

      // Hand/Pan Tool: H (without modifier keys)
      if (event.key === "h" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setActiveTool("pan");
      }

      // Insert from Workspace: I
      if (event.key === "i" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleInsertFromWorkspace();
      }

      // Create Note: N
      if (event.key === "n" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleCreateNote();
      }

      // Chat: C
      if (event.key === "c" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleOpenChat();
      }

      // Text: T
      if (event.key === "t" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleCreateText();
      }

      // Draw: D
      if (event.key === "d" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleStartDrawing();
      }

      // Arrow: A
      if (event.key === "a" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleCreateArrow();
      }

      // Shape: S
      if (event.key === "s" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleCreateShape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, clearSelection, handleInsertFromWorkspace, handleCreateNote, handleOpenChat, handleCreateText, handleStartDrawing, handleCreateArrow, handleCreateShape]);

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div 
      ref={reactFlowWrapper} 
      className={`w-full h-full document-canvas-surface ${activeTool === "shape" ? "cursor-crosshair" : ""}`}
      onMouseDown={activeTool === "shape" ? handleShapeMouseDown : undefined}
      onMouseMove={activeTool === "shape" ? handleShapeMouseMove : undefined}
      onMouseUp={activeTool === "shape" ? handleShapeMouseUp : undefined}
      onMouseLeave={activeTool === "shape" ? handleShapeMouseUp : undefined}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: "ai-connection",
          animated: true,
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        snapToGrid={settings.snapToGrid}
        snapGrid={[settings.gridSize, settings.gridSize]}
        selectNodesOnDrag={false}
        selectionOnDrag={activeTool === "select"}
        panOnDrag={activeTool === "pan" ? true : activeTool === "shape" ? false : [1, 2]}
        panOnScroll={activeTool !== "shape"}
        zoomOnScroll={activeTool !== "shape"}
        preventScrolling
        proOptions={{ hideAttribution: true }}
        className={activeTool === "pan" ? "pan-mode" : activeTool === "shape" ? "shape-mode" : ""}
      >
        {/* Background */}
        {settings.showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={settings.gridSize}
            size={1}
            color="rgba(0,0,0,0.08)"
          />
        )}

        {/* Mini Map - Top Right */}
        {settings.showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            style={{ backgroundColor: 'var(--workspace-sidebar)', border: '1px solid var(--workspace-sidebar-border)' }}
            className="!rounded-xl !shadow-lg !top-4 !right-4 !bottom-auto"
            maskColor="rgba(255,255,255,0.1)"
            position="top-right"
          />
        )}

      </ReactFlow>

      {/* Draggable Node Palette */}
      <DraggableNodePalette
        onAddNode={(type) => {
          if (type === 'image') {
            openImagePickerAtCanvasCenter();
          }
        }}
      />

      {/* Shape Drawing Overlay */}
      {isDrawingShape && shapeStartPos && shapeCurrentPos && (
        <div 
          className="absolute pointer-events-none z-40"
          style={{
            left: Math.min(shapeStartPos.x, shapeCurrentPos.x),
            top: Math.min(shapeStartPos.y, shapeCurrentPos.y),
            width: Math.abs(shapeCurrentPos.x - shapeStartPos.x),
            height: Math.abs(shapeCurrentPos.y - shapeStartPos.y),
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            borderRadius: '12px',
            border: '2px dashed rgba(59, 130, 246, 0.8)',
          }}
        />
      )}

      {/* Shape Mode Indicator */}
      {activeTool === "shape" && !isDrawingShape && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          Click and drag to draw a shape
        </div>
      )}

      {/* Add Image from Workspace Popover */}
      <AddMediaPopover
        workspaceId={workspaceId}
        isOpen={showAddImagePopover}
        onClose={() => {
          setShowAddImagePopover(false);
          setPendingImagePosition(null);
        }}
        onAddMedia={() => {
          // no-op; handled via onAddDocuments
        }}
        onAddDocuments={handleAddWorkspaceImagesToCanvas}
      />

      {/* Add Video from Workspace Popover */}
      <AddVideoPopover
        workspaceId={workspaceId}
        isOpen={showAddVideoPopover}
        onClose={() => {
          setShowAddVideoPopover(false);
          setPendingVideoPosition(null);
        }}
        onAddVideos={handleAddWorkspaceVideosToCanvas}
      />

      {/* Add Link from Workspace Popover */}
      <AddLinkPopover
        workspaceId={workspaceId}
        isOpen={showAddLinkPopover}
        onClose={() => {
          setShowAddLinkPopover(false);
          setPendingLinkPosition(null);
        }}
        onAddLinks={handleAddWorkspaceLinksToCanvas}
      />

      {/* Context Menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Node Inspector */}
      <NodeInspector
        isOpen={showNodeInspector && selectedNodeIds.length === 1}
        onClose={() => setShowNodeInspector(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onAddImage={(position) => {
          setPendingImagePosition(position);
          setShowAddImagePopover(true);
        }}
      />

      {/* Toolbar Actions */}
      <CanvasToolbarActions
        onOpenSearch={() => setShowNodeSearch(true)}
        onOpenHistory={() => setShowHistoryPanel(true)}
        onOpenSettings={() => setShowCanvasSettings(true)}
        onOpenKeyboardHelp={() => setShowKeyboardHelp(true)}
      />

      {/* Quick Add Menu */}
      <QuickAddMenu
        onAddImage={(position) => {
          setPendingImagePosition(position);
          setShowAddImagePopover(true);
        }}
      />

      {/* Drag & Drop Overlay */}
      <DropZoneOverlay />

      {/* Presence Indicator (Collaboration) */}
      <PresenceIndicator />

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Node Search */}
      <NodeSearch
        isOpen={showNodeSearch}
        onClose={() => setShowNodeSearch(false)}
      />

      {/* Canvas Settings */}
      <CanvasSettings
        isOpen={showCanvasSettings}
        onClose={() => setShowCanvasSettings(false)}
      />

      {/* Integrated Zoom Controls */}
      <IntegratedZoomControls 
        onOpenSettings={() => setShowCanvasSettings(true)}
      />

      {/* Canvas Toolbar - Select/Pan Tools */}
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={(tool) => setActiveTool(tool as "select" | "pan")}
        onInsertFromWorkspace={handleInsertFromWorkspace}
        onCreateNote={handleCreateNote}
        onOpenChat={handleOpenChat}
        onCreateText={handleCreateText}
        onStartDrawing={handleStartDrawing}
        onCreateArrow={handleCreateArrow}
        onCreateShape={handleCreateShape}
      />
    </div>
  );
}

// Wrapper with ReactFlowProvider
export function SpatialCanvas(props: SpatialCanvasProps) {
  return (
    <ReactFlowProvider>
      <SpatialCanvasFlow {...props} />
    </ReactFlowProvider>
  );
}

export default SpatialCanvas;
