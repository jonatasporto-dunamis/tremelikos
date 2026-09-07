-- ===========================================
-- Migration: 009_store_status_and_delivery.sql
-- Adiciona colunas para status manual e regras de entrega
-- ===========================================

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS manual_pause BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_min_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_max_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_areas JSONB DEFAULT '[]'::jsonb;

SELECT 'store status and delivery columns added' AS result;
