'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

interface SidebarProps {
  user: any
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5v6m8-6v6" />
      </svg>
    )
  },
  { 
    name: 'Inspections', 
    href: '/inspections', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  { 
    name: 'New Inspection', 
    href: '/inspections/new', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    )
  }
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientSupabase()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">Inspector</span>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/inspections' && pathname.startsWith('/inspections') && pathname !== '/inspections/new')
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 px-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}