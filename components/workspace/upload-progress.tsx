"use client";

import { useState } from "react";
import { X, ChevronUp, ChevronDown, Loader2, Check, FileIcon, Pause, Play, Sparkles, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
  status: "waiting" | "uploading" | "processing" | "done" | "error";
  error?: string;
  documentId?: string;
  analysisStatus?: "pending" | "analyzing" | "done" | "error";
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onCancel: (id: string) => void;
  onCancelAll: () => void;
  onPause?: (id: string) => void;
  onRetry?: (id: string) => void;
  onDismiss: () => void;
}

export function UploadProgress({
  uploads,
  onCancel,
  onCancelAll,
  onDismiss,
}: UploadProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (uploads.length === 0) return null;

  const totalFiles = uploads.length;
  const completedFiles = uploads.filter((u) => u.status === "done").length;
  const totalProgress = uploads.reduce((acc, u) => acc + u.progress, 0) / totalFiles;
  const isAllDone = completedFiles === totalFiles;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getEstimatedTime = () => {
    const remaining = uploads.filter((u) => u.status !== "done").length;
    if (remaining === 0) return "Done";
    if (remaining === 1) return "A few seconds remaining";
    return `A few seconds remaining`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      className="fixed bottom-4 right-4 z-50 w-[380px] bg-white rounded-xl shadow-2xl border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50/50">
        {/* Progress Circle */}
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke={isAllDone ? "#10b981" : "#3b82f6"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * totalProgress) / 100}
              className="transition-all duration-300"
            />
          </svg>
          {!isAllDone && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            </div>
          )}
          {isAllDone && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Check className="h-4 w-4 text-[var(--accent-primary-light)]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {totalFiles} file{totalFiles !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {completedFiles} of {totalFiles} files · {Math.round(totalProgress)}%
          </p>
          <p className="text-xs text-muted-foreground">{getEstimatedTime()}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!isAllDone && (
            <button
              type="button"
              onClick={onCancelAll}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
            >
              Cancel all
            </button>
          )}
          {isAllDone && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
            >
              Dismiss
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-gray-50/50"
                >
                  {/* File Icon */}
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{upload.fileName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(upload.fileSize)}</span>
                      
                      {/* Upload Status */}
                      {upload.status === "waiting" && (
                        <span className="flex items-center gap-1">
                          <Upload className="h-3 w-3" /> Waiting
                        </span>
                      )}
                      {upload.status === "uploading" && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Upload className="h-3 w-3" /> {upload.progress}%
                        </span>
                      )}
                      {upload.status === "error" && (
                        <span className="text-red-500">{upload.error || "Error"}</span>
                      )}
                      
                      {/* Analysis Status - shown after upload */}
                      {(upload.status === "processing" || upload.status === "done") && (
                        <>
                          <span className="text-[var(--accent-primary-light)] flex items-center gap-1">
                            <Check className="h-3 w-3" /> Uploaded
                          </span>
                          <span className="text-muted-foreground">·</span>
                          {upload.analysisStatus === "pending" && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Sparkles className="h-3 w-3" /> Analysis pending
                            </span>
                          )}
                          {upload.analysisStatus === "analyzing" && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Sparkles className="h-3 w-3 animate-pulse" /> Analyzing...
                            </span>
                          )}
                          {upload.analysisStatus === "done" && (
                            <span className="flex items-center gap-1 text-[var(--accent-primary-light)]">
                              <Sparkles className="h-3 w-3" /> Analyzed
                            </span>
                          )}
                          {upload.analysisStatus === "error" && (
                            <span className="flex items-center gap-1 text-orange-500">
                              <Sparkles className="h-3 w-3" /> Analysis failed
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status/Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {upload.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {upload.status === "processing" && upload.analysisStatus === "analyzing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    )}
                    {upload.status === "done" && upload.analysisStatus === "done" && (
                      <Check className="h-4 w-4 text-[var(--accent-primary-light)]" />
                    )}
                    {upload.status === "done" && upload.analysisStatus !== "done" && (
                      <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                    )}
                    {upload.status !== "done" && upload.status !== "processing" && (
                      <button
                        type="button"
                        onClick={() => onCancel(upload.id)}
                        className="p-1 hover:bg-muted rounded opacity-50 hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {!isAllDone && (
              <div className="px-4 py-2 border-t bg-gray-50/30">
                <button
                  type="button"
                  onClick={onCancelAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
