"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { UploadProgress, UploadItem } from "@/components/workspace/upload-progress";

interface UploadContextType {
  uploads: UploadItem[];
  addUpload: (file: File, workspaceId: string) => Promise<any>;
  cancelUpload: (id: string) => void;
  cancelAllUploads: () => void;
  clearCompleted: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}

interface UploadProviderProps {
  children: ReactNode;
}

export function UploadProvider({ children }: UploadProviderProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  const addUpload = useCallback(async (file: File, workspaceId: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to upload list
    const newUpload: UploadItem = {
      id,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: "waiting",
    };
    
    setUploads((prev) => [...prev, newUpload]);
    setShowProgress(true);

    // Update status to uploading
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "uploading" as const, progress: 10 } : u))
    );

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploads((prev) =>
          prev.map((u) => {
            if (u.id === id && u.status === "uploading" && u.progress < 90) {
              return { ...u, progress: u.progress + 10 };
            }
            return u;
          })
        );
      }, 200);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Update to processing status
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "processing" as const, progress: 95 } : u))
      );

      // Mark as done after a short delay (processing happens async)
      setTimeout(() => {
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "done" as const, progress: 100 } : u))
        );
      }, 1000);

      return data;
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: "error" as const, error: "Upload failed" } : u
        )
      );
      throw error;
    }
  }, []);

  const cancelUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const cancelAllUploads = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === "done"));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads([]);
    setShowProgress(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setUploads([]);
    setShowProgress(false);
  }, []);

  return (
    <UploadContext.Provider
      value={{
        uploads,
        addUpload,
        cancelUpload,
        cancelAllUploads,
        clearCompleted,
      }}
    >
      {children}
      {showProgress && uploads.length > 0 && (
        <UploadProgress
          uploads={uploads}
          onCancel={cancelUpload}
          onCancelAll={cancelAllUploads}
          onDismiss={handleDismiss}
        />
      )}
    </UploadContext.Provider>
  );
}
