 "use client";

 import Link from "next/link";
 import { useState } from "react";
 import { signIn } from "next-auth/react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";

 export default function RegisterPage() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);

   const onSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
     setIsLoading(true);

     try {
       const res = await fetch("/api/auth/register", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ email, password }),
       });

       const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registrierung fehlgeschlagen.");
      }

      await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/workspace",
      });
    } catch (err: any) {
      setError(err.message ?? "Registrierung fehlgeschlagen.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Konto erstellen</h1>
          <p className="text-sm text-muted-foreground">
            Starte dein neues Miza‑Workspace für Lernen & Creation.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="email">
              E‑Mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="password">
              Passwort
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registriere..." : "Registrieren"}
          </Button>
        </form>
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Bereits ein Konto?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Zum Login
          </Link>
        </p>
      </div>
    </main>
  );
}
