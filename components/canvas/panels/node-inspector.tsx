"use client";

import { useState, useEffect } from "react";
import { useCanvasStore } from "@/lib/canvas/store";
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  StickyNote,
  MessageSquare,
  Wand2,
  Link2,
  Folder,
  Tag,
  Calendar,
  Sparkles,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Palette,
  Type,
} from "lucide-react";
import {
  CanvasNode,
  ImageNodeData,
  VideoNodeData,
  DocumentNodeData,
  NoteNodeData,
  AIChatNodeData,
  AIGeneratorNodeData,
} from "@/lib/canvas/types";

const NODE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  note: StickyNote,
  "ai-chat": MessageSquare,
  "ai-generator": Wand2,
  url: Link2,
  group: Folder,
};

const NODE_COLORS: Record<string, string> = {
  image: "text-blue-500",
  video: "text-red-500",
  document: "text-orange-500",
  note: "text-amber-500",
  "ai-chat": "text-violet-500",
  "ai-generator": "text-[var(--accent-primary-light)]",
  url: "text-indigo-500",
  group: "text-gray-500",
};

interface NodeInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NodeInspector({ isOpen, onClose }: NodeInspectorProps) {
  const { selectedNodeIds, nodes, updateNode, deleteNode, duplicateNode } = useCanvasStore();
  const [localLabel, setLocalLabel] = useState("");
  const [localTags, setLocalTags] = useState("");

  const selectedNode = selectedNodeIds.length === 1
    ? nodes.find((n) => n.id === selectedNodeIds[0])
    : null;

  useEffect(() => {
    if (selectedNode) {
      setLocalLabel(selectedNode.data.label || "");
      setLocalTags(selectedNode.data.tags?.join(", ") || "");
    }
  }, [selectedNode?.id]);

  if (!isOpen || !selectedNode) return null;

  const Icon = NODE_ICONS[selectedNode.data.type] || FileText;
  const iconColor = NODE_COLORS[selectedNode.data.type] || "text-gray-500";
  const data = selectedNode.data;

  const handleLabelChange = (value: string) => {
    setLocalLabel(value);
  };

  const handleLabelBlur = () => {
    if (localLabel !== selectedNode.data.label) {
      updateNode(selectedNode.id, { label: localLabel });
    }
  };

  const handleTagsBlur = () => {
    const tags = localTags.split(",").map((t) => t.trim()).filter(Boolean);
    updateNode(selectedNode.id, { tags });
  };

  const handleToggleLock = () => {
    updateNode(selectedNode.id, { isLocked: !data.isLocked });
  };

  const handleDelete = () => {
    deleteNode(selectedNode.id);
    onClose();
  };

