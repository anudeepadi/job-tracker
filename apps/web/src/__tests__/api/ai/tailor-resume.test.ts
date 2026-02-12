import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/ai/tailor-resume/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  generateJSON: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPreference: {
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/ai/tailor-resume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/ai/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'Software Engineer',
        jobDescription: 'Test description',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 if required fields missing', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/ai/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'Software Engineer',
        // Missing jobDescription
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 404 if no resume inventory', async () => {
    const { getSession } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(getSession).mockResolvedValue({ userId: 'user123', email: 'test@example.com' });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/ai/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'Software Engineer',
        jobDescription: 'Test description',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe('NO_RESUME_INVENTORY');
  });

  it('successfully tailors resume with valid data', async () => {
    const { getSession } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');
    const { generateJSON } = await import('@/lib/gemini');

    vi.mocked(getSession).mockResolvedValue({ userId: 'user123', email: 'test@example.com' });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue({
      id: 'pref1',
      userId: 'user123',
      key: 'resume_inventory',
      value: JSON.stringify({
        personalInfo: { name: 'John Doe', email: 'john@example.com' },
        experience: [],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(generateJSON).mockResolvedValue({
      summary: 'Tailored summary',
      keySkills: ['React', 'TypeScript'],
      experienceHighlights: [],
      projectHighlights: [],
      additionalTips: [],
    });

    const request = new NextRequest('http://localhost:3000/api/ai/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'Software Engineer',
        jobDescription: 'Test description',
        company: 'Test Corp',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.summary).toBe('Tailored summary');
  });
});

describe('GET /api/ai/tailor-resume', () => {
  it('returns inventory status for authenticated user', async () => {
    const { getSession } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');

    vi.mocked(getSession).mockResolvedValue({ userId: 'user123', email: 'test@example.com' });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue({
      id: 'pref1',
      userId: 'user123',
      key: 'resume_inventory',
      value: '{}',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/ai/tailor-resume');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.hasInventory).toBe(true);
  });
});
