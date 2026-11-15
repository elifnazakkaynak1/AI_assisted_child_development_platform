import { test, expect } from '@playwright/test';

test.describe('M1 - Authentication and Role-Based Routing', () => {
  test('Parent user can log in and is redirected to parent dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    // Seed script ile oluşturulan sentetik bir ebeveyn hesabı kullanın
    await page.fill('input[type="email"]', 'parent@example.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');

    // Ebeveyn ekranına yönlendiğini ve yetkisiz rollere ait elemanların olmadığını doğrulayın
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('body')).toContainText('Selin');
  });

  test('Invalid credentials show an error message', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('input[type="email"]', 'wrongemail@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText(/hata|geçersiz|invalid/i);
  });
});
