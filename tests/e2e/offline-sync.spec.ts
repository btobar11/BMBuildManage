import { test, expect } from '@playwright/test';

// Use a known existing budget ID from the seed data (Edificio Piloto)
const PILOT_BUDGET_ID = 'c1d2e3f4-a5b6-7890-cdef-123456789012';

test.describe('PWA Offline Synchronization', () => {
  test.beforeAll(async () => {
    // Wait for API to be ready (it might take longer than the web frontend)
    let apiReady = false;
    let attempts = 0;
    while (!apiReady && attempts < 15) {
      try {
        const res = await fetch('http://localhost:3001/api/v1/seed/status');
        if (res.ok) {
          apiReady = true;
          break;
        }
      } catch (e) {
        // Silently wait
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!apiReady) {
      console.error('API did not start in time for seeding');
      return;
    }

    // Ensure seed data is applied before running tests
    try {
      const response = await fetch('http://localhost:3001/api/v1/seed', { method: 'POST' });
      if (!response.ok) {
        console.error('Seed failed:', await response.text());
      } else {
        console.log('Seed applied successfully');
      }
    } catch (err) {
      console.error('Could not connect to API for seeding:', err);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate directly to login to avoid redirects
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Auth bypass using Demo access button with full text
    const demoButton = page.locator('button', { hasText: 'Acceso Demo (Desarrollo)' });
    await expect(demoButton).toBeVisible({ timeout: 15000 });
    await demoButton.click();
    
    // Verify dashboard navigation
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
  });

  test('should queue changes while offline and sync when online', async ({ page, context }) => {
    // Mirror browser logs to terminal for debugging
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

    // 1. Navigate to the Budget Editor (Pilot Project)
    await test.step('Wait for Service Worker activation', async () => {
      await page.goto(`/budget/${PILOT_BUDGET_ID}`);
      await page.waitForLoadState('networkidle');
      
      // Explicitly wait for the service worker to control the page
      await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 15000 });
      console.log('Service Worker is controlling the page');
    });
    
    // Check for API/Data error state
    const isError = await page.getByText('Error al cargar el presupuesto').isVisible({ timeout: 5000 }).catch(() => false);
    if (isError) {
      throw new Error(`Budget ${PILOT_BUDGET_ID} failed to load. Check that API is running and seed data is applied.`);
    }
    
    // Wait for the budget data loader to disappear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 60000 });
    
    // Debug: Take screenshot to see UI state
    await page.screenshot({ path: 'tests/e2e/debug-budget-page.png', fullPage: true });
    
    // Ensure the main editor content is visible
    await expect(page.getByPlaceholder('Nombre del proyecto')).toHaveValue('Edificio Piloto', { timeout: 30000 });
    
    // Open BIM tab to ensure the feature is active
    const bimTab = page.locator('button').filter({ hasText: 'Visor BIM 3D' });
    await expect(bimTab).toBeVisible({ timeout: 20000 });
    await bimTab.click();
    
    // Verify BIM container is initialized
    // Headless environments might take longer or fail WebGL initialization, 
    // so we use a generous timeout and soft check.
    const bimContainer = page.locator('#bim-container');
    await expect(bimContainer).toBeVisible({ timeout: 30000 }).catch(e => {
        console.warn('BIM container not visible in E2E environment. Proceeding with sync check.');
    });

    // 2. Simulate Offline Environment
    await context.setOffline(true);
    
    // Verify sync status indicator reflects offline state
    // Note: SyncIndicatorInline uses the 'title' attribute for the status label
    const syncStatus = page.getByTestId('sync-status');
    await expect(syncStatus).toBeVisible();
    await expect(syncStatus).toHaveAttribute('title', /Sin conexión/i, { timeout: 15000 });

    // Go back to budget tab to edit
    await page.getByRole('button', { name: 'Presupuesto' }).click();

    await test.step('Perform offline modification', async () => {
      const quantityRow = page.getByRole('row', { name: /Instalación de faenas/i });
      await quantityRow.scrollIntoViewIfNeeded();

      const quantityInput = quantityRow.locator('input[type="number"]');
      await expect(quantityInput).toBeVisible();
      await quantityInput.fill('150');
      await quantityInput.press('Enter');

      // 4. Trigger the actual save request
      const saveButton = page.locator('#save-budget-button');
      await saveButton.scrollIntoViewIfNeeded();
      await expect(saveButton).toBeVisible({ timeout: 15000 });
      await saveButton.click({ force: true });
      console.log('Clicked Save button');
    });

    await test.step('Verify mutation is queued', async () => {
      // The SyncIndicator should show count '1'
      try {
        await expect(syncStatus).toContainText('1', { timeout: 20000 });
        console.log('Mutation successfully queued in Service Worker');
      } catch (e) {
        console.error('Failed to detect queued mutation. Current sync indicator title:', await syncStatus.getAttribute('title'));
        const html = await page.content();
        console.log('DEBUG DOM:', html.substring(0, 1000) + '...');
        throw e;
      }
    });

    // 5. Restore Connection
    await context.setOffline(false);
    
    // 6. Verify Background Sync Completion
    // The status should return to 'Sincronizado'
    await expect(syncStatus).toHaveAttribute('title', /Sincronizado/i, { timeout: 45000 });
    
    // Integrity Check: Reload page and confirm the value is persisted in the database (via Supabase relay)
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 20000 });
    
    // Verify restored value
    await expect(page.locator('tr').filter({ hasText: 'Instalación de faenas' })).toContainText('150');
  });
});
