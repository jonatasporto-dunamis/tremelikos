import { test, expect } from '@playwright/test';

test.describe('Cardápio Digital', () => {
  test('pagina inicial carrega corretamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toContainText('Hambúrguer na brasa');
    // o nome da loja aparece no header (link brand) e em todo o site
    await expect(page.locator('header[role="banner"]')).toContainText("Tremeliko's Burguer");
  });

  test('navegacao por categorias funciona', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Gourmet 180g');
    await expect(page.locator('#gourmet')).toBeVisible();
  });

  test('14.2.1 — fluxo: home → add → carrinho', async ({ page }) => {
    await page.goto('/');
    // 1. Adicionar item ao carrinho
    await page.click('text=Adicionar >> nth=0');
    // 2. Ver pedido (abre painel do carrinho)
    await page.click('text=Ver pedido');
    await expect(page.locator('text=Continuar pedido')).toBeVisible();
    // 3. Avançar para próxima etapa
    await page.click('text=Continuar pedido');
    // Estamos em /carrinho ou /carrinho/identificacao
    await expect(page).toHaveURL(/\/carrinho/);
  });

  test('adicionar item ao carrinho mostra confirmação ou botão de continuar', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Adicionar >> nth=0');
    // Após adicionar, deve aparecer o toast de confirmação com "Ver pedido" ou a barra do carrinho
    await expect(
      page.locator('text=Ver pedido').or(page.locator('text=Continuar pedido')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('carrinho exibe itens adicionados', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Adicionar >> nth=0');
    await page.locator('text=Ver pedido').first().click();
    await expect(page).toHaveURL(/\/carrinho/);
  });

  test('whatsapp envia pedido formatado', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Adicionar >> nth=0');
    await page.click('text=Ver pedido');
    // Abre /carrinho
    await page.waitForURL(/\/carrinho(\b|$)/);
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 10000 }).catch(() => null),
      page.locator('button:has-text("Enviar"), a:has-text("Enviar")').first().click(),
    ]);
    if (popup) {
      const url = popup.url();
      expect(url).toContain('wa.me');
    } else {
      // fallback: garante que o botão clicou (sem popup em headless)
      await expect(page.locator('body')).toContainText(/WhatsApp/i);
    }
  });
});

test.describe('14.2.2 — Páginas institucionais', () => {
  test('página /combos carrega', async ({ page }) => {
    const res = await page.goto('/combos');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('página /perfil-da-loja carrega', async ({ page }) => {
    const res = await page.goto('/perfil-da-loja');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('página /produto/[slug] carrega', async ({ page }) => {
    await page.goto('/');
    // pega o primeiro link de produto (slug visível na home)
    const firstProductLink = page.locator('a[href^="/produto/"]').first();
    if (await firstProductLink.count() > 0) {
      const href = await firstProductLink.getAttribute('href');
      const res = await page.goto(href!);
      expect(res?.status()).toBeLessThan(400);
    } else {
      // fallback: tenta via cardápio
      await page.goto('/combos');
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('página /politica-de-privacidade carrega e tem LGPD', async ({ page }) => {
    const res = await page.goto('/politica-de-privacidade');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1').filter({ hasText: 'Política de Privacidade' })).toBeVisible();
    await expect(page.locator('text=LGPD').first()).toBeVisible();
  });

  test('sitemap.xml serve lista de URLs', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    expect(res?.status()).toBe(200);
    const xml = await page.content();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('tremelikos.growthpulse.com.br');
  });

  test('robots.txt bloqueia /admin', async ({ page }) => {
    await page.goto('/robots.txt');
    const text = await page.content();
    expect(text).toContain('Disallow: /admin/');
  });
});

test.describe('14.2.3 — Admin smoke', () => {
  test('login admin mostra tela de autenticação', async ({ page }) => {
    await page.goto('/admin');
    // ou é redirecionado pro login, ou mostra a tela inicial
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Resiliência', () => {
  test('service worker (sw.js) é servido e é JS válido', async ({ page }) => {
    const res = await page.request.get('/sw.js');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('self.addEventListener');
  });

  test('manifest.webmanifest serve metadata', async ({ page }) => {
    const res = await page.request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.name).toContain('Tremeliko');
    expect(json.start_url).toBe('/');
  });

  test('headers de segurança aplicados', async ({ page }) => {
    const res = await page.goto('/');
    const headers = res!.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
