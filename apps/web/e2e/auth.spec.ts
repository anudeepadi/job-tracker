import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads with form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('register page loads with form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /create one/i });
    await expect(registerLink).toBeVisible();
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.getByRole('link', { name: /login/i });
    await expect(loginLink).toBeVisible();
  });

  test('unauthenticated user is redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Middleware redirects unauthenticated users to /login with a redirect param
    await expect(page).toHaveURL(/\/login/);
  });
});
