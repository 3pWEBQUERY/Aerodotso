# Projektplan – Miza (AI Workspace für Schüler & Creator)

> Dieser Plan beschreibt Architektur, Features, Technik‑Stack, DSGVO‑Konzept und eine schrittweise Roadmap für deine App. Alle Snippets sind Beispiele, die du anpassen kannst.

---

## 1. Vision & Zielgruppen

### 1.1 Vision

Miza ist ein **AI‑gestütztes digitales Gehirn** für:

- **Schüler**: Lernunterlagen organisieren, Stoff verstehen, Zusammenfassungen und Übungsfragen generieren, Lernfortschritt tracken.
- **Creator**: Ideen, Skripte, Inspiration, Referenzen (Links, Videos, PDFs) sammeln und mit KI zu Content ausbauen.

Im Kern: **Upload + Struktur + Suche + KI‑Interaktion**, komplett **EU‑/DSGVO‑fokussiert**, mit klarer Datenschutz‑Story.

### 1.2 Leitprinzipien

- **Privacy‑First** (EU‑Storage, minimale Daten, keine unnötigen Tracker)
- **Clarity‑First UI** (wenige, klare Oberflächen, gute Defaults)
- **Long‑Term Maintainability** (saubere Architektur, modulare Services)
- **Progressive Enhancement** (erst stabiler Core, dann Canvas/3D/advanced Features)

---

## 2. Technischer Stack (High Level)

- **Framework**: Next.js 16 (App Router, RSC)
- **UI**: React + Tailwind + shadcn/ui + Lucide Icons
- **Animationen**: Framer Motion
- **3D / Visuals**: Three.js (mit `@react-three/fiber`, optional `drei`)
- **PDF‑Rendering**: PDF.js
- **Datenbank**: Supabase (Postgres)
- **Auth**: Next-Auth
- **File Storage**: Supabase Storage (EU‑Region)
- **Vektor‑Suche**: Supabase mit `pgvector` / Vector Extension
- **Analytics**: PostHog (EU‑Region / Self‑hosted, DSGVO‑konform konfiguriert)
- **PWA**: Web App Manifest + Service Worker (Next.js kompatibel)
- **KI‑Schicht**: externe LLM‑Provider (z.B. Mistral) oder abstrahiert über eine interne `LLMClient`‑Schnittstelle

---

## 3. Projektstruktur (Next.js App Router)

### 3.1 Ordnerstruktur

```text
miza/
  app/
    (marketing)/
      layout.tsx
      page.tsx              # Landingpage
    (auth)/
      login/page.tsx
      register/page.tsx
      callback/route.ts     # optional OAuth‑Callback
    (app)/
      layout.tsx            # App‑Shell mit Sidebar, Header
      dashboard/page.tsx
      documents/
        page.tsx            # Dokumentenliste
        [id]/page.tsx       # Dokument‑Detail mit PDF.js / Viewer + Chat
      settings/
        page.tsx
    api/
      auth/
        route.ts            # Supabase‑Auth‑Helper (optional)
      documents/
        upload/route.ts     # Upload‑Endpoint
        index/route.ts      # Volltext/Vektor‑Suche
      chat/
        route.ts            # KI‑Chat mit eigenen Daten
      events/posthog/route.ts # optional Proxy
  components/
    ui/                     # shadcn/ui
    layout/
    documents/
    chat/
    charts/
    three/
  lib/
    supabase/
      client.ts
      server.ts
    auth.ts
    validation.ts
    llm.ts
    embeddings.ts
    pdf.ts
    posthog.ts
  public/
    icons/
    manifest.json
    sw.js                   # Service Worker (PWA)
  prisma/ or supabase/      # je nach ORM/Schema‑Ansatz
  PLAN.md
  next.config.mjs
  package.json
  tsconfig.json
```

*(Die genaue Struktur kannst du beim Umsetzen leicht anpassen – Plan zeigt nur das Zielbild.)*

---

## 4. Supabase Integration (DB, Auth, Storage, Vektoren)

