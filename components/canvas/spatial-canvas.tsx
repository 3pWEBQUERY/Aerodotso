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

// Components
import { CanvasNodePalette } from "./canvas-node-palette";
import { CanvasContextMenu } from "./canvas-context-menu";
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
      loadCanvas({
        nodes: initialNodes,
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
      } else if (type === 'url') {
        typeSpecificData = {
          url: '',
        };
      }

      const newNode: CanvasNode = {
        id: `${type}-${Date.now()}`,
        type: type,
        position,
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

  // ================================================================
  // KEYBOARD SHORTCUTS
  // ================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if focus is not in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, clearSelection]);

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
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
        selectionOnDrag
        panOnScroll
        zoomOnScroll
        preventScrolling
        proOptions={{ hideAttribution: true }}
        style={{ backgroundColor: settings.backgroundColor }}
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
            className="!bg-white !border !border-gray-200 !rounded-xl !shadow-lg !top-4 !right-4 !bottom-auto"
            maskColor="rgba(0,0,0,0.08)"
            position="top-right"
          />
        )}

        {/* Node Palette Panel */}
        <Panel position="top-left" className="!m-4">
          <CanvasNodePalette
            onAddNode={(type) => {
              if (type === 'image') {
                openImagePickerAtCanvasCenter();
              }
            }}
          />
        </Panel>
      </ReactFlow>

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
