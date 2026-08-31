-- ===========================================
-- SEED: Seções do Cardápio
-- ===========================================
INSERT INTO sections (id, store_id, name, slug, description, position, active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ofertas de Hoje', 'ofertas', 'Promoções ativas com prazo claro', 1, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Mais Pedidos', 'mais-pedidos', 'Os campeões de venda', 2, true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Gourmet 180g', 'gourmet', 'Produtos autorais e maior margem', 3, true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Tradicionais 100g', 'tradicionais', 'Linha clássica artesanal', 4, true),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Frango', 'frango', 'Filés empanados crocantes', 5, true),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Picanha na Brasa', 'picanha', 'Picanha grelhada na brasa', 6, true),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Pão de Alho', 'pao-de-alho', 'Lanches no pão de alho', 7, true),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Porções', 'porcoes', 'Batatas e acompanhamentos', 8, true),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Bebidas', 'bebidas', 'Refrigerantes e águas', 9, true),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Sucos', 'sucos', 'Sucos de polpa com leite', 10, true);
