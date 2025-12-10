// Canvas Edge Components Index
// All custom edge types for the Spatial AI Canvas

export { default as AIConnectionEdge } from "./ai-connection-edge";

// Edge types mapping for React Flow
import AIConnectionEdge from "./ai-connection-edge";

export const edgeTypes = {
  "ai-connection": AIConnectionEdge,
};
