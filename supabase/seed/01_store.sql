-- ===========================================
-- TREMIKO'S BURGUER - SEED DATA
-- Dados iniciais do cardápio
-- ===========================================

-- Inserir loja
INSERT INTO stores (id, name, slug, description, phone, whatsapp, minimum_order, address, city, state, zip_code)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Tremeliko''s Burguer',
  'tremelikos-burguer',
  'Hambúrguer na brasa, sabor de verdade.',
  '5573991542371',
  '5573991542371',
  15.00,
  'Rua Gonçalves da Costa, 3, Jequiezinho',
  'Jequié',
  'BA',
  '45208-089'
);

-- Inserir horários (terça a sábado, 18:30-23:00)
INSERT INTO business_hours (store_id, weekday, opens_at, closes_at, closed) VALUES
  ('a0000000-0000-0000-0000-000000000001', 2, '18:30', '23:00', false),
  ('a0000000-0000-0000-0000-000000000001', 3, '18:30', '23:00', false),
  ('a0000000-0000-0000-0000-000000000001', 4, '18:30', '23:00', false),
  ('a0000000-0000-0000-0000-000000000001', 5, '18:30', '23:00', false),
  ('a0000000-0000-0000-0000-000000000001', 6, '18:30', '23:00', false),
  ('a0000000-0000-0000-0000-000000000001', 0, NULL, NULL, true),
  ('a0000000-0000-0000-0000-000000000001', 1, NULL, NULL, true);
