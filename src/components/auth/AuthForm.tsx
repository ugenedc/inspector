'use client'

import { useState } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClientSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        
        if (error) throw error
        
        setMessage({
          type: 'success',
          text: 'Check your email for the confirmation link!',
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-24">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-12">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-600">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <a
                  href="/signup"
                  className="text-gray-900 font-medium hover:underline"
                >
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <a
                  href="/login"
                  className="text-gray-900 font-medium hover:underline"
                >
                  Sign in
                </a>
              </>
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-900 mb-3">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-3">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && (
            <div
              className={`p-4 text-sm rounded-lg ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-100'
                  : 'bg-green-50 text-green-800 border border-green-100'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-2" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}