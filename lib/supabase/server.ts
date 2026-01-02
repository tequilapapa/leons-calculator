// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL and anon key are required. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    )
  }

  // For now we don't care about auth/session cookies for this project.
  // We just need a working server client to insert leads.
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll(_cookies) {
        // no-op for now – we are not persisting auth cookies
      },
    },
  })
}