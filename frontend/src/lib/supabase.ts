import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Fail fast with a clear error instead of cryptic "Invalid URL" from createClient
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Copy frontend/.env.example → frontend/.env.local and fill in:\n' +
    '  VITE_SUPABASE_URL=\n' +
    '  VITE_SUPABASE_ANON_KEY='
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
