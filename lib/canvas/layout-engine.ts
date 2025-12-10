// Smart Layout Engine for Spatial AI Canvas
// Provides intelligent auto-layout capabilities

import { CanvasNode, LayoutStyle, LayoutOptions, CanvasNodeData } from "./types";
import { XYPosition } from "reactflow";

// ============================================================================
// MAIN LAYOUT FUNCTION
// ============================================================================

export function applySmartLayout(
  nodes: CanvasNode[],
  options: LayoutOptions
): CanvasNode[] {
  if (nodes.length === 0) return nodes;

  switch (options.style) {
    case LayoutStyle.GRID:
      return applyGridLayout(nodes, options);
    case LayoutStyle.RADIAL:
      return applyRadialLayout(nodes, options);
    case LayoutStyle.TIMELINE:
      return applyTimelineLayout(nodes, options);
    case LayoutStyle.STORYBOARD:
      return applyStoryboardLayout(nodes, options);
    case LayoutStyle.CLUSTER:
      return applyClusterLayout(nodes, options);
    case LayoutStyle.FORCE_DIRECTED:
      return applyForceDirectedLayout(nodes, options);
    default:
      return nodes;
  }
}

// ============================================================================
// GRID LAYOUT
// ============================================================================

function applyGridLayout(nodes: CanvasNode[], options: LayoutOptions): CanvasNode[] {
  const { spacing = 50, padding = 100, centerPosition } = options;
  const gridSize = Math.ceil(Math.sqrt(nodes.length));
  const nodeWidth = 300;
  const nodeHeight = 250;

  return nodes.map((node, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    return {
      ...node,
      position: {
        x: (centerPosition?.x || padding) + col * (nodeWidth + spacing),
        y: (centerPosition?.y || padding) + row * (nodeHeight + spacing),
      },
    };
  });
}

// ============================================================================
// RADIAL LAYOUT (around center point)
// ============================================================================

function applyRadialLayout(nodes: CanvasNode[], options: LayoutOptions): CanvasNode[] {
  const { spacing = 200, centerPosition } = options;
  const center = centerPosition || { x: 500, y: 500 };

  // Arrange nodes in concentric circles
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: center }];
  }

  const results: CanvasNode[] = [];
  let currentRadius = spacing;
  let currentIndex = 0;

  while (currentIndex < nodes.length) {
    // Calculate how many nodes fit in this ring
    const circumference = 2 * Math.PI * currentRadius;
    const nodesInRing = Math.min(
      Math.floor(circumference / 300), // ~300px per node
      nodes.length - currentIndex
    );

    // Place nodes in ring
    for (let i = 0; i < nodesInRing; i++) {
      const angle = (i / nodesInRing) * 2 * Math.PI - Math.PI / 2; // Start from top
      results.push({
        ...nodes[currentIndex],
        position: {
          x: center.x + Math.cos(angle) * currentRadius - 150,
          y: center.y + Math.sin(angle) * currentRadius - 125,
        },
      });
      currentIndex++;
    }

    currentRadius += spacing;
  }

  return results;
}

// ============================================================================
// TIMELINE LAYOUT (chronological)
// ============================================================================

function applyTimelineLayout(nodes: CanvasNode[], options: LayoutOptions): CanvasNode[] {
  const { spacing = 50, padding = 100 } = options;
  const nodeWidth = 300;

  // Sort by creation date
  const sortedNodes = [...nodes].sort((a, b) => {
    const dateA = new Date(a.data.createdAt).getTime();
    const dateB = new Date(b.data.createdAt).getTime();
    return dateA - dateB;
  });

  return sortedNodes.map((node, index) => ({
    ...node,
    position: {
      x: padding + index * (nodeWidth + spacing),
      y: padding + 100 + (index % 2 === 0 ? 0 : 50), // Slight stagger
    },
  }));
}

// ============================================================================
// STORYBOARD LAYOUT (for video/narrative projects)
// ============================================================================

function applyStoryboardLayout(nodes: CanvasNode[], options: LayoutOptions): CanvasNode[] {
  const { spacing = 30, padding = 100 } = options;
  const columns = 4; // 4 panels per row like traditional storyboards
  const nodeWidth = 320;
  const nodeHeight = 280;

  return nodes.map((node, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    return {
      ...node,
      position: {
        x: padding + col * (nodeWidth + spacing),
        y: padding + row * (nodeHeight + spacing),
      },
    };
  });
}

// ============================================================================
// CLUSTER LAYOUT (group by similarity/type)
// ============================================================================

function applyClusterLayout(nodes: CanvasNode[], options: LayoutOptions): CanvasNode[] {
  const { spacing = 50, padding = 100 } = options;
  
  // Group nodes by type
  const clusters = groupNodesByType(nodes);
  
  let currentX = padding;
  let currentY = padding;
  const clusterSpacing = 600;
  const positioned: CanvasNode[] = [];

  clusters.forEach((cluster, clusterIndex) => {
    // Layout cluster in mini-grid
    const gridSize = Math.ceil(Math.sqrt(cluster.length));
    const nodeWidth = 300;
    const nodeHeight = 250;

    cluster.forEach((node, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      positioned.push({
        ...node,
        position: {
          x: currentX + col * (nodeWidth + spacing),
          y: currentY + row * (nodeHeight + spacing),
        },
      });
    });

    // Move to next cluster position
    currentX += clusterSpacing;
    if (currentX > 2500) {
      currentX = padding;
      currentY += clusterSpacing;
    }
  });

  return positioned;
}

