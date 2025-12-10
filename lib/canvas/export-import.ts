// Canvas Export/Import Utilities
// Save and load canvas configurations

import { CanvasNode, CanvasConnection, CanvasExport, CanvasMetadata } from "./types";

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export function exportCanvasToJSON(
  nodes: CanvasNode[],
  edges: CanvasConnection[],
  metadata: CanvasMetadata
): string {
  const exportData: CanvasExport = {
    version: "1.0.0",
    exportDate: new Date(),
    canvas: {
      metadata,
      nodes,
      edges,
    },
    assets: [],
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadCanvasAsJSON(
  nodes: CanvasNode[],
  edges: CanvasConnection[],
  metadata: CanvasMetadata,
  filename?: string
) {
  const json = exportCanvasToJSON(nodes, edges, metadata);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${metadata.name.replace(/\s+/g, "-").toLowerCase()}-canvas.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportCanvasAsImage(
  container: HTMLElement,
  format: "png" | "svg" = "png"
): Promise<Blob | null> {
  // This would require html-to-image library
  // For now, return null and implement later
  console.warn("Export as image not implemented yet");
  return null;
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

export function parseCanvasJSON(jsonString: string): CanvasExport | null {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (!data.version || !data.canvas) {
      throw new Error("Invalid canvas format");
    }
    
    // Convert date strings back to Date objects
    if (data.exportDate) {
      data.exportDate = new Date(data.exportDate);
    }
    
    data.canvas.nodes = data.canvas.nodes.map((node: any) => ({
      ...node,
      data: {
        ...node.data,
        createdAt: new Date(node.data.createdAt),
        updatedAt: new Date(node.data.updatedAt),
      },
    }));
    
    return data as CanvasExport;
  } catch (error) {
    console.error("Failed to parse canvas JSON:", error);
    return null;
  }
}

export async function importCanvasFromFile(): Promise<CanvasExport | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const text = await file.text();
        const data = parseCanvasJSON(text);
        resolve(data);
      } catch (error) {
        console.error("Failed to import canvas:", error);
        resolve(null);
      }
    };
    
    input.click();
  });
}

// ============================================================================
// MERGE UTILITIES
// ============================================================================

export function mergeCanvases(
  existingNodes: CanvasNode[],
  existingEdges: CanvasConnection[],
  importedNodes: CanvasNode[],
  importedEdges: CanvasConnection[],
  offset: { x: number; y: number } = { x: 100, y: 100 }
): { nodes: CanvasNode[]; edges: CanvasConnection[] } {
  // Create ID mapping for imported nodes
  const idMap = new Map<string, string>();
  const timestamp = Date.now();
  
  // Offset and rename imported nodes
  const newNodes = importedNodes.map((node, index) => {
    const newId = `imported-${node.id}-${timestamp}-${index}`;
    idMap.set(node.id, newId);
    
    return {
      ...node,
      id: newId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Imported)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  });
  
  // Update edge references
  const newEdges = importedEdges
    .map((edge) => {
      const newSource = idMap.get(edge.source);
      const newTarget = idMap.get(edge.target);
      
      if (!newSource || !newTarget) return null;
      
      return {
        ...edge,
        id: `imported-${edge.id}-${timestamp}`,
        source: newSource,
        target: newTarget,
      };
    })
    .filter(Boolean) as CanvasConnection[];
  
  return {
    nodes: [...existingNodes, ...newNodes],
    edges: [...existingEdges, ...newEdges],
  };
}

// ============================================================================
// CLIPBOARD UTILITIES
// ============================================================================

export async function copyNodesToClipboard(
  nodes: CanvasNode[],
  edges: CanvasConnection[]
): Promise<void> {
  const data = {
    type: "canvas-nodes",
    nodes,
    edges: edges.filter(
      (e) =>
        nodes.some((n) => n.id === e.source) &&
        nodes.some((n) => n.id === e.target)
    ),
  };
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(data));
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
  }
}

export async function pasteNodesFromClipboard(): Promise<{
  nodes: CanvasNode[];
  edges: CanvasConnection[];
} | null> {
  try {
    const text = await navigator.clipboard.readText();
    const data = JSON.parse(text);
    
    if (data.type !== "canvas-nodes") {
      return null;
    }
    
    return {
      nodes: data.nodes,
      edges: data.edges,
    };
  } catch (error) {
    console.error("Failed to paste from clipboard:", error);
    return null;
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateCanvasData(
  nodes: CanvasNode[],
  edges: CanvasConnection[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  
  // Check for duplicate node IDs
  if (nodeIds.size !== nodes.length) {
    errors.push("Duplicate node IDs detected");
  }
  
  // Check edge references
  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target: ${edge.target}`);
    }
  });
  
  // Check for required node data
  nodes.forEach((node) => {
    if (!node.data.type) {
      errors.push(`Node ${node.id} is missing type`);
    }
    if (!node.position) {
      errors.push(`Node ${node.id} is missing position`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
