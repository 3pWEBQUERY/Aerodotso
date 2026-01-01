// Zustand Store for Spatial AI Canvas
// Global state management for the canvas system

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import {
  CanvasState,
  CanvasNode,
  CanvasConnection,
  Collaborator,
  AIContextData,
  CanvasNodeData,
  ImageNodeData,
  DocumentNodeData,
  NoteNodeData,
  AIGeneratorNodeData,
  GeneratedImage,
} from './types';

interface CanvasStore extends CanvasState {
  // Node operations
  addNode: (node: CanvasNode) => void;
  updateNode: (nodeId: string, data: Partial<CanvasNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteNodes: (nodeIds: string[]) => void;
  duplicateNode: (nodeId: string) => CanvasNode | null;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
  
  // Folder operations
  addNodeToFolder: (nodeId: string, folderId: string) => void;
  removeNodeFromFolder: (nodeId: string, folderId: string) => void;
  getFolderAtPosition: (x: number, y: number, excludeNodeId?: string) => CanvasNode | undefined;
  toggleFolderOpen: (folderId: string) => void;
  isFolderOpen: (folderId: string) => boolean;

  // Edge operations
  addEdge: (edge: CanvasConnection) => void;
  deleteEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, data: Partial<CanvasConnection['data']>) => void;

  // Selection
  setSelectedNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  selectAll: () => void;

  // Clipboard
  copyNodes: (nodeIds: string[]) => void;
  pasteNodes: (position?: { x: number; y: number }) => void;
  cutNodes: (nodeIds: string[]) => void;

  // React Flow integration
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // Viewport
  setViewport: (viewport: CanvasState['viewport']) => void;

  // Loading & saving
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setLastSaved: (date: Date) => void;

  // Collaboration
  updateCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (userId: string) => void;

  // Canvas metadata
  updateMetadata: (metadata: Partial<CanvasState['metadata']>) => void;

  // Bulk operations
  clearCanvas: () => void;
  loadCanvas: (canvas: Partial<CanvasState>) => void;
  setCanvasId: (canvasId: string) => void;
  setWorkspaceId: (workspaceId: string) => void;

  // AI Context
  buildAIContext: (nodeIds: string[]) => AIContextData;
  getConnectedNodes: (nodeId: string) => CanvasNode[];

  // Undo/Redo
  history: Array<{ nodes: CanvasNode[]; edges: CanvasConnection[]; timestamp: Date }>;
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  jumpToHistory: (index: number) => void;

  // Helpers
  getNodeById: (nodeId: string) => CanvasNode | undefined;
  getNodesByType: (type: CanvasNodeData['type']) => CanvasNode[];

  // Settings
  settings: {
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
    showMinimap: boolean;
    backgroundColor: string;
  };
  updateSettings: (settings: Partial<CanvasStore['settings']>) => void;
}

// Canvas display settings
interface CanvasSettings {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showMinimap: boolean;
  backgroundColor: string;
}

const initialSettings: CanvasSettings = {
  showGrid: true,
  snapToGrid: true,
  gridSize: 16,
  showMinimap: true,
  backgroundColor: '#f9fafb',
};