### 4.1 Environment Variables

`.env.local` (nicht committen):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="service-role-key" # nur auf Servern, nicht im Browser
LLM_API_KEY="..."                            # z.B. Mistral
POSTHOG_API_KEY="phc_..."
POSTHOG_HOST="https://eu.posthog.com"        # EU Region
```

### 4.2 Supabase Client (Client Components)

`lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 4.3 Supabase Client (Server Components / Route Handlers)

`lib/supabase/server.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

### 4.4 Auth‑Flows (Login/Registrierung)

- Nutzung von Supabase Auth (Email+Passwort, optional OAuth in späterer Phase)
- DSGVO: Passwort‑Reset & Account‑Löschung verfügbar machen, keine unnötigen Profildaten.

**Beispiel: Registrierung Server Action**

```ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
```

### 4.5 Datenmodell (High Level)

Supabase Postgres Tabellen (vereinfachter Vorschlag):

```sql
-- users kommen aus auth.users

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('student', 'creator')) not null,
  display_name text,
  created_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text check (type in ('pdf', 'image', 'note', 'link')) not null,
  subject text,         -- Fach (für Schüler)
  topic text,           -- frei für Creator/Student
  storage_path text,    -- Pfad im Supabase Storage
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.document_texts (
  document_id uuid primary key references documents(id) on delete cascade,
  full_text text,         -- extrahierter Text
  tokens integer          -- optional: Tokenanzahl
);

create extension if not exists vector;

create table public.document_embeddings (
  document_id uuid references documents(id) on delete cascade,
  chunk_id int,
  content text not null,
  embedding vector(1536), -- abhängig vom Modell
  primary key (document_id, chunk_id)
);

create index on public.document_embeddings using ivfflat (embedding vector_cosine_ops);

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table public.chat_messages (
  id bigserial primary key,
  session_id uuid references chat_sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  created_at timestamptz default now()
);
```

### 4.6 Supabase Storage Buckets

Buckets (über Supabase UI / SQL anlegen):

- `documents` – alle Uploads
- Optional `thumbnails` – generierte Vorschaubilder

Beispiel Upload (Route Handler):

```ts
// app/api/documents/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") || "Untitled");

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fileExt = file.name.split(".").pop();
  const objectName = `${user.id}/${randomUUID()}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(objectName, buffer, {
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // TODO: Eintrag in documents & document_texts + Embeddings generieren (siehe KI‑Pipeline)

  return NextResponse.json({ success: true });
}
```

---

## 5. KI‑Pipeline (Embeddings, Suche, Chat)

### 5.1 Text‑Extraktion (z.B. PDFs)

- Verwende PDF.js auf dem Server oder eine dedizierte Parsing‑Lib.
- Pipeline nach Upload:
  1. Datei speichern
  2. Text extrahieren
  3. In `document_texts` speichern
  4. In Chunks aufteilen und Embeddings erzeugen
  5. Embeddings in `document_embeddings` speichern

Beispiel Chunking & Embeddings (Pseudocode in `lib/embeddings.ts`):

```ts
import type { DocumentChunk } from "./types";

export function chunkText(text: string, maxChars = 1000): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let index = 0;
  for (let i = 0; i < text.length; i += maxChars) {
    const chunk = text.slice(i, i + maxChars);
    chunks.push({ id: index++, content: chunk });
  }
  return chunks;
}

export async function embedChunks(chunks: DocumentChunk[]): Promise<number[][]> {
  // Call to Embeddings‑Provider (z.B. Mistral/OpenAI/own service)
  // Hier nur Interface skizziert.
  const response = await fetch("https://your-embedding-endpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: chunks.map((c) => c.content),
    }),
  });

  const data = await response.json();
  return data.embeddings as number[][];
}
```

### 5.2 Semantische Suche

