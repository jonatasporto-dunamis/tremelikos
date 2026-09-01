-- ===========================================
-- Migration: 003_rls_promotion_links
-- Habilita RLS + SELECT publico para
-- promotion_products e promotion_sections
-- (sem isso a API /api/promotions nao retorna escopo)
-- ===========================================

ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promotion products são públicos" ON promotion_products;
CREATE POLICY "Promotion products são públicos"
  ON promotion_products FOR SELECT USING (true);

ALTER TABLE promotion_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promotion sections são públicas" ON promotion_sections;
CREATE POLICY "Promotion sections são públicas"
  ON promotion_sections FOR SELECT USING (true);

-- coupons: ja tem policy publica, mas a validacao precisa do coupon completo;
-- a policy atual ja permite SELECT.
SELECT 'ok' AS result;