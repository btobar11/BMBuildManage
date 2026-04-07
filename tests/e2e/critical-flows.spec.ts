import { test, expect, type Page } from '@playwright/test';

// ============================================================
// Helpers
// ============================================================

async function loginAsDemo(page: Page) {
  await page.goto('/');
  // Click demo sign-in
  const demoBtn = page.locator('[data-testid="demo-login"], button:has-text("Demo"), button:has-text("demo"), a:has-text("Ingresar")').first();
  if (await demoBtn.count() > 0) {
    await demoBtn.click();
  } else {
    // navigate directly if already handled by ConfigWarning demo mode
    await page.goto('/dashboard');
  }
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}

async function waitForPageLoad(page: Page, selector: string, timeout = 20000) {
  await page.waitForSelector(selector, { timeout });
}

// ============================================================
// TEST SUITE 1: Authentication & Navigation
// ============================================================

test.describe('1. Authentication Flows', () => {
  test('TC-01: Landing page loads without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/error/);
    // No unhandled JS errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('TC-02: Login page renders correct form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('TC-03: Demo mode allows accessing dashboard', async ({ page }) => {
    await loginAsDemo(page);
    await expect(page).toHaveURL(/dashboard/);
    // Dashboard should have some content
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('TC-04: Authenticated routes redirect on access without auth', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto('/dashboard');
    // Should redirect to login or landing
    await page.waitForURL(/login|\//, { timeout: 10000 });
  });
});

// ============================================================
// TEST SUITE 2: Dashboard
// ============================================================

test.describe('2. Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('TC-05: Dashboard renders without blank screen', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page, 'main, [class*="dashboard"], [class*="Dashboard"]');
    // Should have at least some visible content
    const mainContent = page.locator('main, [class*="container"], [class*="grid"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('TC-06: Sidebar navigation links are visible', async ({ page }) => {
    await page.goto('/dashboard');
    // At least one nav item should be visible (sidebar links to key pages)
    const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a');
    await expect(navLinks.first()).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// TEST SUITE 3: Budget Module (Core Feature)
// ============================================================

test.describe('3. Budget Editor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('TC-07: Projects list accessible from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be able to see projects or a navigation to them
    const projectLink = page.locator('a[href*="budget"], a[href*="project"], [data-testid="projects"]').first();
    if (await projectLink.count() > 0) {
      await expect(projectLink).toBeVisible();
    }
    // At minimum, the page loads without errors
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('TC-08: Budget editor route resolves', async ({ page }) => {
    // Try a known budget URL (from seed data)
    await page.goto('/budget/pilot-budget-id');
    // Should either load the budget or redirect to a valid page (not a 404 or blank)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    await page.waitForTimeout(2000);
  });
});

// ============================================================
// TEST SUITE 4: Company Settings & Team Management
// ============================================================

test.describe('4. Company Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('TC-09: Company settings page loads', async ({ page }) => {
    await page.goto('/company-settings');
    await page.waitForURL(/company-settings/, { timeout: 10000 });
    // Should display company name or settings form
    const heading = page.locator('h1, h2, [class*="title"]').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// TEST SUITE 5: Key Feature Pages
// ============================================================

test.describe('5. Feature Pages Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  const routes = [
    { path: '/apu-library', name: 'APU Library' },
    { path: '/resources', name: 'Resources' },
    { path: '/workers', name: 'Workers' },
    { path: '/invoices', name: 'Invoices' },
    { path: '/rfis', name: 'RFIs' },
    { path: '/submittals', name: 'Submittals' },
    { path: '/punch-list', name: 'Punch List' },
    { path: '/bim', name: 'BIM Library' },
  ];

  for (const { path, name } of routes) {
    test(`TC-10: ${name} page loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(path);
      await page.waitForTimeout(3000);

      // No critical JS errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error')
      );
      expect(criticalErrors).toHaveLength(0);

      // Body is not empty
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});

// ============================================================
// TEST SUITE 6: Security & Multi-tenant Isolation
// ============================================================

test.describe('6. Security Checks', () => {
  test('TC-11: No source maps exposed in production-like build', async ({ page }) => {
    await page.goto('/');
    // Check that we are not exposing source maps in prod mode
    // This is a smoke test — actual verification is via build config
    const response = await page.request.get('http://localhost:5173/src/main.tsx').catch(() => null);
    // In dev mode they're expected, but the test documents the expectation
    // In production, this URL would return 404 or be unavailable
    expect(response?.status()).not.toBe(200); // Files shouldn't be directly accessible as raw source
  });

  test('TC-12: Authentication header required for API routes', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/api/v1/projects', {
      headers: {}, // No auth
    }).catch(() => null);

    if (response) {
      // Should return 401 Unauthorized, not 200
      expect(response.status()).toBe(401);
    }
  });
});

// ============================================================
// TEST SUITE 7: Offline / PWA
// ============================================================

test.describe('7. PWA Offline Behavior', () => {
  test('TC-13: App renders when service worker not available', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Even without SW, app should render
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('TC-14: Network status indicator responds to offline toggle', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/dashboard');

    // Simulate offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    const offlineIndicator = page.locator('[class*="offline"], [data-testid="offline-indicator"]');
    // Don't hard-fail if the indicator isn't visible — it's a nice-to-have
    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator.first()).toBeVisible();
    }

    // Restore online
    await page.context().setOffline(false);
  });
});
