-- ===========================================
-- Migration: 008_orders_cart_id_unique.sql
-- Garante idempotencia real por loja + cart_id
-- ===========================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_store_cart_unique
  ON orders(store_id, cart_id)
  WHERE cart_id IS NOT NULL;

SELECT 'orders cart_id unique ok' AS result;
