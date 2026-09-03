-- ===========================================
-- Migration: 007_orders.sql
-- Tabelas: customers, orders, order_items
-- Para pré-pedidos, identificação e checkout
-- ===========================================

-- =================== CUSTOMERS ===================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,            -- DDI+DDD+número (normalizado)
  name TEXT,
  email TEXT,
  total_orders INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  lead_score INTEGER DEFAULT 0,   -- 0-100 (heurística simples)
  source TEXT,                    -- 'whatsapp' | 'returning' | ...
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (store_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);

-- =================== ORDERS ===================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cart_id TEXT,                   -- identificador curto do carrinho
  transaction_id TEXT,            -- mesmo do tracking purchase
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled','scheduled')),
  order_type TEXT NOT NULL DEFAULT 'pickup'
    CHECK (order_type IN ('pickup','delivery')),
  payment_method TEXT,            -- 'pix' | 'cash' | 'card' | 'whatsapp'
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- endereço de entrega (denormalizado para histórico)
  delivery_address TEXT,
  delivery_neighborhood TEXT,
  delivery_city TEXT,
  delivery_zip TEXT,
  delivery_complement TEXT,
  scheduled_for TIMESTAMPTZ,      -- pré-agendamento
  notes TEXT,                     -- observações gerais do cliente
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  source TEXT,                    -- 'web' | 'whatsapp_return' | ...
  utm JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cart ON orders(cart_id);

-- =================== ORDER ITEMS ===================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  extras JSONB DEFAULT '[]'::jsonb,
  removed_ingredients JSONB DEFAULT '[]'::jsonb,
  observations TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- =================== TRIGGERS ===================
-- Atualiza updated_at em updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =================== RLS ===================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Service role ignora RLS; as inserções via API usam service_role.
-- Admin lê tudo:
DROP POLICY IF EXISTS "Admin customers select" ON customers;
CREATE POLICY "Admin customers select" ON customers
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin customers write" ON customers;
CREATE POLICY "Admin customers write" ON customers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin orders select" ON orders;
CREATE POLICY "Admin orders select" ON orders
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin orders write" ON orders;
CREATE POLICY "Admin orders write" ON orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin order_items select" ON order_items;
CREATE POLICY "Admin order_items select" ON order_items
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin order_items write" ON order_items;
CREATE POLICY "Admin order_items write" ON order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

SELECT 'orders, order_items, customers ok' AS result;
