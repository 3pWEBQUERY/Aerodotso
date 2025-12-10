 "use client";

 import Link from "next/link";
 import { useState } from "react";
 import { signIn } from "next-auth/react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";

 export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/workspace",
    });

    if (result?.error) {
      setError("Login fehlgeschlagen. Bitte prüfe deine Zugangsdaten.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Login</h1>
          <p className="text-sm text-muted-foreground">
            Melde dich an, um auf dein Miza‑Workspace zuzugreifen.
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
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
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Einloggen..." : "Einloggen"}
          </Button>
        </form>
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Noch kein Konto?{" "}
          <Link href="/register" className="underline underline-offset-4">
            Registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}
