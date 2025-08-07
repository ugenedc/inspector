import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Environment variables validation
function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Global client instance for browser context (singleton)
let browserClient: SupabaseClient | null = null

/**
 * Creates or returns existing Supabase client for browser/client-side usage
 * Implements singleton pattern to avoid duplicate instances
 */
export function createClientSupabase(): SupabaseClient {
  // Return existing instance if available
  if (browserClient) {
    return browserClient
  }

  const { supabaseUrl, supabaseAnonKey } = validateEnvironment()

  // Create new instance for browser
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  
  return browserClient
}

/**
 * Creates Supabase client for server-side usage with proper cookie handling
 * Each call creates a new instance with fresh cookie state for SSR
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  // Dynamic import to avoid bundling in client components
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  const { supabaseUrl, supabaseAnonKey } = validateEnvironment()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Creates Supabase client for middleware usage with request/response cookie handling
 * Used in middleware.ts for route protection and session management
 */
export function createMiddlewareSupabase(
  request: Request,
  response: Response
): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = validateEnvironment()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const requestCookies = new Map()
        request.headers.get('cookie')?.split(';').forEach(cookie => {
          const [name, value] = cookie.trim().split('=')
          if (name && value) {
            requestCookies.set(name, decodeURIComponent(value))
          }
        })
        return Array.from(requestCookies.entries()).map(([name, value]) => ({ name, value }))
      },
              setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            const cookie = `${name}=${encodeURIComponent(value)}`
            response.headers.append('Set-Cookie', cookie)
          })
        },
    },
  })
}

/**
 * Universal Supabase client that automatically chooses the right implementation
 * based on the execution context (client vs server)
 * 
 * @returns Promise<SupabaseClient> for server context, SupabaseClient for client context
 */
export function createSupabase(): SupabaseClient | Promise<SupabaseClient> {
  // Server-side context
  if (typeof window === 'undefined') {
    return createServerSupabase()
  }
  
  // Client-side context
  return createClientSupabase()
}

/**
 * Type guard to check if we're in a server context
 */
export function isServerContext(): boolean {
  return typeof window === 'undefined'
}

/**
 * Type guard to check if we're in a client context
 */
export function isClientContext(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Reset the browser client instance (useful for testing or auth state changes)
 */
export function resetBrowserClient(): void {
  browserClient = null
}

// Re-export types for convenience
export type { SupabaseClient } from '@supabase/supabase-js'

// Default export for most common usage
const supabaseLib = {
  client: createClientSupabase,
  server: createServerSupabase,
  middleware: createMiddlewareSupabase,
  universal: createSupabase,
  isServer: isServerContext,
  isClient: isClientContext,
  reset: resetBrowserClient,
}

export default supabaseLib