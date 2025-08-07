import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { createServerSupabase } from '@/lib/supabase'
import { randomBytes } from 'crypto'

// Generate a secure share token
function generateShareToken(): string {
  return randomBytes(32).toString('hex')
}

function resolveBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '')
  }
  return request.nextUrl.origin
}

// POST - Generate or regenerate share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this inspection
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, inspector_id')
      .eq('id', id)
      .eq('inspector_id', user.id)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // Generate new share token
    const shareToken = generateShareToken()
    
    // Update inspection with share token
    const { error: updateError } = await supabase
      .from('inspections')
      .update({
        share_token: shareToken,
        share_enabled: true,
        shared_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating share token:', updateError)
      return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 })
    }

    // Construct share URL
    const shareUrl = `${resolveBaseUrl(request)}/shared/inspection/${shareToken}`

    return NextResponse.json({ 
      success: true, 
      shareUrl,
      shareToken 
    })

  } catch (error) {
    console.error('Error in share API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Disable sharing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this inspection
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, inspector_id')
      .eq('id', id)
      .eq('inspector_id', user.id)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // Disable sharing
    const { error: updateError } = await supabase
      .from('inspections')
      .update({
        share_enabled: false
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error disabling share:', updateError)
      return NextResponse.json({ error: 'Failed to disable sharing' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in share disable API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get current share status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get inspection share info
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, share_token, share_enabled, shared_at')
      .eq('id', id)
      .eq('inspector_id', user.id)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    let shareUrl: string | null = null
    if (inspection.share_enabled && inspection.share_token) {
      shareUrl = `${resolveBaseUrl(request)}/shared/inspection/${inspection.share_token}`
    }

    return NextResponse.json({
      shareEnabled: inspection.share_enabled || false,
      shareUrl,
      sharedAt: inspection.shared_at
    })

  } catch (error) {
    console.error('Error in share status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}