// DEPRECATED: Use @/lib/supabase instead
// This file is kept for backward compatibility
import { createServerSupabase } from '@/lib/supabase'

export async function createClient() {
  return createServerSupabase()
}