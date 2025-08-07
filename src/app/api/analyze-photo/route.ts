import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabase } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, roomName, roomType, inspectionType } = body

    if (!imageUrl || !roomName) {
      return NextResponse.json(
        { error: 'Image URL and room name are required' },
        { status: 400 }
      )
    }

    // Create a contextual prompt based on room type and inspection type
    const inspectionContext = getInspectionPrompt(roomName, roomType, inspectionType)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: inspectionContext
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    const analysis = response.choices[0]?.message?.content

    if (!analysis) {
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analysis,
      timestamp: new Date().toISOString(),
      tokens_used: response.usage?.total_tokens || 0
    })

  } catch (error) {
    console.error('Error analyzing photo:', error)
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    )
  }
}

function getInspectionPrompt(roomName: string, roomType: string, inspectionType: string): string {
  const basePrompt = `You are a professional property inspector conducting a ${inspectionType} inspection of a ${roomName}`
  
  const roomSpecificGuidelines = getRoomSpecificGuidelines(roomType || roomName.toLowerCase())
  
  return `${basePrompt}.

Please analyze this image and provide a professional inspection report focusing on:

${roomSpecificGuidelines}

Structure your response as follows:
1. **Overall Condition**: General assessment (Excellent/Good/Fair/Poor/Needs Attention)
2. **Key Observations**: 3-5 specific observations about visible elements
3. **Areas of Concern**: Any issues that require attention (if any)
4. **Recommendations**: Suggested actions or maintenance items (if applicable)

Keep your analysis professional, concise, and focused on visible elements that would be relevant for a property inspection. If you cannot clearly see certain elements, mention that limited visibility prevents full assessment of those areas.`
}

function getRoomSpecificGuidelines(roomType: string): string {
  const guidelines: Record<string, string> = {
    kitchen: `
- Condition of cabinets, countertops, and appliances
- Plumbing fixtures (sink, faucet, disposal)
- Electrical outlets and lighting
- Flooring condition
- Wall and ceiling condition
- Ventilation (range hood, windows)`,
    
    bathroom: `
- Plumbing fixtures (toilet, sink, shower/tub)
- Tile work and grout condition
- Water damage signs
- Ventilation (exhaust fan, windows)
- Flooring condition
- Mirror and lighting fixtures`,
    
    bedroom: `
- Wall and ceiling condition
- Flooring condition
- Windows and window treatments
- Electrical outlets and lighting
- Closet space and doors
- Overall cleanliness and maintenance`,
    
    'living room': `
- Wall and ceiling condition
- Flooring condition
- Windows and natural light
- Electrical outlets and lighting
- Fireplace (if present)
- Overall space functionality`,
    
    default: `
- Wall and ceiling condition
- Flooring condition
- Windows and lighting
- Electrical fixtures
- General cleanliness and maintenance
- Any visible damage or wear`
  }

  // Try to match room type or fall back to default
  for (const [key, value] of Object.entries(guidelines)) {
    if (roomType.includes(key) || key.includes(roomType)) {
      return value
    }
  }
  
  return guidelines.default
}