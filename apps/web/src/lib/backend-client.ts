/**
 * Backend client with health check and retry logic
 */

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

interface FetchOptions extends RequestInit {
  retries?: number
  retryDelay?: number
}

/**
 * Check if the Python backend is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    return response.ok
  } catch (error) {
    console.error('Backend health check failed:', error)
    return false
  }
}

/**
 * Fetch with automatic retry logic
 */
export async function fetchWithRetry(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    ...fetchOptions
  } = options

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // Server error (5xx), retry
      lastError = new Error(`Server returned ${response.status}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`Backend request attempt ${attempt + 1}/${retries + 1} failed:`, lastError)
    }

    // If not the last attempt, wait before retrying
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

/**
 * Make a POST request to the backend with retry logic
 */
export async function postToBackend<T = any>(
  endpoint: string,
  data: any,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

/**
 * Make a GET request to the backend with retry logic
 */
export async function getFromBackend<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(endpoint, {
    method: 'GET',
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

export { BACKEND_URL }
