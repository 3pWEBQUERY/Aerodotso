"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
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
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Poll for document analysis status
  const pollAnalysisStatus = useCallback((uploadId: string, documentId: string) => {
    // Clear any existing polling for this upload
    const existingInterval = pollingRef.current.get(uploadId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start polling
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/status?documentId=${documentId}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.processed) {
            // Analysis complete
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId
                  ? { ...u, analysisStatus: "done" as const }
                  : u
              )
            );
            // Stop polling
            clearInterval(pollInterval);
            pollingRef.current.delete(uploadId);
          } else {
            // Still analyzing
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId && u.analysisStatus !== "analyzing"
                  ? { ...u, analysisStatus: "analyzing" as const }
                  : u
              )
            );
          }
        }
      } catch (error) {
        console.error("Failed to poll analysis status:", error);
      }
    }, 2000); // Poll every 2 seconds

    pollingRef.current.set(uploadId, pollInterval);

    // Stop polling after 60 seconds (timeout)
    setTimeout(() => {
      const interval = pollingRef.current.get(uploadId);
      if (interval) {
        clearInterval(interval);
        pollingRef.current.delete(uploadId);
        // Mark as error if still not done
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId && u.analysisStatus !== "done"
              ? { ...u, analysisStatus: "error" as const }
              : u
          )
        );
      }
    }, 60000);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current.forEach((interval) => clearInterval(interval));
      pollingRef.current.clear();
    };
  }, []);

  const addUpload = useCallback(async (file: File, workspaceId: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to upload list
    const newUpload: UploadItem = {
      id,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: "waiting",
      analysisStatus: "pending",
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
      const documentId = data.document?.id;

      // Update to done status with document ID, analysis pending
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { 
          ...u, 
          status: "done" as const, 
          progress: 100,
          documentId,
          analysisStatus: "pending" as const,
        } : u))
      );

      // Start polling for analysis status if we have a document ID
      if (documentId) {
        // Small delay before starting to poll
        setTimeout(() => {
          pollAnalysisStatus(id, documentId);
        }, 1000);
      }

      return data;
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: "error" as const, error: "Upload failed" } : u
        )
      );
      throw error;
    }
  }, [pollAnalysisStatus]);

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
