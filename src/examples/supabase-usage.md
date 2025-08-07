# Unified Supabase Module Usage Examples

This guide demonstrates how to use the new `@/lib/supabase` module in different contexts throughout your Next.js application.

## Import Statement

```typescript
import { 
  createClientSupabase,
  createServerSupabase,
  createSupabase,
  createMiddlewareSupabase,
  isServerContext,
  resetBrowserClient,
  type SupabaseClient
} from '@/lib/supabase'

// Or use the default export
import supabaseLib from '@/lib/supabase'
```

## Client-Side Usage (React Components)

### Basic Client Component
```typescript
import { createClientSupabase } from '@/lib/supabase'

export function AuthForm() {
  const supabase = createClientSupabase() // Singleton instance
  
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  // Same instance returned on subsequent calls
  const sameInstance = createClientSupabase() // === supabase
}
```

### Using Default Export
```typescript
import supabaseLib from '@/lib/supabase'

export function UserProfile() {
  const supabase = supabaseLib.client()
  
  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}
```

### Custom Hook Pattern
```typescript
import { useState, useEffect } from 'react'
import { createClientSupabase, type SupabaseClient } from '@/lib/supabase'

export function useSupabase() {
  const [supabase] = useState<SupabaseClient>(() => createClientSupabase())
  return supabase
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClientSupabase()
    
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { user, loading }
}
```

## Server-Side Usage (Server Components & API Routes)

### Server Component
```typescript
import { createServerSupabase } from '@/lib/supabase'

export default async function DashboardPage() {
  const supabase = await createServerSupabase() // Note: await required
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome {user.email}</h1>
    </div>
  )
}
```

### API Route
```typescript
import { createServerSupabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch user-specific data
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', user.id)
  
  return NextResponse.json({ data, error })
}
```

## Universal Usage (Context-Aware)

```typescript
import { createSupabase, isServerContext } from '@/lib/supabase'

export async function universalAuthCheck() {
  const supabase = isServerContext() 
    ? await createSupabase() 
    : createSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

export async function getUserProfile(userId: string) {
  const supabase = isServerContext() 
    ? await createServerSupabase()
    : createClientSupabase()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}
```

## Middleware Usage

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabase } from '@/lib/supabase'

export async function customMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareSupabase(request, response)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && request.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return response
}
```

## Testing Utilities

```typescript
import { resetBrowserClient } from '@/lib/supabase'

export function setupTestEnvironment() {
  // Reset the singleton for clean test state
  resetBrowserClient()
  
  // Mock environment variables if needed
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
}
```

## Migration Guide

### From Old Pattern:
```typescript
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Client
const supabase = createClient()

// Server  
const supabase = await createServerClient()
```

### To New Pattern:
```typescript
import { createClientSupabase, createServerSupabase } from '@/lib/supabase'

// Client
const supabase = createClientSupabase()

// Server
const supabase = await createServerSupabase()
```

### Or Using Default Export:
```typescript
import supabase from '@/lib/supabase'

// Client
const client = supabase.client()

// Server
const server = await supabase.server()
```

## Key Benefits

- **Singleton Pattern**: Prevents duplicate instances in client-side code
- **Context-Aware**: Automatically chooses the right implementation
- **SSR Support**: Proper server-side rendering with cookie handling
- **Type Safety**: Full TypeScript support with proper return types
- **Easy Migration**: Backward compatibility with existing patterns
- **Performance**: Optimized for both client and server environments