Route Handler `app/api/documents/index/route.ts` (vereinfachtes Beispiel):

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const queryEmbedding = await embedQuery(query); // 1 x vector

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 10,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data });
}
```

Beispiel `match_documents` Function (Supabase SQL):

```sql
create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int,
  user_id uuid
)
returns table (
  document_id uuid,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    e.document_id,
    e.content,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.document_embeddings e
  join public.documents d on d.id = e.document_id
  where d.user_id = match_documents.user_id
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
```

### 5.3 KI‑Chat mit eigenen Daten

- Schritt 1: Query kommt rein, Embedding‑Suche liefert kontextuelle Snippets.
- Schritt 2: Diese Snippets werden in den Prompt des LLM gepackt.

`lib/llm.ts` (Beispiel mit generischer `callLLM` Funktion):

```ts
export async function callLLM({
  prompt,
  context,
}: {
  prompt: string;
  context: string;
}): Promise<string> {
  const body = {
    model: "mistral-large-latest", // Beispiel
    messages: [
      {
        role: "system",
        content:
          "Du bist ein hilfreicher Tutor/Coach. Antworte knapp, strukturiert und nutze nur den gelieferten Kontext.",
      },
      {
        role: "user",
        content: `Kontext:\n${context}\n\nFrage:\n${prompt}`,
      },
    ],
  };

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM error: ${text}`);
  }

  const json = await response.json();
  return json.choices[0].message.content as string;
}
```

Route Handler `app/api/chat/route.ts` (vereinfacht):

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import { callLLM } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { question } = await req.json();

  if (!question) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queryEmbedding = await embedQuery(question);

  const { data: matches, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 8,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const context = matches
    .map((m: any) => m.content)
    .join("\n---\n")
    .slice(0, 8000); // Safety

  const answer = await callLLM({ prompt: question, context });

  return NextResponse.json({ answer, contextUsed: matches });
}
```

---

## 6. Frontend: UI, Layout, Animationen

### 6.1 App‑Shell Layout (shadcn/ui)

`app/(app)/layout.tsx` (Skizze):

```tsx
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PosthogProvider } from "@/lib/posthog";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-background text-foreground">
        <PosthogProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </PosthogProvider>
      </body>
    </html>
  );
}
```

### 6.2 Dashboard‑Seite mit Framer Motion

`app/(app)/dashboard/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-semibold">Willkommen zurück</h1>
        <p className="text-muted-foreground">
          Lade neue Unterlagen hoch oder arbeite an deinen bestehenden Projekten.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex gap-4"
      >
        <Button>Dokument hochladen</Button>
        <Button variant="outline">Neuer Chat</Button>
      </motion.div>
    </div>
  );
}
```

### 6.3 Dokument‑Detail mit PDF.js und Chat

- Links: PDF Viewer (PDF.js)
- Rechts: Chat‑Panel mit eigener KI

`components/documents/pdf-viewer.tsx` (Client‑Component, dynamic import empfohlen):

```tsx
"use client";

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";

export function PdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const load = async () => {
      const pdf = await pdfjsLib.getDocument(url).promise;
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
    };

    load();
  }, [url]);

  return <div ref={containerRef} className="w-full h-full overflow-auto" />;
}
```

Dokument‑Seite `app/(app)/documents/[id]/page.tsx` (Skizze):

```tsx
import { PdfViewer } from "@/components/documents/pdf-viewer";
import { ChatPanel } from "@/components/chat/chat-panel";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  // TODO: Dokument aus Supabase laden, URL signieren
  const pdfUrl = "https://..."; // signierte URL aus Storage

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4 h-[calc(100vh-3rem)]">
      <div className="border rounded-lg overflow-hidden">
        <PdfViewer url={pdfUrl} />
      </div>
      <div className="border rounded-lg flex flex-col">
        <ChatPanel documentId={id} />
      </div>
    </div>
  );
}
```

### 6.4 Chat‑Panel (mit Streaming optional)

`components/chat/chat-panel.tsx` (vereinfachtes Beispiel ohne Streaming):

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatPanel({ documentId }: { documentId?: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const send = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, documentId }),
    });

    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer ?? "Keine Antwort." },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-2 p-3 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user" ? "text-right" : "text-left text-muted-foreground"
            }
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="border-t p-3 space-y-2">
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frag die KI zu diesem Dokument..."
        />
        <Button className="w-full" onClick={send}>
          Senden
        </Button>
      </div>
    </div>
  );
}
```

