import { test, expect } from '@playwright/test';

test.describe('Cardápio Digital', () => {
  test('pagina inicial carrega corretamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText("Tremeliko's Burguer");
    await expect(page.locator('text=Hambúrguer na brasa')).toBeVisible();
  });

  test('navegacao por categorias funciona', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Gourmet 180g');
    await expect(page.locator('#gourmet')).toBeVisible();
  });

  test('adicionar item ao carrinho', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Adicionar >> nth=0');
    await expect(page.locator('text=1')).toBeVisible();
  });

  test('carrinho exibe itens adicionados', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Adicionar >> nth=0');
    await page.click('text=Ver pedido');
    await expect(page.locator('text=Seu Pedido')).toBeVisible();
  });

  test('whatsapp envia pedido formatado', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Adicionar >> nth=0');
    await page.click('text=Ver pedido');

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text=Enviar pedido via WhatsApp'),
    ]);

    await popup.waitForLoadState();
    const url = popup.url();
    expect(url).toContain('wa.me');
  });
});

test.describe('Mobile', () => {
  test('interface responsiva em mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Hambúrguer na brasa')).toBeVisible();
  });

  test('carrinho fixo no rodape em mobile', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Adicionar >> nth=0');
    await expect(page.locator('text=Ver pedido')).toBeVisible();
  });
});