  const handleDuplicate = () => {
    duplicateNode(selectedNode.id);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="absolute right-4 top-4 w-72 bg-white rounded-xl shadow-xl border overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="font-medium text-sm capitalize">{data.type.replace("-", " ")}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {/* Label */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Type className="h-3 w-3" />
            Name
          </label>
          <input
            type="text"
            value={localLabel}
            onChange={(e) => handleLabelChange(e.target.value)}
            onBlur={handleLabelBlur}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Tag className="h-3 w-3" />
            Tags
          </label>
          <input
            type="text"
            value={localTags}
            onChange={(e) => setLocalTags(e.target.value)}
            onBlur={handleTagsBlur}
            placeholder="tag1, tag2, tag3"
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
          />
        </div>

        {/* AI Tags */}
        {data.aiTags && data.aiTags.length > 0 && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
              <Sparkles className="h-3 w-3" />
              AI Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {data.aiTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Type-specific fields */}
        {data.type === "image" && (
          <ImageFields data={data as ImageNodeData} />
        )}

        {data.type === "video" && (
          <VideoFields data={data as VideoNodeData} />
        )}

        {data.type === "document" && (
          <DocumentFields data={data as DocumentNodeData} />
        )}

        {data.type === "note" && (
          <NoteFields
            data={data as NoteNodeData}
            nodeId={selectedNode.id}
            updateNode={updateNode}
          />
        )}

        {data.type === "ai-chat" && (
          <AIChatFields data={data as AIChatNodeData} />
        )}

        {data.type === "ai-generator" && (
          <AIGeneratorFields data={data as AIGeneratorNodeData} />
        )}

        {/* Dates */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(data.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Updated: {formatDate(data.updatedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t flex gap-2">
          <button
            type="button"
            onClick={handleToggleLock}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg hover:bg-gray-50"
          >
            {data.isLocked ? (
              <>
                <Unlock className="h-3.5 w-3.5" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Lock
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-lg hover:bg-gray-50"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TYPE-SPECIFIC FIELD COMPONENTS
// ============================================================================

function ImageFields({ data }: { data: ImageNodeData }) {
  return (
    <div className="space-y-2">
      {data.url && (
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
          <img src={data.thumbnail || data.url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-500">Size:</span>
          <br />
          {data.width} × {data.height}
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-500">Format:</span>
          <br />
          {data.mimeType?.split("/")[1]?.toUpperCase() || "Unknown"}
        </div>
      </div>
      {data.aiAnalysis && (
        <div className="p-2 bg-violet-50 rounded text-xs">
          <span className="text-violet-600 font-medium">AI Analysis:</span>
          <p className="text-violet-700 mt-1">{data.aiAnalysis.composition}</p>
        </div>
      )}
    </div>
  );
}

function VideoFields({ data }: { data: VideoNodeData }) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-500">Duration:</span>
          <br />
          {formatDuration(data.duration)}
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-500">Resolution:</span>
          <br />
          {data.width} × {data.height}
        </div>
      </div>
      {data.transcription && (
        <div className="p-2 bg-blue-50 rounded text-xs">
          <span className="text-blue-600 font-medium">Transcription:</span>
          <p className="text-blue-700 mt-1 line-clamp-3">{data.transcription.text}</p>
        </div>
      )}
    </div>
  );
}

function DocumentFields({ data }: { data: DocumentNodeData }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-500">Type:</span>
          <br />
          {data.fileType.toUpperCase()}
        </div>
        {data.pageCount && (
          <div className="p-2 bg-gray-50 rounded">
            <span className="text-gray-500">Pages:</span>
            <br />
            {data.pageCount}
          </div>
        )}
      </div>
      {data.summary && (
        <div className="p-2 bg-orange-50 rounded text-xs">
          <span className="text-orange-600 font-medium">Summary:</span>
          <p className="text-orange-700 mt-1 line-clamp-3">{data.summary}</p>
        </div>
      )}
    </div>
  );
}

function NoteFields({
  data,
  nodeId,
  updateNode,
}: {
  data: NoteNodeData;
  nodeId: string;
  updateNode: (id: string, data: any) => void;
}) {
  const colors = ["yellow", "blue", "green", "pink", "purple", "orange"];

  return (
    <div className="space-y-2">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
          <Palette className="h-3 w-3" />
          Color
        </label>
        <div className="flex gap-1">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => updateNode(nodeId, { backgroundColor: color })}
              className={`w-6 h-6 rounded-full border-2 ${
                data.backgroundColor === color ? "border-gray-800" : "border-transparent"
              }`}
              style={{
                backgroundColor:
                  color === "yellow" ? "#FEF3C7" :
                  color === "blue" ? "#DBEAFE" :
                  color === "green" ? "#D1FAE5" :
                  color === "pink" ? "#FCE7F3" :
                  color === "purple" ? "#EDE9FE" :
                  "#FFEDD5",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AIChatFields({ data }: { data: AIChatNodeData }) {
  return (
    <div className="space-y-2">
      <div className="p-2 bg-violet-50 rounded text-xs">
        <span className="text-violet-600 font-medium">Model:</span>
        <br />
        <span className="text-violet-700">{data.model}</span>
      </div>
      <div className="p-2 bg-gray-50 rounded text-xs">
        <span className="text-gray-500">Messages:</span>
        <br />
        {data.conversation?.length || 0} messages
      </div>
      {data.connectedAssetIds && data.connectedAssetIds.length > 0 && (
        <div className="p-2 bg-blue-50 rounded text-xs">
          <span className="text-blue-600 font-medium">Connected Assets:</span>
          <br />
          <span className="text-blue-700">{data.connectedAssetIds.length} items</span>
        </div>
      )}
    </div>
  );
}

function AIGeneratorFields({ data }: { data: AIGeneratorNodeData }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-[var(--accent-primary)]/10 rounded">
          <span className="text-[var(--accent-primary-light)] font-medium">Provider:</span>
          <br />
          <span className="text-[var(--accent-primary)]">{data.provider}</span>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-500">Status:</span>
          <br />
          <span className={
            data.status === "generating" ? "text-amber-600" :
            data.status === "completed" ? "text-[var(--accent-primary-light)]" :
            data.status === "error" ? "text-red-600" :
            "text-gray-600"
          }>
            {data.status}
          </span>
        </div>
      </div>
      <div className="p-2 bg-gray-50 rounded text-xs">
        <span className="text-gray-500">Generated Images:</span>
        <br />
        {data.generationHistory?.length || 0} images
      </div>
      {data.prompt && (
        <div className="p-2 bg-[var(--accent-primary)]/10 rounded text-xs">
          <span className="text-[var(--accent-primary-light)] font-medium">Current Prompt:</span>
          <p className="text-[var(--accent-primary)] mt-1 line-clamp-2">{data.prompt}</p>
        </div>
      )}
    </div>
  );
}

export default NodeInspector;
