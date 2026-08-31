-- ===========================================
-- SEED: Produtos do Cardápio
-- ===========================================

-- ENTRADAS (Porções)
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Batata Frita Tempero da Casa (Pequena 120g)', 'batata-frita-pequena', 'Batata frita com tempero especial da casa, porção de 120g', 13.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Batata Frita Tempero da Casa (Média 350g)', 'batata-frita-media', 'Batata frita com tempero especial da casa, porção de 350g', 21.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Batata Frita Tempero da Casa (Grande 500g)', 'batata-frita-grande', 'Batata frita com tempero especial da casa, porção de 500g', 27.90, true, true, false, NULL);

-- PÃO DE ALHO
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Picanha no Pão de Alho', 'picanha-pao-alho', 'Baguete de 23cm, picanha, pasta de alho prime, vinagrete e queijo derretido maçaricado', 29.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Frango no Pão de Alho', 'frango-pao-alho', 'Baguete de 23cm, frango grelhado, pasta de alho prime, vinagrete e queijo derretido maçaricado', 25.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Calabresa no Pão de Alho', 'calabresa-pao-alho', 'Baguete de 23cm, calabresa, pasta de alho prime, vinagrete e queijo derretido maçaricado', 25.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Costela no Pão de Alho', 'costela-pao-alho', 'Baguete de 23cm, costela, pasta de alho prime, vinagrete e queijo derretido maçaricado', 29.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Beirute', 'beirute', 'Pão sírio, rosbife de alcatra, ovo, peito de peru, muçarela, alface e tomate', 28.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Peito Bovino no Pão de Alho', 'peito-bovino-pao-alho', 'Baguete de 23cm, peito bovino, pasta de alho prime, vinagrete e queijo derretido maçaricado', 25.90, true, true, false, NULL);

-- LINHA TRADICIONAL
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'Cheese Burguer', 'cheese-burguer', 'Pão de hambúrguer, hambúrguer artesanal 100g e queijo', 14.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'Cheese Salada', 'cheese-salada', 'Pão de hambúrguer, hambúrguer artesanal 100g, queijo, alface e tomate', 16.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'Cheese Egg Salada', 'cheese-egg-salada', 'Pão de hambúrguer, hambúrguer artesanal 100g, queijo, ovo, alface e tomate', 19.50, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'Double Cheese', 'double-cheese', 'Pão de hambúrguer, 2x hambúrguer artesanal 100g, 2x queijos, alface e tomate', 27.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Tudo', 'tremelikos-tudo', 'Pão, hambúrguer artesanal 100g, queijo, presunto, ovo, frango, calabresa, bacon, catupiry, milho verde, batata palha, alface e tomate', 29.99, true, true, true, 'Mais Pedido');

