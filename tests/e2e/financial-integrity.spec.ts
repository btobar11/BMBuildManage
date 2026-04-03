import { test, expect } from '@playwright/test';

const PILOT_BUDGET_ID = 'c1d2e3f4-a5b6-7890-cdef-123456789012';

test.describe('Financial Integrity & Margin Alerts', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login', { waitUntil: 'networkidle' });
    const demoButton = page.locator('button', { hasText: 'Acceso Demo (Desarrollo)' });
    await expect(demoButton).toBeVisible();
    await demoButton.click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should update margin alerts dynamically and persist fee changes', async ({ page }) => {
    await page.goto(`/budget/${PILOT_BUDGET_ID}`);
    await page.waitForLoadState('networkidle');
    
    // 1. Locate Meta Honorarios select
    const feeSelect = page.locator('#professional-fee-meta'); 
    await expect(feeSelect).toBeVisible();
    
    // 2. Set Meta to 20%
    await feeSelect.fill('20');
    await feeSelect.press('Enter');

    // 3. Set Client Price to a low value to trigger ROSE alert (Critical)
    const priceButton = page.locator('button[title="Clic para editar"]');
    await priceButton.click();
    const priceInput = page.locator('input.text-xl.font-black.text-blue-400');
    await priceInput.fill('1000000');
    await priceInput.press('Enter');

    // 4. Verify Rose alert classes
    const alertContainer = page.locator('#financial-health-alert');
    await expect(alertContainer).toBeVisible({ timeout: 10000 });
    await expect(alertContainer).toHaveClass(/bg-rose-500/);
    await expect(alertContainer).toContainText('Tu Utilidad');
    
    // 5. Change Meta to 5% to trigger Emerald alert (Success)
    await feeSelect.fill('5');
    await feeSelect.press('Enter');
    
    await expect(alertContainer).toHaveClass(/bg-emerald-500/);

    // 6. Save and Reload to Verify Persistence
    const saveButton = page.locator('#save-budget-button');
    await saveButton.click();
    
    await page.waitForTimeout(3000);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify value is still 5%
    await expect(page.locator('#professional-fee-meta')).toHaveValue('5');
  });
});
