import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

interface AppLayoutProps {
  children: React.ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createServerSupabase()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar user={user} />
      
      {/* Mobile Navigation */}
      <MobileNav user={user} />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}