import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client.
// Nutzt die Service-Role für privilegierte Operationen (z.B. Storage Uploads,
// Schreiben in Tabellen, Embeddings-RPCs). Dieser Key DARF NIE in den Browser.

function getSupabaseServerEnv() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server-only secret)");
  }

  return { url, serviceRoleKey };
}

export function createSupabaseServerClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
