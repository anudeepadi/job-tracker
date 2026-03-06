import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('homepage loads with branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HireAgent|Job/i);
  });

  test('homepage displays hero headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const heroText = await page.getByRole('heading', { level: 1 }).textContent();
    expect(heroText).toMatch(/get hired|ai agents/i);
  });

  test('homepage has CTA buttons', async ({ page }) => {
    await page.goto('/');
    // "Start Free" and "Get Started Free" CTA links to /register
    const ctaButton = page.getByRole('link', { name: /start free|get started/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('homepage has navigation with login and register links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
  });

  test('homepage loads features section', async ({ page }) => {
    await page.goto('/');
    // Verify features section has substantial content
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
    // Check for specific feature text
    await expect(page.getByText(/AI-Powered Job Search/i)).toBeVisible();
    await expect(page.getByText(/Resume Tailoring/i)).toBeVisible();
  });
});