---

## 7. Three.js für Visuals & späteren Knowledge‑Graph

### 7.1 Einsatzszenarien

- **Landingpage**: Subtile 3D‑Visualisierung (z.B. schwebende Karten/Nodes).
- **Später**: Semantische Map deiner Notizen (Knowledge Graph) als 3D‑Ansicht.

### 7.2 Grundsetup mit `@react-three/fiber`

`components/three/scene.tsx`:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Bubble() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#6366f1" emissive="#4f46e5" />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} />
      <Bubble />
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
}
```

Landingpage Ausschnitt `app/(marketing)/page.tsx`:

```tsx
import dynamic from "next/dynamic";

const HeroScene = dynamic(() => import("@/components/three/scene").then(m => m.HeroScene), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 items-center min-h-[70vh]">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Dein digitales Gehirn für Schule & Content.
        </h1>
        <p className="text-muted-foreground">
          Sammle Unterlagen, Ideen und Links an einem Ort und nutze KI, um
          besser zu lernen und besseren Content zu erstellen.
        </p>
      </div>
      <div className="h-[300px] rounded-xl bg-muted overflow-hidden">
        <HeroScene />
      </div>
    </div>
  );
}
```

---

## 8. PWA‑Fähigkeiten

### 8.1 Manifest

`public/manifest.json`:

```json
{
  "name": "Miza – AI Workspace",
  "short_name": "Miza",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#020817",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

`app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Miza – AI Workspace",
    short_name: "Miza",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#020817",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      }
    ],
  };
}
```

### 8.2 Service Worker (vereinfachtes Beispiel)

`public/sw.js` (statisch oder über Build generiert):

```js
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Cleanup alter Caches
});

self.addEventListener("fetch", (event) => {
  // Optional: Cache‑Strategie für statische Assets
});
```

Registrierung im Client, z.B. `app/(app)/layout.tsx` (Client‑Wrapper):

```tsx
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return null;
}
```

Im Layout einbinden:

```tsx
// ...
<body>
  <ServiceWorkerRegister />
  {/* Rest */}
</body>
```

---

## 9. PostHog Analytics (EU‑/DSGVO‑freundlich)

### 9.1 Grundsetup

`lib/posthog.tsx`:

```tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // wir steuern manuell
      persistence: "memory",  // keine Cookies bevor Consent
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

Env‑Variablen:

```bash
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://eu.posthog.com"
```

### 9.2 Events (Beispiele)

```tsx
"use client";

import { usePostHog } from "posthog-js/react";

export function UploadButton() {
  const posthog = usePostHog();

  const onClick = () => {
    posthog?.capture("upload_clicked");
    // ... Dialog öffnen
  };

  return <button onClick={onClick}>Upload</button>;
}
```

- Später: Consent‑Banner, das PostHog nur nach Zustimmung dauerhaft aktiviert (und Persistence auf `localStorage`/`cookie` stellt).

---

## 10. DSGVO‑/EU‑Konzept (technischer Teil)

### 10.1 Datenstandort

- Supabase‑Projekt in **EU‑Region** anlegen (z.B. Frankfurt).
- PostHog in **EU‑Region** oder selbst gehostet in EU.
- KI‑Provider mit klarer Datenschutz‑Policy (keine Trainingsnutzung der Daten ohne Opt‑in).

### 10.2 Datenminimierung

- Profil nur mit notwendigen Feldern (Rolle `student`/`creator`, optional Display‑Name).
- Keine Third‑Party‑Tracker außer PostHog, und das nur nach Consent.
- Logs ohne Inhalte der Dokumente, nur technische Metriken & IDs.

### 10.3 Rechte der Nutzer

Implementieren:

- **Account löschen** →
  - Einträge in `profiles`, `documents`, `document_texts`, `document_embeddings`, `chat_sessions`, `chat_messages` werden gelöscht (ON DELETE CASCADE, plus Storage Cleanup).
- **Datenexport** →
  - ZIP‑Download aller Dateien + JSON‑Export der Metadaten/Chats.

### 10.4 Verträge & Doku (non‑code)

- AV‑Verträge mit Supabase, PostHog, KI‑Provider.
- Datenschutzseite in der App mit:
  - Welche Daten?
  - Wo gespeichert?
  - Wie lange?
  - Wie löschen/exportieren?

---

## 11. Entwicklungs‑Workflow & Qualität

### 11.1 Linting & Formatting

- ESLint, Prettier, TypeScript strict.
- Husky + lint‑staged optional.

### 11.2 Testing

- Unit Tests für kritische Logic (`embeddings`, `chunking`, `auth`).
- E2E Tests (Playwright) für Kernflows: Login, Upload, Suche, Chat.

### 11.3 Observability

- Logs über Next.js + optional externe Loglösung (EU‑hosted).

---

## 12. Roadmap & konkrete Schritte

### Phase 0 – Setup (1–2 Tage)

- Next.js Projekt aufräumen (Remove Default Page).
- Supabase Projekt (EU) anlegen, Env‑Variablen setzen.
- Supabase Tabellen & Storage Buckets anlegen.
- Supabase Client (Server + Browser) implementieren.

### Phase 1 – Auth & Basis‑App (3–5 Tage)

- Supabase Auth (Register/Login/Logout) implementieren.
- `profiles` Tabelle & Rolle (student/creator) setzen.
- (app) Layout mit Sidebar, Dashboard.

### Phase 2 – Upload & Dokumentenverwaltung (5–7 Tage)

- Upload‑Route + UI bauen.
- Dokument‑Liste & Detailseite.
- PDF.js Viewer für PDFs.
- Erste simple Notizen (Textdokumente) hinzufügen.

### Phase 3 – Embeddings & Suche (5–7 Tage)

- Text‑Extraktion nach Upload.
- Chunking + Embeddings (Serverfunktion).
- Vektor‑Suche + API + UI‑Suchfeld.

### Phase 4 – KI‑Chat (5–7 Tage)

- Chat‑UI (ChatPanel) mit Verlauf.
- Chat‑Route, die Embeddings + LLM kombiniert.
- Speichern von Chats in `chat_sessions`/`chat_messages`.

### Phase 5 – Zielgruppen‑Features (7–10 Tage)

- Schüler: Fächer, Lernkarten/Quiz‑Generator.
- Creator: Projekt‑Boards, Ideen‑Generator.

### Phase 6 – PWA, Three.js, Feinschliff (laufend)

- Manifest + Service Worker.
- Drei.js Visualisierung.
- Framer Motion für Übergänge.
- PostHog sauber mit Consent verbinden.

---

## 13. Nächste konkrete Coding‑Tasks (Startpunkt)

1. `app`‑Struktur anpassen: `(marketing)`, `(auth)`, `(app)` anlegen.
2. Supabase Projekt (EU) erstellen und Env‑Variablen setzen.
3. Tabellen aus diesem Plan in Supabase definieren.
4. `lib/supabase/server.ts` & `lib/supabase/client.ts` erstellen.
5. Einfache Register/Login‑Seiten mit Supabase Auth.
6. Dashboard‑Skeleton mit shadcn/ui & Framer Motion.
7. Upload‑Endpoint & Upload‑Formular (PDF/Text) implementieren.
8. PDF.js Viewer einbauen.
9. Text‑Extraktion + Embeddings‑Pipeline hinzufügen.
10. Vektor‑Suche API & UI.
11. Chat API + Panel.
12. PostHog minimal integrieren (ohne Cookies bis Consent ready ist).
13. Manifest & Service Worker für PWA.

Damit hast du eine klare Roadmap und konkrete Snippets, um Schritt für Schritt die App aufzubauen.
