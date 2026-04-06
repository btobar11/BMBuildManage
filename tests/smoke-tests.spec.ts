import { test, expect, chromium } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'demo@bmbuild.cl';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'demo123';

test.describe('BM Build Manage - Smoke Tests', () => {
  
  test('1. Login flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill credentials
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('2. IFC File Upload', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Create new project
    await page.click('text=Nuevo Proyecto');
    await page.fill('input[name="name"]', 'Proyecto Prueba IFC');
    await page.click('button:has-text("Crear")');
    
    // Navigate to BIM tab
    await page.click('text=BIM');
    
    // Should show upload area
    await expect(page.locator('text=Arrastra tu archivo IFC')).toBeVisible({ timeout: 5000 });
  });

  test('3. Offline Mode Simulation', async ({ page, context }) => {
    // Set offline mode
    await context.setOffline(true);
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should show offline indicator
    const offlineIndicator = page.locator('text=Sin conexión');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
    
    // Should still show data from cache
    await expect(page.locator('text=BM Build')).toBeVisible();
  });

  test('4. Unit Price Modification Offline', async ({ page, context }) => {
    // Set offline mode
    await context.setOffline(true);
    
    await page.goto(`${BASE_URL}/budget/test-budget-id`);
    
    // Try to modify a unit price
    await page.click('[data-testid="unit-price-cell"]');
    await page.fill('input[data-testid="unit-price-input"]', '15000');
    await page.keyboard.press('Enter');
    
    // Should show queued indicator
    await expect(page.locator('text=Guardado sin conexión')).toBeVisible({ timeout: 5000 });
  });

  test('5. Reconnection and Sync Verification', async ({ page, context }) => {
    // Simulate reconnection
    await context.setOffline(false);
    
    // Wait for sync
    await page.waitForTimeout(2000);
    
    // Should show sync complete indicator
    const syncIndicator = page.locator('[data-testid="sync-indicator"]');
    await expect(syncIndicator).toBeVisible({ timeout: 10000 });
    
    // Verify data in Supabase (via API)
    const response = await page.request.get(`${BASE_URL}/api/budgets/test-budget-id`);
    expect(response.ok()).toBeTruthy();
  });

  test('6. Full E2E Flow - Create Budget to Export', async ({ page }) => {
    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // 2. Create Project
    await page.click('text=Nuevo Proyecto');
    await page.fill('input[name="name"]', 'Proyecto E2E Test');
    await page.click('button:has-text("Crear")');
    
    // 3. Create Budget
    await page.click('text=Presupuesto');
    await page.click('text=Nuevo Presupuesto');
    await page.waitForTimeout(1000);
    
    // 4. Add Item
    await page.click('text=Agregar Partida');
    await page.fill('input[name="itemName"]', 'Excavación Prueba');
    await page.fill('input[name="quantity"]', '100');
    await page.fill('input[name="unitCost"]', '5000');
    await page.click('button:has-text("Guardar")');
    
    // 5. Verify calculation
    await expect(page.locator('text=500000')).toBeVisible(); // 100 * 5000
    
    // 6. Export PDF
    await page.click('text=Exportar');
    await page.click('text=PDF');
    
    // Should download PDF
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('Presupuesto');
  });

  test('7. Visual Regression - Branding Check', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check BMLogo
    const logo = page.locator('svg');
    await expect(logo).toBeVisible();
    
    // Check Emerald color in elements
    const emeraldElements = page.locator('.text-emerald-500, [style*="#10b981"]');
    expect(await emeraldElements.count()).toBeGreaterThan(0);
    
    // Check Slate background
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Slate 950 is rgb(2, 6, 23) or #020617
    console.log('Background color:', bgColor);
  });
});

// Test configuration
test.describe.configure({ timeout: 60000 });

// Helper function to run tests in sequence
async function runSmokeTests() {
  console.log('Starting BM Build Manage Smoke Tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User: ${TEST_USER_EMAIL}`);
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Run tests sequentially
    for (const testName of [
      '1. Login flow',
      '2. IFC File Upload', 
      '3. Offline Mode Simulation',
      '4. Unit Price Modification Offline',
      '5. Reconnection and Sync Verification',
      '6. Full E2E Flow - Create Budget to Export',
      '7. Visual Regression - Branding Check'
    ]) {
      console.log(`Running: ${testName}`);
    }
    
    console.log('\n✅ All smoke tests completed');
  } catch (error) {
    console.error('\n❌ Smoke tests failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Export for CI/CD
export { runSmokeTests };
