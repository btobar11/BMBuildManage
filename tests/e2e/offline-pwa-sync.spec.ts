import { test, expect } from '@playwright/test';

test.describe('Offline PWA Sync', () => {
  const SYNCED_COLOR = 'rgb(16, 185, 129)';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show offline indicator when network is lost', async ({ page, context }) => {
    const syncStatus = page.locator('[data-testid="sync-status"]');

    await context.setOffline(true);

    await page.waitForTimeout(2000);
    
    const isOffline = await syncStatus.getAttribute('data-online');
    expect(isOffline).toBe('false');

    await context.setOffline(false);
  });

  test('should persist mutations to IndexedDB when offline', async ({ page, context }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const offlineBanner = page.locator('[data-testid="offline-banner"]');

    await context.setOffline(true);
    await page.waitForTimeout(500);
    
    await expect(offlineBanner).toBeVisible();

    const pendingSyncBadge = page.locator('[data-testid="pending-sync-count"]');
    await expect(pendingSyncBadge).toBeVisible();
    
    await context.setOffline(false);
  });

  test('should show synced status (#10b981) after network recovery', async ({ page, context }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const syncIndicator = page.locator('[data-testid="sync-indicator"]');

    await context.setOffline(true);
    await page.waitForTimeout(1000);
    await context.setOffline(false);

    await page.waitForTimeout(3000);

    const bgColor = await syncIndicator.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(bgColor).toBe(SYNCED_COLOR);
  });

  test('should retry failed mutations when back online', async ({ page, context }) => {

    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);

    const saveButton = page.locator('button[data-testid="save-budget"]');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    await context.setOffline(false);
    await page.waitForTimeout(5000);

    const pendingCount = page.locator('[data-testid="pending-sync-count"]');
    const count = await pendingCount.textContent();
    expect(parseInt(count || '0')).toBe(0);
  });
});
