'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientSupabase } from '@/lib/supabase'
import KebabMenu from '@/components/ui/KebabMenu'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'

interface Inspection {
  id: string
  address: string
  inspection_type: 'entry' | 'exit' | 'routine'
  owner_name: string
  tenant_name?: string
  inspection_date: string
  status: string
  rooms_count?: number
  completed_rooms?: number
}

interface InspectionActionsProps {
  inspection: Inspection
  onInspectionDeleted?: () => void
}

export default function InspectionActions({ inspection, onInspectionDeleted }: InspectionActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClientSupabase()

  const getNextAction = () => {
    if (inspection.status === 'pending' || !inspection.rooms_count) {
      return {
        text: 'Select Rooms',
        href: `/inspections/${inspection.id}/rooms`,
        style: 'primary',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        )
      }
    }
    if (inspection.status === 'in_progress') {
      return {
        text: 'Continue',
        href: `/inspections/${inspection.id}/wizard`,
        style: 'secondary',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        )
      }
    }
    return {
      text: 'View Report',
      href: `/inspections/${inspection.id}/report`,
      style: 'success',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  const getButtonStyles = (style: string) => {
    switch (style) {
      case 'primary':
        return 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
      case 'secondary':
        return 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700 border-green-600'
      default:
        return 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
    }
  }

  const handleDeleteInspection = async () => {
    try {
      setLoading(true)

      // Delete associated rooms and photos first (cascade should handle this, but being explicit)
      const { error: roomsError } = await supabase
        .from('rooms')
        .delete()
        .eq('inspection_id', inspection.id)

      if (roomsError) {
        console.error('Error deleting rooms:', roomsError)
      }

      // Delete the inspection
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', inspection.id)

      if (error) {
        throw error
      }

      // Refresh the page or notify parent
      if (onInspectionDeleted) {
        onInspectionDeleted()
      } else {
        router.refresh()
      }

      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting inspection:', error)
      alert('Failed to delete inspection. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInspection = async () => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('inspections')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', inspection.id)

      if (error) {
        throw error
      }

      // Refresh the page
      router.refresh()
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Error cancelling inspection:', error)
      alert('Failed to cancel inspection. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextAction = getNextAction()

  const menuActions: Array<{
    label: string
    icon: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'danger'
  }> = [
    {
      label: 'View Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: () => router.push(`/inspections/${inspection.id}`)
    },
    {
      label: 'Edit Rooms',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => router.push(`/inspections/${inspection.id}/rooms`)
    }
  ]

  // Only show cancel option for non-completed inspections
  if (inspection.status !== 'completed' && inspection.status !== 'cancelled') {
    menuActions.push({
      label: 'Cancel Inspection',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      onClick: () => setShowCancelDialog(true),
      variant: 'danger' as const
    })
  }

  // Always show delete option
  menuActions.push({
    label: 'Delete Inspection',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    onClick: () => setShowDeleteDialog(true),
    variant: 'danger' as const
  })

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Primary Action Button */}
        <Link
          href={nextAction.href}
          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${getButtonStyles(nextAction.style)}`}
        >
          <span className="mr-2">{nextAction.icon}</span>
          {nextAction.text}
        </Link>

        {/* Kebab Menu */}
        <KebabMenu actions={menuActions} />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteInspection}
        title="Delete Inspection"
        description={`Are you sure you want to delete this inspection for "${inspection.address}"? This action cannot be undone and will also delete all associated rooms, photos, and reports.`}
        confirmText="Delete Inspection"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelInspection}
        title="Cancel Inspection"
        description={`Are you sure you want to cancel this inspection for "${inspection.address}"? You can always resume it later.`}
        confirmText="Cancel Inspection"
        cancelText="Keep Active"
        variant="warning"
        loading={loading}
      />
    </>
  )
}