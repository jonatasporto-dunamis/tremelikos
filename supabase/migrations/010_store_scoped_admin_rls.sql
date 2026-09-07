-- ===========================================
-- Migration: 010_store_scoped_admin_rls
-- Reforça policies admin com escopo por store_id.
-- Service role continua com acesso total; usuários
-- autenticados (incluindo admins) ficam limitados
-- à própria loja.
-- ===========================================

-- Helper: retorna a store_id do admin autenticado (ou NULL se não for admin ativo)
CREATE OR REPLACE FUNCTION public.current_admin_store_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM admin_profiles
  WHERE user_id = auth.uid() AND active = true
  LIMIT 1;
$$;

-- ===========================================
-- Tabelas com store_id direto
-- ===========================================

-- Stores: admin pode ler/editar apenas sua própria loja
DROP POLICY IF EXISTS "Admin stores scoped" ON stores;
CREATE POLICY "Admin stores scoped" ON stores
  FOR ALL TO authenticated
  USING (id = current_admin_store_id())
  WITH CHECK (id = current_admin_store_id());

-- Sections: escopo por store_id
DROP POLICY IF EXISTS "Admin sections scoped" ON sections;
CREATE POLICY "Admin sections scoped" ON sections
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Products: escopo por store_id
DROP POLICY IF EXISTS "Admin products scoped" ON products;
CREATE POLICY "Admin products scoped" ON products
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Option groups: escopo por store_id
DROP POLICY IF EXISTS "Admin option_groups scoped" ON option_groups;
CREATE POLICY "Admin option_groups scoped" ON option_groups
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Promotions: escopo por store_id
DROP POLICY IF EXISTS "Admin promotions scoped" ON promotions;
CREATE POLICY "Admin promotions scoped" ON promotions
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Coupons: escopo por store_id
DROP POLICY IF EXISTS "Admin coupons scoped" ON coupons;
CREATE POLICY "Admin coupons scoped" ON coupons
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Store overrides: escopo por store_id
DROP POLICY IF EXISTS "Admin store_overrides scoped" ON store_overrides;
CREATE POLICY "Admin store_overrides scoped" ON store_overrides
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Business hours: escopo por store_id
DROP POLICY IF EXISTS "Admin business_hours scoped" ON business_hours;
CREATE POLICY "Admin business_hours scoped" ON business_hours
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Customers: escopo por store_id
DROP POLICY IF EXISTS "Admin customers scoped" ON customers;
CREATE POLICY "Admin customers scoped" ON customers
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- Orders: escopo por store_id
DROP POLICY IF EXISTS "Admin orders scoped" ON orders;
CREATE POLICY "Admin orders scoped" ON orders
  FOR ALL TO authenticated
  USING (store_id = current_admin_store_id())
  WITH CHECK (store_id = current_admin_store_id());

-- ===========================================
-- Tabelas sem store_id — escopo via join/exists
-- ===========================================

-- Section products: via products.store_id e sections.store_id
DROP POLICY IF EXISTS "Admin section_products scoped" ON section_products;
CREATE POLICY "Admin section_products scoped" ON section_products
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = section_products.product_id AND products.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM sections WHERE sections.id = section_products.section_id AND sections.store_id = current_admin_store_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM products WHERE products.id = section_products.product_id AND products.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM sections WHERE sections.id = section_products.section_id AND sections.store_id = current_admin_store_id())
  );

-- Product option groups: via products.store_id e option_groups.store_id
DROP POLICY IF EXISTS "Admin product_option_groups scoped" ON product_option_groups;
CREATE POLICY "Admin product_option_groups scoped" ON product_option_groups
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_option_groups.product_id AND products.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM option_groups WHERE option_groups.id = product_option_groups.option_group_id AND option_groups.store_id = current_admin_store_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_option_groups.product_id AND products.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM option_groups WHERE option_groups.id = product_option_groups.option_group_id AND option_groups.store_id = current_admin_store_id())
  );

-- Options: via option_groups.store_id
DROP POLICY IF EXISTS "Admin options scoped" ON options;
CREATE POLICY "Admin options scoped" ON options
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM option_groups WHERE option_groups.id = options.option_group_id AND option_groups.store_id = current_admin_store_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM option_groups WHERE option_groups.id = options.option_group_id AND option_groups.store_id = current_admin_store_id())
  );

-- Product images: via products.store_id
DROP POLICY IF EXISTS "Admin product_images scoped" ON product_images;
CREATE POLICY "Admin product_images scoped" ON product_images
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.store_id = current_admin_store_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.store_id = current_admin_store_id())
  );

-- Promotion products: via promotions.store_id e products.store_id
DROP POLICY IF EXISTS "Admin promotion_products scoped" ON promotion_products;
CREATE POLICY "Admin promotion_products scoped" ON promotion_products
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM promotions WHERE promotions.id = promotion_products.promotion_id AND promotions.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM products WHERE products.id = promotion_products.product_id AND products.store_id = current_admin_store_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM promotions WHERE promotions.id = promotion_products.promotion_id AND promotions.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM products WHERE products.id = promotion_products.product_id AND products.store_id = current_admin_store_id())
  );

-- Promotion sections: via promotions.store_id e sections.store_id
DROP POLICY IF EXISTS "Admin promotion_sections scoped" ON promotion_sections;
CREATE POLICY "Admin promotion_sections scoped" ON promotion_sections
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM promotions WHERE promotions.id = promotion_sections.promotion_id AND promotions.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM sections WHERE sections.id = promotion_sections.section_id AND sections.store_id = current_admin_store_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM promotions WHERE promotions.id = promotion_sections.promotion_id AND promotions.store_id = current_admin_store_id())
    AND EXISTS (SELECT 1 FROM sections WHERE sections.id = promotion_sections.section_id AND sections.store_id = current_admin_store_id())
  );

-- Order items: via orders.store_id
DROP POLICY IF EXISTS "Admin order_items scoped" ON order_items;
CREATE POLICY "Admin order_items scoped" ON order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.store_id = current_admin_store_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.store_id = current_admin_store_id())
  );

SELECT 'store scoped admin policies ok' AS result;
