"use client";

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

// Ein sehr einfacher PDF-Viewer, der aktuell nur die erste Seite rendert.
// Später kann das zu einem vollwertigen Viewer (Pagination, Zoom, Thumbnails) ausgebaut werden.

// Hinweis: Für ein Produktivsystem wäre es besser, den Worker lokal zu bundlen.
// Für den aktuellen Prototyp nutzen wir das CDN.
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    let destroyed = false;

    const render = async () => {
      try {
        const loadingTask = (pdfjsLib as any).getDocument(url);
        const pdf = await loadingTask.promise;
        if (destroyed) return;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        containerRef.current!.innerHTML = "";
        containerRef.current!.appendChild(canvas);

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (error) {
        console.error("PDF render error", error);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            "<p class='text-xs text-muted-foreground'>PDF konnte nicht geladen werden.</p>";
        }
      }
    };

    render();

    return () => {
      destroyed = true;
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto bg-muted flex items-start justify-center"
    />
  );
}
