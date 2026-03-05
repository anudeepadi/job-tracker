import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Test the rate limiter
describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 5 });
    const result = limiter.check('user-1');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks requests per key independently', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 2 });
    limiter.check('user-1');
    limiter.check('user-1');
    const resultUser1 = limiter.check('user-1');
    const resultUser2 = limiter.check('user-2');
    expect(resultUser1.success).toBe(false);
    expect(resultUser2.success).toBe(true);
  });

  it('blocks requests over the limit', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 2 });
    limiter.check('user-1');
    limiter.check('user-1');
    const result = limiter.check('user-1');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the interval expires', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 1 });
    limiter.check('user-1');
    const blocked = limiter.check('user-1');
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(60_001);

    const afterReset = limiter.check('user-1');
    expect(afterReset.success).toBe(true);
  });

  it('returns retryAfter when rate limited', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 1 });
    limiter.check('user-1');
    const result = limiter.check('user-1');
    expect(result.success).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
  });
});
