import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION_PATH = join(process.cwd(), 'supabase/migrations/010_store_scoped_admin_rls.sql');

/**
 * Testes estáticos da migration 010.
 * Verificam que a migration declara:
 *  - helper current_admin_store_id()
 *  - policies para tabelas com store_id
 *  - policies para tabelas sem store_id (via EXISTS/join)
 *  - uso de current_admin_store_id() (não apenas is_admin() genérico)
 */
describe('migration 010 store scoped admin RLS', () => {
  const sql = readFileSync(MIGRATION_PATH, 'utf-8');

  const TABLES_WITH_STORE_ID = [
    'stores',
    'sections',
    'products',
    'option_groups',
    'promotions',
    'coupons',
    'store_overrides',
    'business_hours',
    'customers',
    'orders',
  ];

  const TABLES_VIA_JOIN = [
    'section_products',
    'product_option_groups',
    'options',
    'product_images',
    'promotion_products',
    'promotion_sections',
    'order_items',
  ];

  it('declara helper current_admin_store_id()', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION\s+public\.current_admin_store_id\s*\(\s*\)\s*RETURNS\s+uuid/i);
  });

  it('helper current_admin_store_id() filtra por active=true', () => {
    expect(sql).toMatch(/active\s*=\s*true/i);
  });

  it.each(TABLES_WITH_STORE_ID)('declara policy escopada para tabela %s', (table) => {
    const pattern = new RegExp(
      `CREATE\\s+POLICY\\s+"[^"]*scoped"\\s+ON\\s+${table}\\b[\\s\\S]*?store_id\\s*=\\s*current_admin_store_id\\(\\)`,
      'i'
    );
    expect(sql).toMatch(pattern);
  });

  it.each(TABLES_VIA_JOIN)('declara policy via EXISTS para tabela %s', (table) => {
    const pattern = new RegExp(
      `CREATE\\s+POLICY\\s+"[^"]*scoped"\\s+ON\\s+${table}\\b[\\s\\S]*?EXISTS`,
      'i'
    );
    expect(sql).toMatch(pattern);
  });

  it('não mantém policies antigas sem store_id sem EXISTS', () => {
    // Garante que a migration dropa policies amplas e cria scoped
    expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS/i);
    expect(sql).toMatch(/FOR\s+ALL\s+TO\s+authenticated/i);
  });

  it('migration termina com mensagem de sucesso', () => {
    expect(sql).toMatch(/'store scoped admin policies ok'\s+AS\s+result/i);
  });

  // ===========================================
  // Verificação de DROP das policies antigas
  // Policies permissivas no PostgreSQL/Supabase se combinam com OR;
  // policies antigas com USING (is_admin()) devem ser removidas antes de criar as novas.
  // ===========================================

  const OLD_POLICIES = [
    { name: 'Admin stores write', table: 'stores' },
    { name: 'Admin sections write', table: 'sections' },
    { name: 'Admin products write', table: 'products' },
    { name: 'Admin section_products write', table: 'section_products' },
    { name: 'Admin option_groups write', table: 'option_groups' },
    { name: 'Admin options write', table: 'options' },
    { name: 'Admin product_option_groups write', table: 'product_option_groups' },
    { name: 'Admin promotions write', table: 'promotions' },
    { name: 'Admin promotion_products write', table: 'promotion_products' },
    { name: 'Admin promotion_sections write', table: 'promotion_sections' },
    { name: 'Admin coupons write', table: 'coupons' },
    { name: 'Admin business_hours write', table: 'business_hours' },
    { name: 'Admin store_overrides write', table: 'store_overrides' },
    { name: 'Admin customers select', table: 'customers' },
    { name: 'Admin customers write', table: 'customers' },
    { name: 'Admin orders select', table: 'orders' },
    { name: 'Admin orders write', table: 'orders' },
    { name: 'Admin order_items select', table: 'order_items' },
    { name: 'Admin order_items write', table: 'order_items' },
  ];

  it.each(OLD_POLICIES)('dropa policy antiga "$name" em $table', ({ name, table }) => {
    const pattern = new RegExp(
      `DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"${name}"\\s+ON\\s+${table}`,
      'i'
    );
    expect(sql).toMatch(pattern);
  });

  it('DROP de policies antigas aparece ANTES dos CREATE POLICY novos', () => {
    // Encontra a posição do primeiro DROP de policy antiga e do primeiro CREATE POLICY scoped
    const firstOldDrop = sql.search(/DROP\s+POLICY\s+IF\s+EXISTS\s+"Admin\s+(stores|sections|products|section_products|option_groups|options|product_option_groups|promotions|promotion_products|promotion_sections|coupons|business_hours|store_overrides|customers|orders|order_items)/i);
    const firstScopedCreate = sql.search(/CREATE\s+POLICY\s+"[^"]*scoped"/i);
    expect(firstOldDrop).toBeGreaterThan(-1);
    expect(firstScopedCreate).toBeGreaterThan(-1);
    expect(firstOldDrop).toBeLessThan(firstScopedCreate);
  });

  it('não cria nova policy usando apenas is_admin() amplo', () => {
    // Garante que nenhuma CREATE POLICY nova usa is_admin() como único predicado
    // (políticas novas devem usar current_admin_store_id())
    // Regex captura CREATE POLICY ... USING (is_admin()) sem AND store_id
    const broadCreate = /CREATE\s+POLICY[\s\S]*?USING\s*\(\s*is_admin\s*\(\s*\)\s*\)/i;
    expect(sql).not.toMatch(broadCreate);
  });

  it('todas as novas policies referenciam current_admin_store_id()', () => {
    // Cada CREATE POLICY com "scoped" deve usar current_admin_store_id()
    const scopedPolicies = sql.match(/CREATE\s+POLICY\s+"[^"]*scoped"/gi) || [];
    expect(scopedPolicies.length).toBeGreaterThan(0);
    // Pega o trecho entre o helper (depois do DROP block) e o final
    const helperEnd = sql.indexOf('-- ===========================================\n-- Tabelas com store_id direto');
    const scopedSection = helperEnd > -1 ? sql.slice(helperEnd) : sql;
    // Dentro da seção de policies, conta CREATE POLICY scoped e menções a current_admin_store_id
    const scopedCreates = (scopedSection.match(/CREATE\s+POLICY\s+"[^"]*scoped"/gi) || []).length;
    const storeIdRefs = (scopedSection.match(/current_admin_store_id\s*\(\s*\)/g) || []).length;
    // Cada policy scoped usa current_admin_store_id() pelo menos uma vez
    expect(storeIdRefs).toBeGreaterThanOrEqual(scopedCreates);
  });
});
