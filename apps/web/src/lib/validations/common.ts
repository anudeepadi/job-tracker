import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Pagination query parameters schema.
 * Defaults: page=1, limit=20.
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

/**
 * ID parameter schema for route params.
 */
export const idParamSchema = z.object({
  id: z.string().min(1),
})

/**
 * Type-safe body parser using a Zod schema.
 *
 * Returns `{ data }` on success or `{ error }` (a NextResponse) on failure.
 * Handles both validation errors and malformed JSON gracefully.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let raw: unknown

  try {
    raw = await request.json()
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      ),
    }
  }

  const result = schema.safeParse(raw)

  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 },
      ),
    }
  }

  return { data: result.data }
}
