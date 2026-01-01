"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { DocumentNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  FileText, 
  Trash2, 
  Copy, 
  ExternalLink,
  Sparkles,
  FileType,
  BookOpen
} from "lucide-react";

const FILE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileType, color: "text-red-500" },
  docx: { icon: FileText, color: "text-blue-500" },
  txt: { icon: FileText, color: "text-gray-500" },
  md: { icon: BookOpen, color: "text-purple-500" },
};

function DocumentNode({ id, data, selected }: NodeProps<DocumentNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const { deleteNode, duplicateNode } = useCanvasStore();

  const fileConfig = FILE_ICONS[data.fileType] || FILE_ICONS.txt;
  const FileIcon = fileConfig.icon;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleOpen = () => {
    if (data.url) {
      window.open(data.url, "_blank");
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl border shadow-sm overflow-hidden
        transition-all duration-200 cursor-pointer
        ${selected ? "ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-gray-200 hover:border-gray-300"}
      `}
      style={{ width: 240, minHeight: 160 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleOpen}
    >
      {/* Connection Handles - outside card when selected */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-left-4 !opacity-100' : '!opacity-0'}`}
        style={{ top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-right-4 !opacity-100' : '!opacity-0'}`}
        style={{ top: '50%' }}
      />

      {/* Document Preview Area */}
      <div className="h-24 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center relative">
        <div className="w-14 h-16 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center border">
          <FileIcon className={`h-6 w-6 ${fileConfig.color}`} />
          <span className="text-[8px] uppercase font-bold text-gray-400 mt-1">
            {data.fileType}
          </span>
        </div>

        {/* Page count badge */}
        {data.pageCount && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/80 rounded text-[10px] text-gray-500">
            {data.pageCount} pages
          </div>
        )}

        {/* AI Summary badge */}
        {data.summary && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/90 text-white text-[10px] rounded-xl">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Summarized</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className={`h-4 w-4 flex-shrink-0 ${fileConfig.color}`} />
            <span className="text-sm font-medium text-gray-700 truncate">
              {data.label || "Document"}
            </span>
          </div>

          {/* Actions */}
          {isHovered && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleOpen}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                title="Open"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Summary preview */}
        {data.summary && (
          <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">
            {data.summary}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(DocumentNode);
