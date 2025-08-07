import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import PropertiesList from '@/components/properties/PropertiesList'

interface PropertyGroup {
  address: string
  inspections: Inspection[]
  lastInspection: string
  totalInspections: number
}

interface Inspection {
  id: string
  address: string
  inspection_type: 'entry' | 'exit' | 'routine'
  owner_name: string
  tenant_name?: string
  inspection_date: string
  created_at: string
  updated_at: string
}

async function getPropertiesWithInspections(userId: string) {
  const supabase = await createServerSupabase()
  
  // Get all inspections for the user
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('inspector_id', userId)
    .order('inspection_date', { ascending: false })

  if (error) {
    console.error('Error fetching inspections:', error)
    return []
  }

  // Group inspections by address
  const propertyGroups: Record<string, PropertyGroup> = {}
  
  inspections?.forEach((inspection) => {
    const address = inspection.address.trim()
    
    if (!propertyGroups[address]) {
      propertyGroups[address] = {
        address,
        inspections: [],
        lastInspection: inspection.inspection_date,
        totalInspections: 0
      }
    }
    
    propertyGroups[address].inspections.push(inspection)
    propertyGroups[address].totalInspections += 1
    
    // Update last inspection date if this one is more recent
    if (new Date(inspection.inspection_date) > new Date(propertyGroups[address].lastInspection)) {
      propertyGroups[address].lastInspection = inspection.inspection_date
    }
  })

  // Convert to array and sort by last inspection date
  return Object.values(propertyGroups).sort((a, b) => 
    new Date(b.lastInspection).getTime() - new Date(a.lastInspection).getTime()
  )
}



export default async function PropertiesPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const properties = await getPropertiesWithInspections(user.id)

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
              Properties
            </h1>
            <p className="text-gray-600">
              Manage all your properties and view their inspection history.
            </p>
          </div>
          <Link
            href="/inspections/new"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Inspection
          </Link>
        </div>

        {/* Properties List with Search */}
        <PropertiesList properties={properties} />
      </div>
    </AppLayout>
  )
}