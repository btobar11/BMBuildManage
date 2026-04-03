# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: financial-integrity.spec.ts >> Financial Integrity & Margin Alerts >> should update margin alerts dynamically and persist fee changes
- Location: tests\e2e\financial-integrity.spec.ts:15:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#professional-fee-meta')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#professional-fee-meta')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - img "BMBuildManage"
      - button "Toggle theme" [ref=e8]:
        - img [ref=e9]
    - navigation [ref=e11]:
      - link "Proyectos" [ref=e12] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e13]:
          - img [ref=e15]
          - generic [ref=e20]: Proyectos
      - link "Base de Recursos" [ref=e21] [cursor=pointer]:
        - /url: /resources
        - generic [ref=e22]:
          - img [ref=e24]
          - generic [ref=e28]: Base de Recursos
      - link "Biblioteca APU" [ref=e29] [cursor=pointer]:
        - /url: /apu-library
        - generic [ref=e30]:
          - img [ref=e32]
          - generic [ref=e34]: Biblioteca APU
      - link "Trabajadores" [ref=e35] [cursor=pointer]:
        - /url: /workers
        - generic [ref=e36]:
          - img [ref=e38]
          - generic [ref=e43]: Trabajadores
      - link "Gastos y Facturas" [ref=e44] [cursor=pointer]:
        - /url: /invoices
        - generic [ref=e45]:
          - img [ref=e47]
          - generic [ref=e49]: Gastos y Facturas
      - link "Mi Empresa" [ref=e50] [cursor=pointer]:
        - /url: /company-settings
        - generic [ref=e51]:
          - img [ref=e53]
          - generic [ref=e56]: Mi Empresa
    - generic [ref=e57]:
      - generic [ref=e58]:
        - generic [ref=e59]: U
        - generic [ref=e60]:
          - paragraph [ref=e61]: Usuario Demo
          - paragraph [ref=e62]: demo@bmbuild.com
      - button "Cerrar Sesión" [ref=e63]:
        - img [ref=e64]
        - text: Cerrar Sesión
  - main [ref=e67]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const PILOT_BUDGET_ID = 'c1d2e3f4-a5b6-7890-cdef-123456789012';
  4  | 
  5  | test.describe('Financial Integrity & Margin Alerts', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     // Login
  8  |     await page.goto('/login', { waitUntil: 'networkidle' });
  9  |     const demoButton = page.locator('button', { hasText: 'Acceso Demo (Desarrollo)' });
  10 |     await expect(demoButton).toBeVisible();
  11 |     await demoButton.click();
  12 |     await expect(page).toHaveURL(/.*dashboard/);
  13 |   });
  14 | 
  15 |   test('should update margin alerts dynamically and persist fee changes', async ({ page }) => {
  16 |     await page.goto(`/budget/${PILOT_BUDGET_ID}`);
  17 |     await page.waitForLoadState('networkidle');
  18 |     
  19 |     // 1. Locate Meta Honorarios select
  20 |     const feeSelect = page.locator('#professional-fee-meta'); 
> 21 |     await expect(feeSelect).toBeVisible();
     |                             ^ Error: expect(locator).toBeVisible() failed
  22 |     
  23 |     // 2. Set Meta to 20%
  24 |     await feeSelect.fill('20');
  25 |     await feeSelect.press('Enter');
  26 | 
  27 |     // 3. Set Client Price to a low value to trigger ROSE alert (Critical)
  28 |     const priceButton = page.locator('button[title="Clic para editar"]');
  29 |     await priceButton.click();
  30 |     const priceInput = page.locator('input.text-xl.font-black.text-blue-400');
  31 |     await priceInput.fill('1000000');
  32 |     await priceInput.press('Enter');
  33 | 
  34 |     // 4. Verify Rose alert classes
  35 |     const alertContainer = page.locator('#financial-health-alert');
  36 |     await expect(alertContainer).toBeVisible({ timeout: 10000 });
  37 |     await expect(alertContainer).toHaveClass(/bg-rose-500/);
  38 |     await expect(alertContainer).toContainText('Tu Utilidad');
  39 |     
  40 |     // 5. Change Meta to 5% to trigger Emerald alert (Success)
  41 |     await feeSelect.fill('5');
  42 |     await feeSelect.press('Enter');
  43 |     
  44 |     await expect(alertContainer).toHaveClass(/bg-emerald-500/);
  45 | 
  46 |     // 6. Save and Reload to Verify Persistence
  47 |     const saveButton = page.locator('#save-budget-button');
  48 |     await saveButton.click();
  49 |     
  50 |     await page.waitForTimeout(3000);
  51 |     
  52 |     await page.reload();
  53 |     await page.waitForLoadState('networkidle');
  54 |     
  55 |     // Verify value is still 5%
  56 |     await expect(page.locator('#professional-fee-meta')).toHaveValue('5');
  57 |   });
  58 | });
  59 | 
```