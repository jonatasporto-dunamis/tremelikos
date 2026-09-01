-- ===========================================
-- Migration: 002_rls_option_groups
-- Habilita RLS e cria policies de SELECT público
-- para option_groups, options e product_option_groups
-- ===========================================

-- option_groups
ALTER TABLE option_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Option groups são públicos" ON option_groups;
CREATE POLICY "Option groups são públicos"
  ON option_groups FOR SELECT
  USING (active = true);

-- options
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Options são públicas" ON options;
CREATE POLICY "Options são públicas"
  ON options FOR SELECT
  USING (available = true);

-- product_option_groups (junction: sempre público se grupo ativo)
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product option groups são públicos" ON product_option_groups;
CREATE POLICY "Product option groups são públicos"
  ON product_option_groups FOR SELECT
  USING (true);