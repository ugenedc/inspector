// DEPRECATED: Use @/lib/supabase instead
// This file is kept for backward compatibility
import { createClientSupabase } from '@/lib/supabase'

export function createClient() {
  return createClientSupabase()
}