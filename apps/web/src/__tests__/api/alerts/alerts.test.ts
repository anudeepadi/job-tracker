import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/alerts/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    savedAlert: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('GET /api/alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/alerts');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns user alerts', async () => {
    const { getSession } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(getSession).mockResolvedValue({ userId: 'user123', email: 'test@example.com' });
    vi.mocked(prisma.savedAlert.findMany).mockResolvedValue([
      {
        id: 'alert1',
        userId: 'user123',
        name: 'Software Engineer Jobs',
        searchCriteria: JSON.stringify({ role: 'Software Engineer', location: 'SF' }),
        frequency: 'daily',
        isActive: true,
        lastRunAt: null,
        lastJobCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const request = new NextRequest('http://localhost:3000/api/alerts');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.alerts).toHaveLength(1);
    expect(data.alerts[0].searchCriteria.role).toBe('Software Engineer');
  });
});

describe('POST /api/alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if required fields missing', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Alert',
        // Missing searchCriteria
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('creates alert with valid data', async () => {
    const { getSession } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(getSession).mockResolvedValue({ userId: 'user123', email: 'test@example.com' });
    vi.mocked(prisma.savedAlert.create).mockResolvedValue({
      id: 'alert1',
      userId: 'user123',
      name: 'Software Engineer Jobs',
      searchCriteria: JSON.stringify({ role: 'Software Engineer' }),
      frequency: 'daily',
      isActive: true,
      lastRunAt: null,
      lastJobCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Software Engineer Jobs',
        searchCriteria: { role: 'Software Engineer' },
        frequency: 'daily',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.alert.name).toBe('Software Engineer Jobs');
  });
});
