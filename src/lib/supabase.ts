import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Serverový klient bez session (len verejné dáta, RLS). */
export function serverClient(): SupabaseClient {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

let browser: SupabaseClient | null = null;
/** Klient v prehliadači (admin session v localStorage). */
export function browserClient(): SupabaseClient {
  if (!browser) browser = createClient(url, key, { auth: { persistSession: true, storageKey: "rem-admin-auth" } });
  return browser;
}