-- LINHA DE BACON
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'Cheese Bacon', 'cheese-bacon', 'Pão, hambúrguer artesanal 100g, queijo, bacon, alface e tomate', 24.50, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'Cheese Egg Bacon', 'cheese-egg-bacon', 'Pão, hambúrguer artesanal 100g, ovo, queijo, bacon, alface e tomate', 26.90, true, true, true, 'Favorito'),
  ('c0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'Double Cheese Bacon', 'double-cheese-bacon', 'Pão, 2x hambúrgueres 100g, 2x queijos, 2x bacons, alface e tomate', 31.90, true, true, false, NULL);

-- LINHA DE FRANGO
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000001', 'Cheese Frango Salada', 'cheese-frango-salada', 'Pão, filé de frango empanado crocante, queijo, alface e picles', 17.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001', 'Cheese Frango Bacon Salada', 'cheese-frango-bacon', 'Pão, filé de frango empanado crocante, queijo, bacon, alface e picles', 21.50, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001', 'Cheese Frango Catupiry Salada', 'cheese-frango-catupiry', 'Pão, filé de frango empanado crocante, queijo, catupiry, alface e picles', 24.99, true, true, false, NULL);

-- LINHA DE PICANHA
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000001', 'Cheese Picanha', 'cheese-picanha', 'Pão de hambúrguer, 150g de picanha grelhada na brasa, queijo, alface e tomate', 29.90, true, true, false, 'Na Brasa'),
  ('c0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001', 'Cheese Picanha Egg', 'cheese-picanha-egg', 'Pão, 150g de picanha grelhada na brasa, ovo, queijo, alface e tomate', 31.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000001', 'Cheese Picanha Egg Bacon', 'cheese-picanha-egg-bacon', 'Pão de hambúrguer, 150g de picanha grelhada na brasa, ovo, queijo, bacon, tomate e alface', 33.99, true, true, false, NULL);

-- LINHA GOUMET
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Cheddar', 'tremelikos-cheddar', 'Pão australiano, hambúrguer artesanal suculento 180g, cheddar, picles, cebola caramelizada e anel de cebola frita', 28.99, true, true, true, 'Gourmet'),
  ('c0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Gordon Black', 'tremelikos-gordon-black', 'Pão australiano, hambúrguer artesanal suculento 180g, creme de gorgonzola, alho negro e cebola crispy', 29.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Porto''s Burguer', 'tremelikos-portos', 'Pão de brioche, hambúrguer artesanal suculento 180g, bacon caramelizado, queijo, cheddar cremoso, cebola crispy, banana da terra grelhada e tomate empanado', 29.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000063', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Kenneth Burguer', 'tremelikos-kenneth', 'Pão de brioche, hambúrguer artesanal suculento 180g, queijo coalho derretido na brasa, banana da terra, melaço de cana e cebola crispy', 29.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000064', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Trípoli Burguer', 'tremelikos-tripoli', 'Pão de brioche, hambúrguer artesanal suculento 180g, abacaxi grelhado na brasa, queijo coalho na brasa, banana da terra, melaço de cana e alface', 32.90, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000065', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Hard Work Burguer', 'tremelikos-hard-work', 'Pão de brioche, hambúrguer artesanal suculento 180g, queijo empanado, geleia de pimenta e picles', 29.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000066', 'a0000000-0000-0000-0000-000000000001', 'Tremeliko''s Smash Burguer', 'tremelikos-smash', 'Pão de brioche, hambúrguer artesanal suculento 180g, cheddar cremoso, maionese de bacon, cebola caramelizada', 28.90, true, true, false, NULL);

-- BEBIDAS
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000070', 'a0000000-0000-0000-0000-000000000001', 'Coca-Cola 1 Litro', 'coca-cola-1l', 'Refrigerante Coca-Cola 1 litro', 9.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000071', 'a0000000-0000-0000-0000-000000000001', 'Guaraná Antarctica 1 Litro', 'guarana-1l', 'Refrigerante Guaraná Antarctica 1 litro', 9.99, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000072', 'a0000000-0000-0000-0000-000000000001', 'Coca-Cola Lata', 'coca-cola-lata', 'Refrigerante Coca-Cola lata 350ml', 6.00, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000073', 'a0000000-0000-0000-0000-000000000001', 'Guaraná Antarctica Lata', 'guarana-lata', 'Refrigerante Guaraná Antarctica lata 350ml', 6.00, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000074', 'a0000000-0000-0000-0000-000000000001', 'Água sem Gás', 'agua-sem-gas', 'Água mineral sem gás 500ml', 3.00, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000075', 'a0000000-0000-0000-0000-000000000001', 'Água com Gás', 'agua-com-gas', 'Água mineral com gás 500ml', 4.00, true, true, false, NULL);

-- SUCOS
INSERT INTO products (id, store_id, name, slug, description, base_price, active, available, featured, badge) VALUES
  ('c0000000-0000-0000-0000-000000000080', 'a0000000-0000-0000-0000-000000000001', 'Suco de Cacau com Leite', 'suco-cacau', 'Suco de polpa com leite, copo de 500ml', 7.00, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000081', 'a0000000-0000-0000-0000-000000000001', 'Suco de Cupuaçu com Leite', 'suco-cupuacu', 'Suco de polpa com leite, copo de 500ml', 7.00, true, true, false, NULL),
  ('c0000000-0000-0000-0000-000000000082', 'a0000000-0000-0000-0000-000000000001', 'Suco de Graviola com Leite', 'suco-graviola', 'Suco de polpa com leite, copo de 500ml', 7.00, true, true, false, NULL);