const initialState: Omit<CanvasState, 'buildAIContext'> & { 
  history: Array<{ nodes: CanvasNode[]; edges: CanvasConnection[]; timestamp: Date }>; 
  historyIndex: number;
  settings: CanvasSettings;
} = {
  workspaceId: '',
  canvasId: '',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],
  copiedNodes: undefined,
  isLoading: false,
  isSaving: false,
  lastSaved: undefined,
  collaborators: [],
  version: 1,
  metadata: {
    name: 'Untitled Canvas',
    description: undefined,
    thumbnail: undefined,
    tags: [],
    category: undefined,
    isPublic: false,
  },
  history: [],
  historyIndex: -1,
  settings: initialSettings,
};

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ================================================================
        // NODE OPERATIONS
        // ================================================================

        addNode: (node) => {
          set((state) => ({
            nodes: [...state.nodes, node],
          }));
          get().pushHistory();
        },

        updateNode: (nodeId, data) => {
          set((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === nodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      ...data, 
                      updatedAt: new Date() 
                    } as CanvasNodeData 
                  }
                : node
            ),
          }));
        },

        deleteNode: (nodeId) => {
          set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            edges: state.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
            selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
          }));
          get().pushHistory();
        },

        deleteNodes: (nodeIds) => {
          const nodeIdSet = new Set(nodeIds);
          set((state) => ({
            nodes: state.nodes.filter((node) => !nodeIdSet.has(node.id)),
            edges: state.edges.filter(
              (edge) => !nodeIdSet.has(edge.source) && !nodeIdSet.has(edge.target)
            ),
            selectedNodeIds: [],
          }));
          get().pushHistory();
        },

        duplicateNode: (nodeId) => {
          const state = get();
          const nodeToDuplicate = state.nodes.find((n) => n.id === nodeId);

          if (!nodeToDuplicate) return null;

          const newNode: CanvasNode = {
            ...nodeToDuplicate,
            id: `${nodeId}-copy-${Date.now()}`,
            position: {
              x: nodeToDuplicate.position.x + 50,
              y: nodeToDuplicate.position.y + 50,
            },
            data: {
              ...nodeToDuplicate.data,
              label: `${nodeToDuplicate.data.label} (Copy)`,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as CanvasNodeData,
            selected: false,
          };

          get().addNode(newNode);
          return newNode;
        },

        moveNode: (nodeId, position) => {
          set((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === nodeId ? { ...node, position } : node
            ),
          }));
        },

        // ================================================================
        // FOLDER OPERATIONS
        // ================================================================

        addNodeToFolder: (nodeId, folderId) => {
          set((state) => {
            const folder = state.nodes.find(n => n.id === folderId);
            if (!folder) return state;
            
            return {
              nodes: state.nodes.map((node) => {
                // Update folder's childNodeIds
                if (node.id === folderId && node.type === 'folder') {
                  const childNodeIds = (node.data as any).childNodeIds || [];
                  if (!childNodeIds.includes(nodeId)) {
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        childNodeIds: [...childNodeIds, nodeId],
                        updatedAt: new Date(),
                      } as any,
                    };
                  }
                }
                // Hide the node by marking it as inside folder
                if (node.id === nodeId) {
                  return {
                    ...node,
                    hidden: true,
                    data: {
                      ...node.data,
                      parentFolderId: folderId,
                      updatedAt: new Date(),
                    } as any,
                  };
                }
                return node;
              }),
            };
          });
        },

        removeNodeFromFolder: (nodeId, folderId) => {
          set((state) => {
            const folder = state.nodes.find(n => n.id === folderId);
            if (!folder) return state;
            
            return {
              nodes: state.nodes.map((node) => {
                // Update folder's childNodeIds
                if (node.id === folderId && node.type === 'folder') {
                  const childNodeIds = (node.data as any).childNodeIds || [];
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      childNodeIds: childNodeIds.filter((id: string) => id !== nodeId),
                      updatedAt: new Date(),
                    } as any,
                  };
                }
                // Unhide the node
                if (node.id === nodeId) {
                  const { parentFolderId, ...restData } = node.data as any;
                  return {
                    ...node,
                    hidden: false,
                    position: {
                      x: folder.position.x + 250,
                      y: folder.position.y,
                    },
                    data: {
                      ...restData,
                      updatedAt: new Date(),
                    } as any,
                  };
                }
                return node;
              }),
            };
          });
        },

        getFolderAtPosition: (x, y, excludeNodeId) => {
          const state = get();
          return state.nodes.find((node) => {
            if (node.type !== 'folder') return false;
            if (excludeNodeId && node.id === excludeNodeId) return false;
            
            const nodeWidth = (node.data as any).width || 200;
            const nodeHeight = (node.data as any).height || 240;
            
            return (
              x >= node.position.x &&
              x <= node.position.x + nodeWidth &&
              y >= node.position.y &&
              y <= node.position.y + nodeHeight
            );
          });
        },

        toggleFolderOpen: (folderId) => {
          const state = get();
          const folder = state.nodes.find(n => n.id === folderId);
          if (!folder || folder.type !== 'folder') return;
          
          const isCurrentlyOpen = (folder.data as any).isOpen || false;
          const childNodeIds = (folder.data as any).childNodeIds || [];
          
          if (isCurrentlyOpen) {
            // Close folder: animate nodes back to folder, then hide them
            const folderX = folder.position.x;
            const folderY = folder.position.y;
            
            // First, mark nodes as closing and move them toward the folder
            set((state) => ({
              nodes: state.nodes.map((node) => {
                if (node.id === folderId) {
                  return {
                    ...node,
                    data: { ...node.data, isOpen: false, updatedAt: new Date() } as any,
                  };
                }
                if (childNodeIds.includes(node.id)) {
                  return {
                    ...node,
                    className: 'folder-item-closing',
                    data: { 
                      ...node.data, 
                      isClosingToFolder: true,
                      updatedAt: new Date() 
                    } as any,
                  };
                }
                return node;
              }),
            }));
            
            // After animation completes, hide the nodes
            setTimeout(() => {
              set((state) => ({
                nodes: state.nodes.map((node) => {
                  if (childNodeIds.includes(node.id)) {
                    const { isClosingToFolder, isAnimatingFromFolder, ...restData } = node.data as any;
                    return {
                      ...node,
                      hidden: true,
                      className: undefined,
                      position: { x: folderX, y: folderY },
                      data: { ...restData, updatedAt: new Date() } as any,
                    };
                  }
                  return node;
                }),
              }));
            }, 350); // Match animation duration
          } else {
            // Open folder: show child nodes in a clean 2-column grid to the right
            const folderX = folder.position.x;
            const folderY = folder.position.y;
            const folderWidth = (folder.data as any).width || 200;
            const folderHeight = (folder.data as any).height || 240;
            
            const childNodes = state.nodes.filter(n => childNodeIds.includes(n.id));
            const positions: { [id: string]: { x: number; y: number } } = {};
            
            // Clean 2-column grid layout like in the reference
            const startX = folderX + folderWidth + 50; // Gap from folder
            const startY = folderY - 150; // Start above folder level
            const columnWidth = 250; // Width of each column
            const rowHeight = 350; // Height of each row
            const gap = 20; // Gap between items
            
            childNodes.forEach((childNode, index) => {
              const col = index % 2; // 2 columns
              const row = Math.floor(index / 2);
              
              const x = startX + (col * (columnWidth + gap));
              const y = startY + (row * (rowHeight + gap));
              
              positions[childNode.id] = { x, y };
            });
            
            set((state) => ({
              nodes: state.nodes.map((node) => {
                if (node.id === folderId) {
                  return {
                    ...node,
                    data: { ...node.data, isOpen: true, updatedAt: new Date() } as any,
                  };
                }
                if (childNodeIds.includes(node.id) && positions[node.id]) {
                  return {
                    ...node,
                    hidden: false,
                    className: 'folder-item-animate',
                    position: positions[node.id],
                    data: { 
                      ...node.data, 
                      isAnimatingFromFolder: true,
                      updatedAt: new Date() 
                    } as any,
                  };
                }
                return node;
              }),
            }));
            
            // Clear animation class after animation completes
            setTimeout(() => {
              set((state) => ({
                nodes: state.nodes.map((node) => {
                  if (childNodeIds.includes(node.id)) {
                    const { isAnimatingFromFolder, ...restData } = node.data as any;
                    return {
                      ...node,
                      className: undefined,
                      data: { ...restData, updatedAt: new Date() } as any,
                    };
                  }
                  return node;
                }),
              }));
            }, 600); // Match animation duration
          }
        },

        isFolderOpen: (folderId) => {
          const state = get();
          const folder = state.nodes.find(n => n.id === folderId);
          return folder ? (folder.data as any).isOpen || false : false;
        },

        // ================================================================
        // EDGE OPERATIONS
        // ================================================================

        addEdge: (edge) => {
          set((state) => {
            // Prevent duplicate edges
            const exists = state.edges.some(
              (e) => e.source === edge.source && e.target === edge.target
            );
            if (exists) return state;
            return { edges: [...state.edges, edge] };
          });
          get().pushHistory();
        },

        deleteEdge: (edgeId) => {
          set((state) => ({
            edges: state.edges.filter((edge) => edge.id !== edgeId),
          }));
          get().pushHistory();
        },

        updateEdge: (edgeId, data) => {
          set((state) => ({
            edges: state.edges.map((edge) =>
              edge.id === edgeId
                ? { ...edge, data: { ...edge.data, ...data } }
                : edge
            ),
          }));
        },

        // ================================================================
        // SELECTION
        // ================================================================

        setSelectedNodes: (nodeIds) => {
          set({ selectedNodeIds: nodeIds });
        },

        clearSelection: () => {
          set({ selectedNodeIds: [] });
        },

        selectNode: (nodeId, multiSelect = false) => {
          set((state) => {
            if (multiSelect) {
              const isSelected = state.selectedNodeIds.includes(nodeId);
              return {
                selectedNodeIds: isSelected
                  ? state.selectedNodeIds.filter((id) => id !== nodeId)
                  : [...state.selectedNodeIds, nodeId],
              };
            }
            return { selectedNodeIds: [nodeId] };
          });
        },

        selectAll: () => {
          set((state) => ({
            selectedNodeIds: state.nodes.map((n) => n.id),
          }));
        },

        // ================================================================
        // CLIPBOARD
        // ================================================================

        copyNodes: (nodeIds) => {
          const state = get();
          const nodesToCopy = state.nodes.filter((node) =>
            nodeIds.includes(node.id)
          );
          set({ copiedNodes: nodesToCopy });
        },

        cutNodes: (nodeIds) => {
          get().copyNodes(nodeIds);
          get().deleteNodes(nodeIds);
        },

        pasteNodes: (position) => {
          const state = get();
          if (!state.copiedNodes || state.copiedNodes.length === 0) return;

          const basePosition = position || {
            x: state.viewport.x + 100,
            y: state.viewport.y + 100,
          };

          const newNodes = state.copiedNodes.map((node, index) => ({
            ...node,
            id: `${node.id}-paste-${Date.now()}-${index}`,
            position: {
              x: basePosition.x + index * 20,
              y: basePosition.y + index * 20,
            },
            data: {
              ...node.data,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as CanvasNodeData,
            selected: false,
          }));

          set((state) => ({
            nodes: [...state.nodes, ...newNodes],
            selectedNodeIds: newNodes.map((n) => n.id),
          }));

          get().pushHistory();
        },

        // ================================================================
        // REACT FLOW INTEGRATION
        // ================================================================

        onNodesChange: (changes) => {
          set((state) => ({
            nodes: applyNodeChanges(changes, state.nodes) as CanvasNode[],
          }));
        },

        onEdgesChange: (changes) => {
          set((state) => ({
            edges: applyEdgeChanges(changes, state.edges) as CanvasConnection[],
          }));
        },

        // ================================================================
        // VIEWPORT
        // ================================================================

        setViewport: (viewport) => {
          set({ viewport });
        },

        // ================================================================
        // LOADING & SAVING
        // ================================================================

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        setSaving: (isSaving) => {
          set({ isSaving });
        },

        setLastSaved: (date) => {
          set({ lastSaved: date });
        },

        // ================================================================
        // COLLABORATION
        // ================================================================

        updateCollaborator: (collaborator) => {
          set((state) => {
            const existing = state.collaborators.find(
              (c) => c.userId === collaborator.userId
            );

            if (existing) {
              return {
                collaborators: state.collaborators.map((c) =>
                  c.userId === collaborator.userId ? { ...c, ...collaborator } : c
                ),
              };
            }

            return {
              collaborators: [...state.collaborators, collaborator],
            };
          });
        },

        removeCollaborator: (userId) => {
          set((state) => ({
            collaborators: state.collaborators.filter((c) => c.userId !== userId),
          }));
        },

        // ================================================================
        // METADATA
        // ================================================================

        updateMetadata: (metadata) => {
          set((state) => ({
            metadata: { ...state.metadata, ...metadata },
          }));
        },

        // ================================================================
        // BULK OPERATIONS
        // ================================================================

        clearCanvas: () => {
          set({
            nodes: [],
            edges: [],
            selectedNodeIds: [],
            viewport: { x: 0, y: 0, zoom: 1 },
          });
          get().pushHistory();
        },

        loadCanvas: (canvas) => {
          set((state) => ({
            ...state,
            ...canvas,
            isLoading: false,
          }));
          // Reset history when loading new canvas
          set({ history: [], historyIndex: -1 });
        },

        setCanvasId: (canvasId) => {
          set({ canvasId });
        },

        setWorkspaceId: (workspaceId) => {
          set({ workspaceId });
        },

        // ================================================================
        // AI CONTEXT BUILDER
        // ================================================================

        buildAIContext: (nodeIds) => {
          const state = get();
          const nodes = state.nodes.filter((node) => nodeIds.includes(node.id));

          const context: AIContextData = {
            images: [],
            documents: [],
            notes: [],
            previousGenerations: [],
            styleKeywords: [],
            topics: [],
          };

          nodes.forEach((node) => {
            const data = node.data;
            switch (data.type) {
              case 'image': {
                const imageData = data as ImageNodeData;
                context.images.push({
                  nodeId: node.id,
                  url: imageData.url,
                  analysis: imageData.aiAnalysis?.composition || '',
                });
                if (imageData.aiAnalysis) {
                  context.styleKeywords.push(...imageData.aiAnalysis.style);
                }
                break;
              }

              case 'document': {
                const docData = data as DocumentNodeData;
                context.documents.push({
                  nodeId: node.id,
                  summary: docData.summary || '',
                  keyPoints: [],
                });
                break;
              }

              case 'note': {
                const noteData = data as NoteNodeData;
                context.notes.push({
                  nodeId: node.id,
                  content: noteData.content,
                });
                break;
              }

              case 'ai-generator': {
                const genData = data as AIGeneratorNodeData;
                context.previousGenerations.push(...genData.generationHistory);
                break;
              }
            }

            if (data.tags) {
              context.topics.push(...data.tags);
            }
          });

          // Deduplicate
          context.styleKeywords = [...new Set(context.styleKeywords)];
          context.topics = [...new Set(context.topics)];

          return context;
        },

        getConnectedNodes: (nodeId) => {
          const state = get();
          const connectedIds = new Set<string>();

          state.edges.forEach((edge) => {
            if (edge.source === nodeId) {
              connectedIds.add(edge.target);
            }
            if (edge.target === nodeId) {
              connectedIds.add(edge.source);
            }
          });

          return state.nodes.filter((node) => connectedIds.has(node.id));
        },

        // ================================================================
        // UNDO/REDO
        // ================================================================

        pushHistory: () => {
          set((state) => {
            const currentState = {
              nodes: JSON.parse(JSON.stringify(state.nodes)),
              edges: JSON.parse(JSON.stringify(state.edges)),
              timestamp: new Date(),
            };

            const newHistory = [
              ...state.history.slice(0, state.historyIndex + 1),
              currentState,
            ].slice(-50); // Keep last 50 states

            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          });
        },

        undo: () => {
          set((state) => {
            if (state.historyIndex <= 0) return state;

            const previousState = state.history[state.historyIndex - 1];
            return {
              nodes: previousState.nodes,
              edges: previousState.edges,
              historyIndex: state.historyIndex - 1,
            };
          });
        },

        redo: () => {
          set((state) => {
            if (state.historyIndex >= state.history.length - 1) return state;

            const nextState = state.history[state.historyIndex + 1];
            return {
              nodes: nextState.nodes,
              edges: nextState.edges,
              historyIndex: state.historyIndex + 1,
            };
          });
        },

        canUndo: () => {
          const state = get();
          return state.historyIndex > 0;
        },

        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },

        jumpToHistory: (index) => {
          set((state) => {
            if (index < 0 || index >= state.history.length) return state;
            
            const targetState = state.history[index];
            return {
              nodes: targetState.nodes,
              edges: targetState.edges,
              historyIndex: index,
            };
          });
        },

        // ================================================================
        // HELPERS
        // ================================================================

        getNodeById: (nodeId) => {
          return get().nodes.find((node) => node.id === nodeId);
        },

        getNodesByType: (type) => {
          return get().nodes.filter((node) => node.data.type === type);
        },

        // ================================================================
        // SETTINGS
        // ================================================================

        updateSettings: (newSettings) => {
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
          }));
        },
      }),
      {
        name: 'miza-canvas-storage',
        partialize: (state) => ({
          viewport: state.viewport,
          metadata: state.metadata,
          settings: state.settings,
        }),
      }
    ),
    { name: 'CanvasStore' }
  )
);

// ============================================================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================================================

export const useCanvasNodes = () => useCanvasStore((state) => state.nodes);
export const useCanvasEdges = () => useCanvasStore((state) => state.edges);
export const useCanvasViewport = () => useCanvasStore((state) => state.viewport);
export const useSelectedNodeIds = () => useCanvasStore((state) => state.selectedNodeIds);
export const useCanvasMetadata = () => useCanvasStore((state) => state.metadata);
export const useCollaborators = () => useCanvasStore((state) => state.collaborators);
export const useCanvasLoading = () => useCanvasStore((state) => state.isLoading);
export const useCanvasSaving = () => useCanvasStore((state) => state.isSaving);
