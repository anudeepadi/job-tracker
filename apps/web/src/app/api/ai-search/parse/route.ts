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

function clampResults(n: number | undefined) {
  return Math.min(Math.max(n || 10, 1), 50)
}

function localParse(query: string): ParseResponse {
  const q = query.trim()

  // numResults (first integer found)
  const numMatch = q.match(/\b(\d{1,2})\b/)
  const numResults = clampResults(numMatch ? parseInt(numMatch[1], 10) : 10)

  // location (after "in", "at", "near", or explicit Remote)
  const remote = /\bremote\b/i.test(q)
  let location = remote ? 'Remote' : ''
  const locMatch =
    q.match(/\b(?:in|at|near|around)\s+([^.,;]+)$/i) ||
    q.match(/\b(?:in|at|near|around)\s+([^.,;]+?)(?:\s+posted|\s+within|\s+past|\s+last|\s+with|\s+and|\s+for)\b/i)
  if (!location && locMatch?.[1]) location = locMatch[1].trim()
  if (!location) location = 'United States'

  // job role (remove leading verbs and location clause)
  let jobRole = q
    .replace(/^(find|search|look\s*for|show|give|get)\s+(me\s+)?/i, '')
    .replace(/\bjobs?\b/i, '')
    .replace(/\b(?:in|at|near|around)\s+.+$/i, '')
    .replace(/\b(\d{1,2})\b/g, '')
    .trim()
  if (!jobRole) jobRole = 'Software Engineer'

  // preferences (naive extraction)
  const prefs: string[] = []
  const prefMatches = q.match(/\b(entry[-\s]?level|junior|intern|senior|staff|principal|hybrid|on[-\s]?site|contract|full[-\s]?time|part[-\s]?time)\b/gi)
  if (prefMatches) prefs.push(...prefMatches.map(x => x.toLowerCase()))
  if (remote) prefs.push('remote')

  const parsed: ParsedJobParams = {
    jobRole,
    location,
    numResults,
    additionalPreferences: Array.from(new Set(prefs)),
    confidence: 0.55,
  }

  const interpretation = `Searching for ${parsed.numResults} "${parsed.jobRole}" positions in ${parsed.location}${
    parsed.additionalPreferences?.length ? ` with preferences: ${parsed.additionalPreferences.join(', ')}` : ''
  }`

  return { success: true, parsedParams: parsed, interpretation }
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
      // Fallback: keep app usable without external AI
      return NextResponse.json(localParse(body.query))
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

    let text = ''
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      text = response.text().trim()
    } catch (e) {
      // Fallback on expired/invalid key or network issues
      console.error('Gemini generateContent failed, falling back to local parser:', e)
      return NextResponse.json(localParse(body.query))
    }

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
      parsed.numResults = clampResults(parsed.numResults)

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
      // Fallback if model returns non-JSON
      return NextResponse.json(localParse(body.query))
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(localParse(''))
  }
}
