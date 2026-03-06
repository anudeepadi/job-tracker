import { test, expect } from '@playwright/test';

test.describe('Health & API', () => {
  test('health endpoint returns response with status field', async ({ request }) => {
    const response = await request.get('/api/health');
    // Health endpoint returns 200 if DB is connected, 503 if not
    // In test environments without a DB, we may get 503 but the endpoint should still respond
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.status).toMatch(/^(healthy|unhealthy)$/);
    expect(body.service).toBe('next-web-app');
    expect(body.checks).toBeDefined();
  });

  test('auth login endpoint rejects empty credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: '', password: '' },
    });
    // Zod validation should reject empty email/password with 400
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('auth login endpoint rejects invalid JSON', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
