import { NextRequest, NextResponse } from 'next/server'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

// Maximum time to wait for job search results (in ms)
// CrewAI runs 4 sequential agents which can take 5-10 minutes
const MAX_POLL_TIME = 600000 // 10 minutes
const POLL_INTERVAL = 3000 // 3 seconds

export interface JobSearchRequest {
  job_role: string
  location: string
  num_results?: number
}

export interface JobResult {
  title: string
  company: string
  location: string
  url: string
  description?: string
  salary_range?: string
  posted_date?: string
  source: string
}

export interface JobSearchResponse {
  status: 'searching' | 'completed' | 'error'
  results: JobResult[]
  total_found: number
  search_time_seconds?: number
  error?: string
}

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Poll for job search results
async function pollForResults(jobId: string): Promise<{ status: string; results?: JobResult[]; error?: string }> {
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_POLL_TIME) {
    // Check status
    const statusResponse = await fetch(`${PYTHON_BACKEND_URL}/api/search/${jobId}/status`)

    if (!statusResponse.ok) {
      throw new Error('Failed to check job status')
    }

    const statusData = await statusResponse.json()

    if (statusData.status === 'completed') {
      // Get results
      const resultsResponse = await fetch(`${PYTHON_BACKEND_URL}/api/search/${jobId}/results`)

      if (!resultsResponse.ok) {
        throw new Error('Failed to fetch job results')
      }

      const resultsData = await resultsResponse.json()

      // Transform job_listings to match our JobResult format
      const results: JobResult[] = (resultsData.job_listings || []).map((job: {
        title: string
        company: string
        location: string
        apply_url?: string
        description?: string
        salary_range?: string
        posted_date?: string
      }) => ({
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.apply_url || '',
        description: job.description,
        salary_range: job.salary_range,
        posted_date: job.posted_date,
        source: 'Adzuna',
      }))

      return { status: 'completed', results }
    }

    if (statusData.status === 'failed') {
      return { status: 'error', error: statusData.error || 'Job search failed' }
    }

    // Wait before polling again
    await delay(POLL_INTERVAL)
  }

  return { status: 'error', error: 'Job search timed out' }
}

// POST - Start a new job search
export async function POST(request: NextRequest) {
  try {
    const body: JobSearchRequest = await request.json()

    // Validate required fields
    if (!body.job_role || !body.location) {
      return NextResponse.json(
        { error: 'job_role and location are required' },
        { status: 400 }
      )
    }

    // Step 1: Initiate the search with the Python backend
    // Python backend uses 'role' not 'job_role' and endpoint is /api/search
    const searchResponse = await fetch(`${PYTHON_BACKEND_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: body.job_role,
        location: body.location,
        num_results: body.num_results || 10,
      }),
    })

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('Python backend error:', errorText)
      return NextResponse.json(
        { error: 'Failed to start job search', details: errorText },
        { status: searchResponse.status }
      )
    }

    const searchData = await searchResponse.json()
    const jobId = searchData.job_id

    if (!jobId) {
      return NextResponse.json(
        { error: 'No job_id returned from backend' },
        { status: 500 }
      )
    }

    // Step 2: Poll for results
    const pollResult = await pollForResults(jobId)

    if (pollResult.status === 'error') {
      return NextResponse.json(
        {
          status: 'error',
          error: pollResult.error,
          results: [],
          total_found: 0,
        },
        { status: 200 } // Return 200 with error status in body for graceful handling
      )
    }

    // Step 3: Return results
    return NextResponse.json({
      status: 'completed',
      results: pollResult.results || [],
      total_found: pollResult.results?.length || 0,
    })
  } catch (error) {
    console.error('Error proxying job search request:', error)

    // Check if it's a connection error to the Python backend
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Unable to connect to the job search service. Please ensure the Python backend is running on port 8000.',
          results: [],
          total_found: 0,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Internal server error',
        results: [],
        total_found: 0,
      },
      { status: 500 }
    )
  }
}

// GET - Check search status or get results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchId = searchParams.get('search_id')

    if (!searchId) {
      return NextResponse.json(
        { error: 'search_id is required' },
        { status: 400 }
      )
    }

    // Proxy the status check to the Python backend (correct endpoint)
    const response = await fetch(
      `${PYTHON_BACKEND_URL}/api/search/${searchId}/status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python backend error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get search status', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error checking job search status:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Unable to connect to the job search service',
          details: 'The Python backend service may not be running.'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
