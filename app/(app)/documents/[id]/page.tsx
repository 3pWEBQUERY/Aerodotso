import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { ChatPanel } from "@/components/chat/chat-panel";
import { PdfViewer } from "@/components/documents/pdf-viewer";
import { ImageDocumentViewer } from "@/components/documents/image-viewer";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage(props: DocumentPageProps) {
  const { id } = await props.params;

  const supabase = createSupabaseServerClient();

  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !doc) {
    notFound();
  }

  // Get signed URL from Railway Storage
  const storage = getRailwayStorage();
  const { signedUrl: signed, error: signedError } = await storage.createSignedUrl(doc.storage_path, 60 * 60);

  if (signedError || !signed) {
    notFound();
  }

  const mime = doc.mime_type as string | null;
  const isPdf = mime?.includes("pdf");
  const isImage = mime?.startsWith("image/");

  let versions: any[] = [];

  if (isImage) {
    const { data: versionRows, error: versionsError } = await supabase
      .from("document_versions")
      .select("id, storage_path, mime_type, created_at")
      .eq("document_id", id)
      .order("created_at", { ascending: true });

    if (!versionsError && versionRows && versionRows.length > 0) {
      const withUrls = await Promise.all(
        versionRows.map(async (v: any) => {
          const { signedUrl: signedVersion } = await storage.createSignedUrl(v.storage_path, 60 * 60);

          return {
            id: v.id as string,
            url: signedVersion ?? "",
            createdAt: v.created_at as string | null,
            mimeType: v.mime_type as string | null,
            isOriginal: false,
          };
        })
      );

      versions = withUrls.filter((v) => v.url);
    }
  }

  if (isImage) {
    return (
      <ImageDocumentViewer
        id={doc.id as string}
        title={doc.title as string}
        url={signed}
        mimeType={mime}
        createdAt={doc.created_at as string | null}
        versions={versions}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-3rem)]">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight break-all">
          {doc.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          Hochgeladen am {new Date(doc.created_at).toLocaleString()} · {doc.mime_type}
        </p>
      </header>

      <div className="flex-1 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="border rounded-lg overflow-hidden bg-background h-[calc(100vh-12rem)]">
          {isPdf ? (
            <PdfViewer url={signed} title={doc.title as string} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-4">
              <p>
                Für diesen Dateityp ist noch kein spezieller Viewer implementiert.
                Du kannst die Datei direkt
                <a
                  href={signed}
                  target="_blank"
                  rel="noreferrer"
                  className="underline ml-1"
                >
                  öffnen und herunterladen
                </a>
                .
              </p>
            </div>
          )}
        </div>
        <div className="border rounded-lg flex flex-col overflow-hidden bg-background">
          <ChatPanel documentId={doc.id as string} />
        </div>
      </div>
    </div>
  );
}
