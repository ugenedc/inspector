import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabase } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnalysisRequest {
  photoUrl: string
  inspectionType: 'entry' | 'exit' | 'routine'
  roomName: string
}

interface AnalysisResponse {
  description: string
  cleanliness_score: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: AnalysisRequest = await request.json()
    const { photoUrl, inspectionType, roomName } = body

    // Validate required fields
    if (!photoUrl || !inspectionType || !roomName) {
      return NextResponse.json(
        { error: 'Missing required fields: photoUrl, inspectionType, and roomName are required' },
        { status: 400 }
      )
    }

    // Validate inspection type
    if (!['entry', 'exit', 'routine'].includes(inspectionType)) {
      return NextResponse.json(
        { error: 'Invalid inspection type. Must be: entry, exit, or routine' },
        { status: 400 }
      )
    }

    // Validate photo URL format
    if (!isValidUrl(photoUrl)) {
      return NextResponse.json(
        { error: 'Invalid photo URL format' },
        { status: 400 }
      )
    }

    // Create the inspection-specific prompt
    const inspectionTypeFormatted = inspectionType.toUpperCase()
    const prompt = `This photo was taken during a ${inspectionTypeFormatted} inspection in the ${roomName}. Please describe the condition, visible damage or issues, and rate the cleanliness from 1 (very dirty) to 10 (perfectly clean).

Please provide your response in the following JSON format:
{
  "description": "Detailed description of the room condition, any visible damage or issues",
  "cleanliness_score": 8
}

The cleanliness score should be:
- 1-2: Very dirty, significant cleaning required
- 3-4: Dirty, noticeable mess or grime
- 5-6: Average cleanliness, some minor issues
- 7-8: Clean, well-maintained
- 9-10: Perfectly clean, excellent condition

Focus on what you can actually see in the photo and be specific about any issues or damage you observe.`

    console.log('Analyzing photo with OpenAI Vision...')
    console.log('Photo URL:', photoUrl)
    console.log('Inspection Type:', inspectionType)
    console.log('Room Name:', roomName)

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: photoUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    const analysisText = response.choices[0]?.message?.content

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Failed to generate analysis from OpenAI' },
        { status: 500 }
      )
    }

    console.log('Raw OpenAI response:', analysisText)

    // Try to extract JSON from the response
    let analysisResult: AnalysisResponse
    try {
      // Look for JSON in the response (sometimes OpenAI wraps it in markdown)
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       analysisText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]
        analysisResult = JSON.parse(jsonString)
      } else {
        // If no JSON found, try parsing the entire response
        analysisResult = JSON.parse(analysisText)
      }

      // Validate the response structure
      if (!analysisResult.description || typeof analysisResult.cleanliness_score !== 'number') {
        throw new Error('Invalid response structure')
      }

      // Ensure cleanliness score is within valid range
      if (analysisResult.cleanliness_score < 1 || analysisResult.cleanliness_score > 10) {
        analysisResult.cleanliness_score = Math.max(1, Math.min(10, analysisResult.cleanliness_score))
      }

    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON response:', parseError)
      console.error('Raw response:', analysisText)
      
      // Fallback: extract information manually if JSON parsing fails
      analysisResult = extractAnalysisFromText(analysisText)
    }

    // Log successful analysis
    console.log('Analysis completed:', {
      description: analysisResult.description.substring(0, 100) + '...',
      cleanliness_score: analysisResult.cleanliness_score,
      tokens_used: response.usage?.total_tokens || 0
    })

    return NextResponse.json({
      description: analysisResult.description,
      cleanliness_score: analysisResult.cleanliness_score,
      metadata: {
        inspection_type: inspectionType,
        room_name: roomName,
        tokens_used: response.usage?.total_tokens || 0,
        model_used: 'gpt-4o',
        analyzed_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error analyzing inspection photo:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured or invalid' },
          { status: 500 }
        )
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('content policy')) {
        return NextResponse.json(
          { error: 'Image content violates OpenAI content policy' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze inspection photo' },
      { status: 500 }
    )
  }
}

// Helper function to validate URL format
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Fallback function to extract analysis from text if JSON parsing fails
function extractAnalysisFromText(text: string): AnalysisResponse {
  // Look for cleanliness score patterns
  const scoreMatches = text.match(/(?:cleanliness|score|rating).*?(\d+)(?:\/10)?/i) ||
                      text.match(/(\d+)(?:\/10)?.*?(?:clean|score|rating)/i) ||
                      text.match(/\b([1-9]|10)\b/g)

  let cleanlinessScore = 7 // Default fallback score
  if (scoreMatches) {
    const scores = scoreMatches
      .map(match => parseInt(match.replace(/\D/g, '')))
      .filter(score => score >= 1 && score <= 10)
    
    if (scores.length > 0) {
      cleanlinessScore = scores[0]
    }
  }

  // Use the entire text as description, cleaned up
  const description = text
    .replace(/```json|```/g, '')
    .replace(/\{[\s\S]*\}/g, '')
    .trim() || 'Unable to generate detailed description from the image.'

  return {
    description,
    cleanliness_score: cleanlinessScore
  }
}

// GET method for API documentation/testing
export async function GET() {
  return NextResponse.json({
    message: 'Inspection Photo Analysis API',
    description: 'Analyzes property inspection photos using OpenAI Vision',
    method: 'POST',
    required_fields: {
      photoUrl: 'string - URL of the photo to analyze',
      inspectionType: 'string - entry|exit|routine',
      roomName: 'string - name of the room being inspected'
    },
    response_format: {
      description: 'string - detailed analysis of room condition',
      cleanliness_score: 'number - score from 1 (very dirty) to 10 (perfectly clean)',
      metadata: 'object - additional analysis metadata'
    },
    example: {
      request: {
        photoUrl: 'https://example.com/photo.jpg',
        inspectionType: 'entry',
        roomName: 'Kitchen'
      },
      response: {
        description: 'The kitchen appears to be in good condition with clean countertops...',
        cleanliness_score: 8,
        metadata: {
          inspection_type: 'entry',
          room_name: 'Kitchen',
          tokens_used: 150,
          model_used: 'gpt-4o',
          analyzed_at: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
}