import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('forgot password page loads with email input', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('forgot password page has back to login link', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('link', { name: /back to login|login/i }).first()).toBeVisible();
  });

  test('demo emails page loads', async ({ page }) => {
    await page.goto('/demo/emails');
    await expect(page.getByText(/HireAgent Email Templates/i)).toBeVisible();
    // Should show email template selector buttons
    await expect(page.getByRole('button', { name: /email verification/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /password reset/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /job alert/i })).toBeVisible();
  });

  test('login link from homepage navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });
});
