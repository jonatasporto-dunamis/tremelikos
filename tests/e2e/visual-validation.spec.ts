import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-small', width: 360, height: 744 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 },
  { name: 'large', width: 1366, height: 768 },
];

test.describe('Validação visual e acessibilidade', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('home não tem scroll horizontal', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });

      test('barra fixa do carrinho não cobre conteúdo', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.click('text=Adicionar');
        await page.waitForTimeout(500);
        const cartBar = page.locator('[aria-label="Resumo do carrinho"]');
        if (await cartBar.count() > 0) {
          const box = await cartBar.boundingBox();
          const pageHeight = await page.evaluate(() => window.innerHeight);
          expect(box?.y).toBeGreaterThanOrEqual(pageHeight - 120);
        }
      });

      test('preço não quebra R$ do valor', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        const price = page.locator('.text-brand.font-extrabold').first();
        if (await price.count() > 0) {
          const text = await price.innerText();
          expect(text).not.toMatch(/R\$\n?/);
        }
      });

      test('não existe botão aninhado', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        const nested = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some((btn) => btn.querySelector('button'));
        });
        expect(nested).toBe(false);
      });

      test('controles operacionais têm pelo menos 44x44', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        const smallControls = await page.evaluate(() => {
          const selectors = [
            'button', 'a', 'input[type="checkbox"]', 'input[type="radio"]', 'input[type="submit"]',
          ];
          const elements = Array.from(document.querySelectorAll(selectors.join(',')));
          return elements.filter((el) => {
            const rect = (el as HTMLElement).getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
          }).length;
        });
        expect(smallControls).toBe(0);
      });
    });
  }
});
