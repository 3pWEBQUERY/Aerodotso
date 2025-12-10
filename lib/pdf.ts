// PDF text extraction utilities for Miza

/**
 * Extract text from a PDF buffer using pdfjs-dist
 * This runs on the server side
 */
export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  // Dynamic import for server-side PDF.js
  const pdfjsLib = await import("pdfjs-dist");
  
  // Set worker source for Node.js environment
  // Note: In production, you may need to handle this differently
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
  }).promise;

  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ");
    
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

/**
 * Extract text from a PDF URL (signed Supabase Storage URL)
 */
export async function extractTextFromPdfUrl(url: string): Promise<string> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  return extractTextFromPdf(buffer);
}

/**
 * Get PDF metadata
 */
export async function getPdfMetadata(pdfBuffer: ArrayBuffer): Promise<{
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  creationDate?: Date;
}> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
  }).promise;

  const metadata = await pdf.getMetadata();
  const info = metadata.info as Record<string, unknown>;

  return {
    numPages: pdf.numPages,
    title: info?.Title as string | undefined,
    author: info?.Author as string | undefined,
    subject: info?.Subject as string | undefined,
    creationDate: info?.CreationDate
      ? new Date(info.CreationDate as string)
      : undefined,
  };
}

/**
 * Extract text from first N pages only (for preview/summary)
 */
export async function extractPreviewText(
  pdfBuffer: ArrayBuffer,
  maxPages: number = 3
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
  }).promise;

  const textParts: string[] = [];
  const pagesToExtract = Math.min(maxPages, pdf.numPages);

  for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ");
    
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

/**
 * Check if a file is a valid PDF
 */
export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

/**
 * Get approximate word count from extracted text
 */
export function getWordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Clean extracted PDF text (remove excessive whitespace, etc.)
 */
export function cleanPdfText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/[ \t]+/g, " ")
    // Remove excessive newlines
    .replace(/\n{3,}/g, "\n\n")
    // Remove page break artifacts
    .replace(/\f/g, "\n\n")
    // Trim
    .trim();
}
