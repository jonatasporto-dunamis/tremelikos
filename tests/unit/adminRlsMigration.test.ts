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
});
