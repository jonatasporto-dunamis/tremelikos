-- ===========================================
-- TREMIKO'S BURGUER - CARDÁPIO DIGITAL
-- Migration: 001_initial_schema
-- Data: 2026-08-31
-- ===========================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABELA: stores (Lojas)
-- ===========================================
CREATE TABLE stores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  minimum_order NUMERIC(10,2) DEFAULT 0,
  address TEXT,
  city TEXT DEFAULT 'Jequié',
  state TEXT DEFAULT 'BA',
  zip_code TEXT,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- TABELA: business_hours (Horários)
-- ===========================================
CREATE TABLE business_hours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  opens_at TIME,
  closes_at TIME,
  closed BOOLEAN DEFAULT false,
  UNIQUE(store_id, weekday)
);

-- ===========================================
-- TABELA: store_overrides (Exceções)
-- ===========================================
CREATE TABLE store_overrides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('open', 'closed')),
  opens_at TIME,
  closes_at TIME,
  reason TEXT,
  UNIQUE(store_id, date)
);

-- ===========================================
-- TABELA: sections (Seções do Cardápio)
-- ===========================================
CREATE TABLE sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- TABELA: products (Produtos)
-- ===========================================
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  badge TEXT,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- TABELA: section_products (Produto em Seções)
-- ===========================================
CREATE TABLE section_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  UNIQUE(section_id, product_id)
);

-- ===========================================
-- TABELA: product_images (Fotos)
-- ===========================================
CREATE TABLE product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- TABELA: option_groups (Grupos de Opções)
-- ===========================================
CREATE TABLE option_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_choices INTEGER DEFAULT 0,
  max_choices INTEGER DEFAULT 1,
  required BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true
);

-- ===========================================
-- TABELA: options (Opções/Adicionais)
-- ===========================================
CREATE TABLE options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  option_group_id UUID REFERENCES option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10,2) DEFAULT 0,
  available BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0
);

-- ===========================================
-- TABELA: product_option_groups (Ligação)
-- ===========================================
CREATE TABLE product_option_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  option_group_id UUID REFERENCES option_groups(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  UNIQUE(product_id, option_group_id)
);

-- ===========================================
-- TABELA: promotions (Promoções)
-- ===========================================
CREATE TABLE promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('fixed_percent', 'fixed_amount', 'product_price')),
  value NUMERIC(10,2) NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  weekdays INTEGER[] DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- TABELA: promotion_products
-- ===========================================
CREATE TABLE promotion_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(promotion_id, product_id)
);

-- ===========================================
-- TABELA: promotion_sections
-- ===========================================
CREATE TABLE promotion_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE(promotion_id, section_id)
);

-- ===========================================
-- TABELA: coupons (Cupons)
-- ===========================================
CREATE TABLE coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('fixed_percent', 'fixed_amount')),
  value NUMERIC(10,2) NOT NULL,
  minimum_order NUMERIC(10,2) DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- TABELA: admin_profiles (Administradores)
-- ===========================================
CREATE TABLE admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- TABELA: audit_logs (Auditoria)
-- ===========================================
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- ÍNDICES
-- ===========================================
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_sections_store ON sections(store_id);
CREATE INDEX idx_section_products_section ON section_products(section_id);
CREATE INDEX idx_promotions_store ON promotions(store_id);
CREATE INDEX idx_promotions_active ON promotions(active);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Stores: leitura pública
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stores são públicas" ON stores FOR SELECT USING (active = true);

-- Business Hours: leitura pública
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Horários são públicos" ON business_hours FOR SELECT USING (true);

-- Sections: leitura pública
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seções ativas são públicas" ON sections FOR SELECT USING (active = true);

-- Products: leitura pública
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos ativos são públicos" ON products FOR SELECT USING (active = true AND available = true);

-- Section Products: leitura pública
ALTER TABLE section_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Section products são públicos" ON section_products FOR SELECT USING (true);

-- Product Images: leitura pública
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Imagens são públicas" ON product_images FOR SELECT USING (true);

-- Option Groups: leitura pública
ALTER TABLE option_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Option groups são públicos" ON option_groups FOR SELECT USING (active = true);

-- Options: leitura pública
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Options são públicas" ON options FOR SELECT USING (available = true);

-- Promotions: leitura pública
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Promoções ativas são públicas" ON promotions FOR SELECT USING (active = true);

-- Coupons: leitura pública (verificar validade na aplicação)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cupons ativos são públicos" ON coupons FOR SELECT USING (active = true);
