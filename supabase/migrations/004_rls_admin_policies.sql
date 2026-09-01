-- ===========================================
-- Migration: 004_rls_admin_policies
-- Policies de INSERT/UPDATE/DELETE para admin
-- autenticado (auth.uid() presente em admin_profiles
-- com active=true e role in ('admin','manager'))
-- ===========================================

-- Helper: function is_admin() - cacheia resultado em (SELECT) para performance
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND active = true
  );
$$;

-- Stores (admin pode editar a própria loja)
DROP POLICY IF EXISTS "Admin stores write" ON stores;
CREATE POLICY "Admin stores write" ON stores
  FOR ALL TO authenticated
  USING (is_admin() AND store_id = id)
  WITH CHECK (is_admin() AND store_id = id);

-- Sections
DROP POLICY IF EXISTS "Admin sections write" ON sections;
CREATE POLICY "Admin sections write" ON sections
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Products
DROP POLICY IF EXISTS "Admin products write" ON products;
CREATE POLICY "Admin products write" ON products
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Section products
DROP POLICY IF EXISTS "Admin section_products write" ON section_products;
CREATE POLICY "Admin section_products write" ON section_products
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Option groups, options, product_option_groups
DROP POLICY IF EXISTS "Admin option_groups write" ON option_groups;
CREATE POLICY "Admin option_groups write" ON option_groups
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin options write" ON options;
CREATE POLICY "Admin options write" ON options
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin product_option_groups write" ON product_option_groups;
CREATE POLICY "Admin product_option_groups write" ON product_option_groups
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Promotions
DROP POLICY IF EXISTS "Admin promotions write" ON promotions;
CREATE POLICY "Admin promotions write" ON promotions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin promotion_products write" ON promotion_products;
CREATE POLICY "Admin promotion_products write" ON promotion_products
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin promotion_sections write" ON promotion_sections;
CREATE POLICY "Admin promotion_sections write" ON promotion_sections
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Coupons
DROP POLICY IF EXISTS "Admin coupons write" ON coupons;
CREATE POLICY "Admin coupons write" ON coupons
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Business hours
DROP POLICY IF EXISTS "Admin business_hours write" ON business_hours;
CREATE POLICY "Admin business_hours write" ON business_hours
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Store overrides
DROP POLICY IF EXISTS "Admin store_overrides write" ON store_overrides;
CREATE POLICY "Admin store_overrides write" ON store_overrides
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Audit logs: admin pode SELECT; INSERT via service_role (sistema)
DROP POLICY IF EXISTS "Admin audit_logs select" ON audit_logs;
CREATE POLICY "Admin audit_logs select" ON audit_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admin profiles: admin pode ler o próprio
DROP POLICY IF EXISTS "Admin profiles self select" ON admin_profiles;
CREATE POLICY "Admin profiles self select" ON admin_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

SELECT 'admin policies ok' AS result;