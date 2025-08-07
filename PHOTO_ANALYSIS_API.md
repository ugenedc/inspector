# Photo Analysis API Guide

A powerful server-side API that uses OpenAI Vision (GPT-4o) to analyze property inspection photos and provide structured feedback on room condition and cleanliness.

## 🎯 **API Overview**

### **Purpose**
Automatically analyze property inspection photos to generate:
- **Detailed condition descriptions** of room state
- **Cleanliness scores** from 1-10 scale
- **Structured JSON responses** for easy integration

### **Model Used**
- **OpenAI GPT-4o** with Vision capabilities
- **High-detail analysis** for accurate assessments
- **Context-aware prompts** based on inspection type and room

## 🚀 **Quick Start**

### **1. API Key Setup**
Add your OpenAI API key to environment variables:

```env
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

### **2. Basic Usage**

```typescript
const response = await fetch('/api/analyze-inspection-photo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    photoUrl: 'https://example.com/photo.jpg',
    inspectionType: 'entry',
    roomName: 'Kitchen'
  })
})

const result = await response.json()
console.log(result.description)       // Detailed analysis
console.log(result.cleanliness_score) // Score 1-10
```

### **3. Test the API**
Visit `/analysis/demo` to test the API with a visual interface.

## 📋 **API Specification**

### **Endpoint**
```
POST /api/analyze-inspection-photo
```

### **Request Body**
```typescript
{
  photoUrl: string,        // URL of photo to analyze
  inspectionType: string,  // 'entry' | 'exit' | 'routine'
  roomName: string         // Name of room being inspected
}
```

### **Response Format**
```typescript
{
  description: string,           // Detailed condition analysis
  cleanliness_score: number,     // Score from 1-10
  metadata: {
    inspection_type: string,     // Echo of input
    room_name: string,          // Echo of input
    tokens_used: number,        // OpenAI tokens consumed
    model_used: string,         // "gpt-4o"
    analyzed_at: string         // ISO timestamp
  }
}
```

### **Example Request**
```json
{
  "photoUrl": "https://example.com/kitchen-photo.jpg",
  "inspectionType": "entry",
  "roomName": "Kitchen"
}
```

### **Example Response**
```json
{
  "description": "The kitchen appears to be in excellent condition with clean countertops, well-maintained appliances, and organized storage. The stainless steel sink is spotless and the backsplash shows no staining. All visible surfaces appear clean and well-maintained.",
  "cleanliness_score": 9,
  "metadata": {
    "inspection_type": "entry",
    "room_name": "Kitchen",
    "tokens_used": 245,
    "model_used": "gpt-4o",
    "analyzed_at": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🔍 **Analysis Prompt**

The API uses this specialized prompt for consistent analysis:

```
This photo was taken during a [ENTRY/EXIT/ROUTINE] inspection in the [ROOM NAME]. 
Please describe the condition, visible damage or issues, and rate the cleanliness 
from 1 (very dirty) to 10 (perfectly clean).

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

Focus on what you can actually see in the photo and be specific about any issues or damage you observe.
```

## 🛠️ **Integration Examples**

### **React Hook Usage**

```typescript
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis'

function MyComponent() {
  const { analyzePhoto, loading, error } = usePhotoAnalysis()

  const handleAnalyze = async () => {
    try {
      const result = await analyzePhoto({
        photoUrl: 'https://example.com/photo.jpg',
        inspectionType: 'entry',
        roomName: 'Kitchen'
      })
      
      console.log('Analysis:', result.description)
      console.log('Score:', result.cleanliness_score)
    } catch (err) {
      console.error('Analysis failed:', err)
    }
  }

  return (
    <button onClick={handleAnalyze} disabled={loading}>
      {loading ? 'Analyzing...' : 'Analyze Photo'}
    </button>
  )
}
```

### **Direct API Call**

```typescript
async function analyzePhoto(photoUrl: string, inspectionType: string, roomName: string) {
  const response = await fetch('/api/analyze-inspection-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrl, inspectionType, roomName })
  })

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`)
  }

  return await response.json()
}
```

### **Integration with File Upload**

```typescript
// After photo upload, analyze it
const uploadAndAnalyze = async (file: File) => {
  // 1. Upload photo to storage
  const photoUrl = await uploadPhotoToStorage(file)
  
  // 2. Analyze the uploaded photo
  const analysis = await analyzePhoto(photoUrl, 'entry', 'Kitchen')
  
  // 3. Save analysis to database
  await saveAnalysisToDatabase(analysis)
  
  return analysis
}
```

## 🎯 **Cleanliness Scoring**

### **Score Guidelines**

| Score | Category | Description |
|-------|----------|-------------|
| **10** | Pristine | Perfect condition, spotless |
| **9** | Excellent | Very clean, well-maintained |
| **8** | Very Good | Clean with minor wear |
| **7** | Good | Generally clean, some dust |
| **6** | Fair+ | Mostly clean, minor issues |
| **5** | Fair | Average, needs attention |
| **4** | Below Average | Noticeable dirt/mess |
| **3** | Poor | Dirty, needs deep cleaning |
| **2** | Very Poor | Very dirty, major issues |
| **1** | Unacceptable | Extremely dirty/damaged |

### **Scoring Factors**
- **Surface Cleanliness** - Dust, dirt, stains
- **Damage Assessment** - Visible wear, cracks, damage
- **Organization** - Clutter, proper arrangement
- **Maintenance** - Overall upkeep state
- **Hygiene** - Sanitary conditions

## 🔒 **Security & Validation**

### **Authentication**
- **User Authentication** required via Supabase
- **Server-side validation** of all requests
- **Row Level Security** integration ready

### **Input Validation**
- **URL Format** validation for photo URLs
- **Inspection Type** must be: entry, exit, or routine
- **Required Fields** validation with helpful errors
- **Photo URL** accessibility checking

### **Error Handling**
```typescript
// Common error responses
{
  "error": "Missing required fields: photoUrl, inspectionType, and roomName are required"
}

