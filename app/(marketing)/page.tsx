import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Dynamic import for Three.js scene (no SSR)
const HeroScene = dynamic(
  () => import("@/components/three/scene").then((m) => m.HeroScene),
  { ssr: false }
);

export default function LandingPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-background/80 text-foreground flex items-center justify-center px-6">
      <div className="grid gap-8 lg:grid-cols-2 items-center max-w-6xl w-full">
        {/* Text Content */}
        <div className="space-y-6">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Miza · AI Workspace
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
            Dein digitales Gehirn
            <span className="block text-muted-foreground">
              für Schule & Content.
            </span>
          </h1>
          <p className="max-w-xl text-base sm:text-lg text-muted-foreground">
            Sammle Unterlagen, Ideen und Links an einem Ort. Nutze KI, um besser
            zu lernen und besseren Content zu erstellen – DSGVO‑fokussiert und
            für die Ewigkeit gebaut.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button asChild size="lg">
              <Link href="/register">Kostenlos starten</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Login</Link>
            </Button>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground block">
            Frühe Alpha · noch in Entwicklung
          </span>
        </div>

        {/* 3D Scene */}
        <div className="h-[300px] lg:h-[400px] rounded-xl bg-muted/30 overflow-hidden">
          <HeroScene />
        </div>
      </div>
    </main>
  );
}
