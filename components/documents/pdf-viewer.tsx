"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface PdfViewerProps {
  url: string;
  title?: string;
}

// Dynamically import the PDF viewer content to avoid SSR issues with pdfjs-dist
const PdfViewerContent = dynamic(
  () => import("./pdf-viewer-content").then((mod) => mod.PdfViewerContent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">PDF Viewer wird geladen...</p>
        </div>
      </div>
    ),
  }
);

export function PdfViewer({ url, title }: PdfViewerProps) {
  return <PdfViewerContent url={url} title={title} />;
}