{
  "error": "Invalid inspection type. Must be: entry, exit, or routine"
}

{
  "error": "OpenAI API rate limit exceeded. Please try again later."
}
```

## 📊 **Response Processing**

### **JSON Parsing**
The API handles various OpenAI response formats:
- **Clean JSON** responses
- **Markdown-wrapped** JSON (```json ... ```)
- **Text responses** with fallback extraction
- **Malformed** responses with error recovery

### **Fallback Handling**
If JSON parsing fails, the API:
1. **Extracts scores** using regex patterns
2. **Uses full text** as description
3. **Provides default score** (7) if none found
4. **Logs errors** for debugging

## 🚀 **Production Considerations**

### **Performance**
- **Response Time** - Typically 2-5 seconds
- **Token Usage** - ~200-400 tokens per analysis
- **Rate Limits** - Follow OpenAI API limits
- **Caching** - Consider caching results for repeated analyses

### **Cost Management**
- **Token Monitoring** - Track usage via metadata
- **Batch Processing** - Analyze multiple photos efficiently
- **Smart Prompting** - Optimized prompts for token efficiency
- **Error Recovery** - Minimize failed requests

### **Monitoring**
- **Success Rates** - Track analysis completion
- **Response Quality** - Monitor score distributions
- **Error Patterns** - Identify common failures
- **Performance Metrics** - Response times and token usage

## 🧪 **Testing**

### **Demo Interface**
Visit `/analysis/demo` for:
- **Interactive Testing** with example photos
- **Real-time Results** display
- **Error Handling** demonstration
- **API Documentation** reference

### **Test Cases**
```typescript
// Test different inspection types
await analyzePhoto(photoUrl, 'entry', 'Kitchen')
await analyzePhoto(photoUrl, 'exit', 'Bathroom')
await analyzePhoto(photoUrl, 'routine', 'Living Room')

// Test edge cases
await analyzePhoto(invalidUrl, 'entry', 'Kitchen')    // Should fail
await analyzePhoto(photoUrl, 'invalid', 'Kitchen')   // Should fail
await analyzePhoto(photoUrl, 'entry', '')            // Should fail
```

### **Integration Testing**
```typescript
// Test with actual inspection workflow
const inspection = await createInspection()
const room = await selectRoom(inspection.id)
const photo = await uploadPhoto(room.id)
const analysis = await analyzePhoto(photo.url, inspection.type, room.name)
```

## 📈 **Future Enhancements**

### **Planned Features**
- **Multiple Photo Analysis** - Analyze room sets together
- **Damage Detection** - Specific damage type identification
- **Comparison Analysis** - Before/after inspection comparisons
- **Custom Scoring** - Industry-specific scoring criteria

### **Advanced Prompts**
- **Property Type** specific prompts (residential, commercial)
- **Regulatory Standards** compliance checking
- **Maintenance Recommendations** generation
- **Cost Estimation** for repairs/cleaning

The Photo Analysis API is **production-ready** and provides consistent, detailed analysis of property inspection photos! 🔍✨