function groupNodesByType(nodes: CanvasNode[]): CanvasNode[][] {
  const clusters: Map<string, CanvasNode[]> = new Map();

  // Priority order for clustering
  const typeOrder = ['ai-generator', 'ai-chat', 'image', 'video', 'document', 'note', 'url', 'group'];

  nodes.forEach((node) => {
    const key = node.data.type || 'other';
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(node);
  });

  // Return clusters in priority order
  return typeOrder
    .filter(type => clusters.has(type))
    .map(type => clusters.get(type)!)
    .concat(
      Array.from(clusters.entries())
        .filter(([key]) => !typeOrder.includes(key))
        .map(([, nodes]) => nodes)
    );
}

// ============================================================================
// FORCE-DIRECTED LAYOUT (physics-based)
// ============================================================================

function applyForceDirectedLayout(nodes: CanvasNode[], options: LayoutOptions): CanvasNode[] {
  if (nodes.length <= 1) return nodes;

  const iterations = 100;
  const repulsionStrength = 50000;
  const centerAttraction = 0.01;
  const center = options.centerPosition || { x: 800, y: 600 };

  // Initialize positions (use existing or random)
  let positions = nodes.map(node => ({
    x: node.position?.x || Math.random() * 1000,
    y: node.position?.y || Math.random() * 800,
  }));

  for (let iter = 0; iter < iterations; iter++) {
    const forces = positions.map(() => ({ x: 0, y: 0 }));

    // Repulsion between all nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        forces[i].x -= fx;
        forces[i].y -= fy;
        forces[j].x += fx;
        forces[j].y += fy;
      }
    }

    // Center attraction
    for (let i = 0; i < positions.length; i++) {
      const dx = center.x - positions[i].x;
      const dy = center.y - positions[i].y;
      forces[i].x += dx * centerAttraction;
      forces[i].y += dy * centerAttraction;
    }

    // Apply forces with damping
    const damping = 0.1 * (1 - iter / iterations);
    positions = positions.map((pos, i) => ({
      x: pos.x + forces[i].x * damping,
      y: pos.y + forces[i].y * damping,
    }));
  }

  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: Math.round(positions[i].x),
      y: Math.round(positions[i].y),
    },
  }));
}

// ============================================================================
// AUTO-LAYOUT SUGGESTION
// ============================================================================

export function suggestBestLayout(nodes: CanvasNode[]): LayoutStyle {
  const nodeCount = nodes.length;
  const types = new Set(nodes.map(n => n.data.type));

  // Decision logic based on content
  if (nodeCount <= 4) {
    return LayoutStyle.GRID;
  }

  if (types.has('video') && nodeCount > 4) {
    return LayoutStyle.STORYBOARD;
  }

  if (types.has('ai-generator') || types.has('ai-chat')) {
    return LayoutStyle.RADIAL; // AI nodes at center
  }

  if (nodeCount <= 12) {
    return LayoutStyle.RADIAL;
  }

  if (types.size > 2) {
    return LayoutStyle.CLUSTER;
  }

  return LayoutStyle.GRID;
}

// ============================================================================
// LAYOUT AROUND SPECIFIC NODE
// ============================================================================

export function layoutAroundNode(
  nodes: CanvasNode[],
  centerNodeId: string,
  style: 'radial' | 'grid' = 'radial'
): CanvasNode[] {
  const centerNode = nodes.find(n => n.id === centerNodeId);
  if (!centerNode) return nodes;

  const otherNodes = nodes.filter(n => n.id !== centerNodeId);
  const centerPos = centerNode.position;

  if (style === 'radial') {
    return [
      centerNode,
      ...applyRadialLayout(otherNodes, {
        style: LayoutStyle.RADIAL,
        spacing: 250,
        padding: 0,
        animate: false,
        centerPosition: { x: centerPos.x + 150, y: centerPos.y + 125 },
      }),
    ];
  }

  // Grid style: arrange around center
  const positioned = applyGridLayout(otherNodes, {
    style: LayoutStyle.GRID,
    spacing: 50,
    padding: 0,
    animate: false,
    centerPosition: { x: centerPos.x + 400, y: centerPos.y },
  });

  return [centerNode, ...positioned];
}

// ============================================================================
// GENERATED IMAGES LAYOUT (for AI Generator results)
// ============================================================================

export function layoutGeneratedImages(
  imageUrls: string[],
  generatorPosition: XYPosition,
  options: { columns?: number; spacing?: number } = {}
): XYPosition[] {
  const { columns = 2, spacing = 20 } = options;
  const nodeWidth = 280;
  const nodeHeight = 200;
  const startX = generatorPosition.x + 400; // Offset from generator
  const startY = generatorPosition.y;

  return imageUrls.map((_, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    return {
      x: startX + col * (nodeWidth + spacing),
      y: startY + row * (nodeHeight + spacing),
    };
  });
}
