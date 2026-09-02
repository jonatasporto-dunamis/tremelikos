-- ===========================================
-- Migration: 005_analytics_events
-- Tabela para auditoria de conversões (purchase/lead)
-- Recebida via /api/analytics/events (server-side)
-- ===========================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    text NOT NULL,
  transaction_id text,
  value         numeric(10,2),
  currency      text NOT NULL DEFAULT 'BRL',
  items         jsonb,
  user_id       text,
  session_id    text,
  source        text NOT NULL DEFAULT 'server',
  click_ids     jsonb,
  utm           jsonb,
  ip            text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_transaction ON analytics_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

-- RLS: só admin lê; insert via service_role
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin analytics_events select" ON analytics_events;
CREATE POLICY "Admin analytics_events select" ON analytics_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

SELECT 'analytics_events table ok' AS result;