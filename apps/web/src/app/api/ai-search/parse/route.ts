import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ParseRequest {
  query: string
}

export interface ParsedJobParams {
  jobRole: string
  location: string
  numResults: number
  additionalPreferences?: string[]
  confidence: number
}

export interface ParseResponse {
  success: boolean
  parsedParams?: ParsedJobParams
  interpretation?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ParseRequest = await request.json()

    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Google API key not configured' },
        { status: 503 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite'
    })

    const prompt = `You are a job search query parser. Extract job search parameters from the following natural language query.

Query: "${body.query}"

Extract and return a JSON object with these fields:
- jobRole: The job title or role being searched for (required, e.g., "Software Engineer", "Data Scientist", "Product Manager")
- location: The location for the job (city, state/country, or "Remote" if they want remote work) (required)
- numResults: Number of results requested (default to 10 if not specified, max 50)
- additionalPreferences: Array of any other preferences mentioned (salary range, experience level, company type, industry, etc.)
- confidence: A score from 0 to 1 indicating how confident you are in the extraction

If the query is too vague or you cannot determine both jobRole AND location, still try your best but set confidence below 0.5.

Examples:
- "Find me React developer jobs in San Francisco" → {"jobRole": "React Developer", "location": "San Francisco", "numResults": 10, "additionalPreferences": [], "confidence": 0.95}
- "20 data science positions in NYC, remote preferred" → {"jobRole": "Data Scientist", "location": "New York City", "numResults": 20, "additionalPreferences": ["remote preferred"], "confidence": 0.9}
- "ML engineer roles at startups" → {"jobRole": "Machine Learning Engineer", "location": "United States", "numResults": 10, "additionalPreferences": ["startups"], "confidence": 0.7}

Return ONLY valid JSON, no markdown formatting or explanation.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Clean up any markdown formatting that might slip through
    let cleanedText = text
    if (text.startsWith('```json')) {
      cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (text.startsWith('```')) {
      cleanedText = text.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    try {
      const parsed: ParsedJobParams = JSON.parse(cleanedText)

      // Validate required fields
      if (!parsed.jobRole || !parsed.location) {
        return NextResponse.json({
          success: false,
          error: 'Could not extract job role and location from your query. Please be more specific, e.g., "Find software engineer jobs in Austin, TX"',
          interpretation: cleanedText
        })
      }

      // Ensure numResults is within bounds
      parsed.numResults = Math.min(Math.max(parsed.numResults || 10, 1), 50)

      // Generate a human-readable interpretation
      const interpretation = `Searching for ${parsed.numResults} "${parsed.jobRole}" positions in ${parsed.location}${
        parsed.additionalPreferences?.length
          ? ` with preferences: ${parsed.additionalPreferences.join(', ')}`
          : ''
      }`

      return NextResponse.json({
        success: true,
        parsedParams: parsed,
        interpretation
      })
    } catch {
      console.error('Failed to parse Gemini response:', cleanedText)
      return NextResponse.json({
        success: false,
        error: 'Failed to parse the query. Please try rephrasing your request.',
        interpretation: cleanedText
      })
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process your query'
      },
      { status: 500 }
    )
  }
}
