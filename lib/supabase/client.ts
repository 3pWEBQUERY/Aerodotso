import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client.
// Uses ONLY the public anon key and is safe for read-only / less sensitive operations.
// All privileged operations (storage writes, DB mutations) sollten über Server-Routen laufen.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // In der Browser-Build-Phase werfen wir lieber früh einen Fehler,
  // falls die ENV-Variablen nicht gesetzt sind.
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
