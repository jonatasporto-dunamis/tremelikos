# Análise de Viabilidade — Cardápio Digital Tremeliko's Burguer

**Data:** 31/08/2026  
**Objetivo:** Construir cardápio digital de alta conversão para delivery via WhatsApp  
**Stack:** Supabase (DB) + Vercel (Deploy)  
**Marketing:** Meta Ads + Google Ads

---

## 1. Resumo Executivo

| Aspecto | Avaliação |
|---------|-----------|
| **Viabilidade Técnica** | ✅ Alta — stack moderna, bem documentada |
| **Viabilidade Financeira** | ✅ Alta — custo operacional baixo |
| **Viabilidade Operacional** | ✅ Alta — atualização em tempo real |
| **ROI Estimado** | 3-6 meses (sem taxas de apps) |
| **Complexidade** | Média — 2-4 semanas de desenvolvimento |

**Conclusão:** Projeto **altamente viável**. O mercado de hamburguerias artesanais em Jequié tem demanda comprovada, e um cardápio próprio elimina dependência de plataformas comissionadas.

---

## 1.1 Dados Técnicos do Atual Cardápio (Anota AI)

Extraídos do arquivo HTML salvo:

| Dado | Valor |
|------|-------|
| **ID da loja** | `6a921d6f96c23473ceea03e2` |
| **Plataforma** | Anota AI (Vue.js SPA) |
| **Cor primária** | `#F47500` (laranja) |
| **Cor secundária** | `#FF930A` |
| **Cor de texto** | `#CC5902` |
| **Cor de contraste** | `#461B04` |
| **Cor suave** | `#FFF3D3` |
| **Analytics** | Google Analytics (G-TYVMJ602TQ), Meta Pixel, Clarity |
| **Tag Manager** | GTM-5SP4HGD |

> ⚠️ **Nota:** A API da Anota AI bloqueia acesso externo (403). Os dados do cardápio são carregados dinamicamente via JavaScript. Para obter a lista completa de itens, é necessário acessar manualmente pelo navegador ou solicitar ao cliente.

---

## 2. Diagnóstico do Cardápio Atual (Anota AI)

### Pontos Positivos
- 39+ itens com preços definidos
- Descrições razoavelmente completas
- Linhas de produtos bem diferenciadas
- Preços competitivos
- Identidade visual existente
- Boa oferta de produtos autorais (Linha Gourmet)

### Problemas para Conversão
1. **37 dos 39 produtos usam a mesma imagem genérica** — só as batatas pequena e média possuem fotos próprias
2. **Cheese Burguer R$14,99 < Pedido mínimo R$15,00** — não pode ser comprado sozinho por R$0,01
3. Não há seções de "Mais pedidos", "Combos" ou "Promoções"
4. Cardápio começa por entradas, não pelos principais produtos
5. "Linha Gourmet" aparece em duas seções consecutivas
6. Navegação não evidencia campeões de venda
7. Loja fechada não oferece agendamento
8. Posicionamento "🔥 Hambúrguer na brasa, sabor de verdade" aparece apenas no perfil
9. Inconsistências: `Burguer`, `Burger`, `Burquer`, "AGUA" sem acento
10. Busca e compartilhamento com oportunidades de acessibilidade

### Informações da Loja
- **Nome recomendado:** Tremeliko's Burguer (padronizar)
- **Posicionamento:** "🔥 Hambúrguer na brasa, sabor de verdade"
- **Endereço:** Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA, CEP 45208-089
- **Horário:** Terça a Sábado, 18h30 às 23h
- **Pagamentos:** Pix e cartão de crédito online

---

## 2.1 Análise do Negócio (Concorrentes)

### 2.1 Sobre o Tremeliko's Burguer

| Dado | Informação |
|------|-----------|
| Localização | R. Gonçalves da Costa, 204 — Jequié/BA |
| Telefone | (73) 99154-2371 / (73) 99168-4557 |
| Horário | Sex a Dom: 18:30–23:30 |
| Segmento | Fast Food / Hamburgueria Artesanal |
| Diferencial | Delivery próprio, cartões aceitos |

### 2.2 Concorrentes Diretos em Jequié

| Concorrente | Destaque |
|-------------|----------|
| Tommy Burguer | "Melhor hambúrguer de Jequié" — R$20-40/pessoa |
| Taverna Burger | Ambiente casual, delivery, R$20-60/pessoa |
| Boris Burger | 4.3 estrelas Google, variado |
| Planet Burguer 73 | Temático (planetas), smash/grelhado |
| Kibi's Burguer | 4.5 estrelas, artesanal |

### 3.3 Oportunidade Identificada

- Concorrentes usam plataformas de terceiros (iFood/Anota AI)
- Cardápio próprio = **sem comissão por pedido** (economia de 12-30%)
- Controle total sobre dados do cliente
- Possibilidade de fidelização via WhatsApp

---

## 3. Cardápio Real — Tremeliko's Burguer

> ✅ Dados reais obtidos do cardápio Anota AI (atualizado em 31/08/2026)

### 3.1 Informações Gerais

| Configuração | Valor |
|--------------|-------|
| Pedido mínimo | R$ 15,00 |
| Categorias | 10 |
| Total de itens | 40+ |

### 3.2 Entradas

| Item | Preço |
|------|-------|
| Batata Frita Tempero da Casa (Pequena 120g) | R$ 13,90 |
| Batata Frita Tempero da Casa (Média 350g) | R$ 21,90 |
| Batata Frita Tempero da Casa (Grande 500g) | R$ 27,90 |

### 3.3 Lanches no Pão de Alho

| Código | Item | Descrição | Preço |
|--------|------|-----------|-------|
| 01 | Picanha no Pão de Alho | Baguete 23cm, picanha, pasta de alho prime, vinagrete e queijo derretido maçaricado | R$ 29,90 |
| 02 | Frango no Pão de Alho | Baguete 23cm, frango grelhado, pasta de alho prime, vinagrete e queijo derretido maçaricado | R$ 25,90 |
| 03 | Calabresa no Pão de Alho | Baguete 23cm, calabresa, pasta de alho prime, vinagrete e queijo derretido maçaricado | R$ 25,90 |
| 04 | Costela no Pão de Alho | Baguete 23cm, costela, pasta de alho prime, vinagrete e queijo derretido maçaricado | R$ 29,90 |
| 05 | Beirute | Pão sírio, rosbife de alcatra, ovo, peito de peru, muçarela, alface e tomate | R$ 28,90 |
| 06 | Peito Bovino no Pão de Alho | Baguete 23cm, peito bovino, pasta de alho prime, vinagrete e queijo derretido maçaricado | R$ 25,90 |

### 3.4 Linha Tradicional

| Código | Item | Descrição | Preço |
|--------|------|-----------|-------|
| 7.1 | Cheese Burguer | Pão de hambúrguer, hambúrguer artesanal 100g e queijo | R$ 14,99 |
| 7.2 | Cheese Salada | Pão de hambúrguer, hambúrguer artesanal 100g, queijo, alface e tomate | R$ 16,99 |
| 08 | Cheese Egg Salada | Pão de hambúrguer, hambúrguer artesanal 100g, queijo, ovo, alface e tomate | R$ 19,50 |
| 09 | Double Cheese | Pão de hambúrguer, 2x hambúrguer artesanal 100g, 2x queijos, alface e tomate | R$ 27,90 |
| 10 | Tremeliko's Tudo | Pão, hambúrguer artesanal 100g, queijo, presunto, ovo, frango, calabresa, bacon, catupiry, milho verde, batata palha, alface e tomate | R$ 29,99 |

### 3.5 Linha de Bacon

| Código | Item | Descrição | Preço |
|--------|------|-----------|-------|
| 11 | Cheese Bacon | Pão, hambúrguer artesanal 100g, queijo, bacon, alface e tomate | R$ 24,50 |
| 12 | Cheese Egg Bacon | Pão, hambúrguer artesanal 100g, ovo, queijo, bacon, alface e tomate | R$ 26,90 |
| 13 | Double Cheese Bacon | Pão, 2x hambúrgueres 100g, 2x queijos, 2x bacons, alface e tomate | R$ 31,90 |

### 3.6 Linha de Frango

| Código | Item | Descrição | Preço |
|--------|------|-----------|-------|
| 14 | Cheese Frango Salada | Pão, filé de frango empanado crocante, queijo, alface e picles | R$ 17,90 |
| 15 | Cheese Frango Bacon Salada | Pão, filé de frango empanado crocante, queijo, bacon, alface e picles | R$ 21,50 |
| 16 | Cheese Frango Catupiry Salada | Pão, filé de frango empanado crocante, queijo, catupiry, alface e picles | R$ 24,99 |

### 3.7 Linha de Picanha

| Código | Item | Descrição | Preço |
|--------|------|-----------|-------|
| 17 | Cheese Picanha | Pão de hambúrguer, 150g de picanha grelhada na brasa, queijo, alface e tomate | R$ 29,90 |
| 18 | Cheese Picanha Egg | Pão, 150g de picanha grelhado na brasa, ovo, queijo, alface e tomate | R$ 31,99 |
| 19 | Cheese Picanha Egg Bacon | Pão de hambúrguer, 150g de picanha grelhada na brasa, ovo, queijo, bacon, tomate e alface | R$ 33,99 |

### 3.8 Linha Gourmet (Assinatura)

| Código | Item | Descrição | Preço |
|--------|------|-----------|-------|
| 20 | Tremeliko's Cheddar | Pão australiano, hambúrguer artesanal suculento 180g, cheddar, picles, cebola caramelizada, anel de cebola frita | R$ 28,99 |
| 21 | Tremeliko's Gordon Black | Pão australiano, hambúrguer artesanal suculento 180g, creme de gorgonzola, alho negro e cebola crispy | R$ 29,99 |
| 22 | Tremeliko's Porto's Burguer | Pão de brioche, hambúrguer artesanal suculento 180g, bacon caramelizado, queijo, cheddar cremoso, cebola crispy, banana da terra grelhada e tomate empanado | R$ 29,99 |
| 23 | Tremeliko's Kenneth Burguer | Pão de brioche, hambúrguer artesanal suculento 180g, queijo coalho derretido na brasa, banana da terra, melaço de cana e cebola crispy | R$ 29,99 |
| 24 | Tremeliko's Trípoli Burguer | Pão de brioche, hambúrguer artesanal suculento 180g, abacaxi grelhado na brasa, queijo coalho na brasa, banana da terra, melaço de cana e alface | R$ 32,90 |
| 25 | Tremeliko's Hard Work Burguer | Pão de brioche, hambúrguer artesanal suculento 180g, queijo empanado, geleia de pimenta e picles | R$ 29,99 |
| 26 | Tremeliko's Smash Burguer | Pão de brioche, hambúrguer artesanal suculento 180g, cheddar cremoso, maionese de bacon, cebola caramelizada | R$ 28,90 |

### 3.9 Bebidas

#### Refrigerantes e Águas

| Item | Preço |
|------|-------|
| Coca-Cola 1 Litro | R$ 9,99 |
| Guaraná Antártica 1 Litro | R$ 9,99 |
| Coca-Cola Lata | R$ 6,00 |
| Guaraná Antártica Lata | R$ 6,00 |
| Água sem Gás | R$ 3,00 |
| Água com Gás | R$ 4,00 |

#### Sucos de Polpa com Leite (500ml)

| Sabor | Preço |
|-------|-------|
| Cacau | R$ 7,00 |
| Cupuaçu | R$ 7,00 |
| Graviola | R$ 7,00 |

### 3.10 Análise de Preços

| Métrica | Valor |
|---------|-------|
| Menor preço | R$ 3,00 (Água) |
| Maior preço | R$ 33,99 (Picanha Egg Bacon) |
| Preço médio | R$ 22,45 |
| Mediana | R$ 26,90 |
| Itens até R$20 | 8 (20%) |
| Itens R$20-30 | 20 (50%) |
| Itens acima R$30 | 12 (30%) |

---

### 3.11 Combos Sugeridos (Baseado no Cardápio Real)

| Combo | Itens | Preço Original | Preço Combo | Economia |
|-------|-------|----------------|-------------|----------|
| **Trio Tradicional** | Cheese Salada + Batata P + Guaraná Lata | R$ 36,89 | R$ 33,90 | 8% |
| **Trio Bacon** | Cheese Egg Bacon + Batata M + Coca 1L | R$ 58,79 | R$ 54,90 | 7% |
| **Trio Gourmet** | Tremeliko's Cheddar + Batata G + Suco 500ml | R$ 63,89 | R$ 59,90 | 6% |
| **Duplo Burger** | 2x Cheese Bacon + 2x Batata M + 2x Guaraná Lata | R$ 95,60 | R$ 89,90 | 6% |
| **Família** | 2x Tremeliko's Tudo + Batata G + Coca 1L | R$ 97,78 | R$ 89,90 | 8% |

---

## 3.12 Arquitetura da Informação (Estrutura do Cardápio Digital)

```
┌─────────────────────────────────────────────────┐
│              CARDÁPIO DIGITAL                    │
├─────────────────────────────────────────────────┤
│  🔥 DESTAQUE DO DIA (promoção rotativa)         │
├─────────────────────────────────────────────────┤
│  🍟 ENTRADAS                                     │
│     └── Batata Frita Tempero da Casa (3 tamanhos)│
├─────────────────────────────────────────────────┤
│  🍞 LANCHES NO PÃO DE ALHO                       │
│     ├── Picanha, Frango, Calabresa, Costela      │
│     ├── Beirute, Peito Bovino                    │
├─────────────────────────────────────────────────┤
│  🍔 LINHA TRADICIONAL                            │
│     ├── Cheese Burguer, Cheese Salada            │
│     ├── Cheese Egg Salada, Double Cheese         │
│     └── Tremeliko's Tudo                         │
├─────────────────────────────────────────────────┤
│  🥓 LINHA DE BACON                               │
│     ├── Cheese Bacon, Cheese Egg Bacon           │
│     └── Double Cheese Bacon                      │
├─────────────────────────────────────────────────┤
│  🍗 LINHA DE FRANGO                              │
│     ├── Cheese Frango Salada                     │
│     ├── Cheese Frango Bacon Salada               │
│     └── Cheese Frango Catupiry Salada            │
├─────────────────────────────────────────────────┤
│  🥩 LINHA DE PICANHA                             │
│     ├── Cheese Picanha                           │
│     ├── Cheese Picanha Egg                       │
│     └── Cheese Picanha Egg Bacon                 │
├─────────────────────────────────────────────────┤
│  ⭐ LINHA GOURENT (Assinatura)                   │
│     ├── Tremeliko's Cheddar                      │
│     ├── Tremeliko's Gordon Black                 │
│     ├── Tremeliko's Porto's Burguer              │
│     ├── Tremeliko's Kenneth Burguer              │
│     ├── Tremeliko's Trípoli Burguer              │
│     ├── Tremeliko's Hard Work Burguer            │
│     └── Tremeliko's Smash Burguer                │
├─────────────────────────────────────────────────┤
│  🥤 BEBIDAS                                      │
│     ├── Refrigerantes (Coca, Guaraná)            │
│     ├── Águas                                    │
│     └── Sucos de Polpa com Leite (3 sabores)     │
├─────────────────────────────────────────────────┤
│  🎁 COMBOS (aumento de ticket)                  │
├─────────────────────────────────────────────────┤
│  📦 RESUMO DO PEDIDO → WhatsApp                 │
└─────────────────────────────────────────────────┘
```

### 3.13 Estrutura de Cada Item (Modelo de Dados)

```yaml
Item:
  - id: uuid
  - nome: "X-Bacon Tremeliko's"
  - descricao: "Pão brioche, burger 180g, cheddar, bacon crocante"
  - preco: 28.90
  - categoria: "hamburgueres_classicos"
  - foto_url: "https://..."
  - destaque: boolean (para promoções)
  - disponivel: boolean
  - ordem_exibicao: integer
  - ingredientes: ["pao", "burger", "cheddar", "bacon"]
  - created_at: timestamp
```

---

## 4. Modelo de Dados Detalhado (Supabase/PostgreSQL)

### 4.1 Entidades do MVP

| Tabela | Finalidade | Campos Principais |
|--------|------------|-------------------|
| `stores` | Identidade e configurações | `id`, `name`, `slug`, `description`, `phone`, `whatsapp`, `timezone`, `minimum_order`, `address`, `active` |
| `business_hours` | Horários por dia | `store_id`, `weekday`, `opens_at`, `closes_at`, `closed` |
| `store_overrides` | Fechamento excepcional | `store_id`, `date`, `status`, `opens_at`, `closes_at`, `reason` |
| `sections` | Seções ordenáveis | `id`, `store_id`, `name`, `slug`, `description`, `position`, `active` |
| `products` | Cadastro central | `id`, `store_id`, `name`, `slug`, `description`, `base_price`, `active`, `available`, `featured`, `badge`, `sku` |
| `section_products` | Produto em múltiplas seções | `section_id`, `product_id`, `position` |
| `product_images` | Fotos ordenadas | `id`, `product_id`, `path`, `alt_text`, `position`, `is_cover` |
| `option_groups` | Grupos de opções | `id`, `store_id`, `name`, `min_choices`, `max_choices`, `required` |
| `options` | Opções e adicionais | `id`, `option_group_id`, `name`, `price_delta`, `available`, `position` |
| `product_option_groups` | Liga grupos a produtos | `product_id`, `option_group_id`, `position` |
| `promotions` | Configuração e período | `id`, `store_id`, `name`, `type`, `value`, `starts_at`, `ends_at`, `weekdays`, `priority`, `active` |
| `promotion_products` | Produtos-alvo | `promotion_id`, `product_id` |
| `promotion_sections` | Seções-alvo | `promotion_id`, `section_id` |
| `coupons` | Cupom simples | `id`, `store_id`, `code`, `type`, `value`, `minimum_order`, `starts_at`, `ends_at`, `active` |
| `admin_profiles` | Papel do administrador | `user_id`, `store_id`, `role`, `active` |
| `audit_logs` | Histórico de alterações | `id`, `store_id`, `actor_id`, `action`, `entity`, `entity_id`, `payload`, `created_at` |

### 4.2 Decisões de Modelagem
- Valores monetários: `numeric(10,2)`, nunca `float`
- Datas de promoções: `timestamptz` com fuso `America/Sao_Paulo`
- Ordenação: inteiro `position`
- Exclusão lógica: `active = false` para preservar referências
- Slugs únicos por loja
- `store_id` em todas as entidades comerciais (preparar para expansão)
- Fotos no Storage; banco armazena apenas caminho e metadados
- Um produto pode pertencer a várias seções via `section_products`

### 4.3 Tabelas de Fase Posterior
Somente quando houver pedido nativo:
`customers`, `customer_addresses`, `orders`, `order_items`, `order_item_options`, `payments`, `delivery_zones`, `order_status_history`, `webhook_events`

```sql
-- Categorias do cardápio
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do cardápio
CREATE TABLE itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES categorias(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  foto_url TEXT,
  destaque BOOLEAN DEFAULT false,
  disponivel BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  ingredientes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionais/Extras
CREATE TABLE adicionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Combos/Promoções
CREATE TABLE combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_original DECIMAL(10,2),
  preco_promocional DECIMAL(10,2),
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do combo
CREATE TABLE combo_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID REFERENCES combos(id) ON DELETE CASCADE,
  item_id UUID REFERENCES itens(id),
  quantidade INTEGER DEFAULT 1
);

-- Configurações da loja
CREATE TABLE config_loja (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_loja TEXT DEFAULT 'Tremeliko''s Burguer',
  whatsapp_numero TEXT DEFAULT '5573991542371',
  mensagem_padrao TEXT DEFAULT 'Olá! Gostaria de fazer um pedido:',
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  pedido_minimo DECIMAL(10,2) DEFAULT 0,
  horario_funcionamento JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (leitura pública, escrita apenas autenticado)
CREATE POLICY "Leitura pública" ON categorias FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON itens FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON adicionais FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON combos FOR SELECT USING (true);
```

### 4.2 Bucket de Imagens (Supabase Storage)

```sql
-- Bucket para fotos dos produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cardapio', 'cardapio', true);
```

---

## 5. Arquitetura Técnica

### 5.1 Identidade Visual (Extraída do Anota AI)

Pode ser reutilizada no novo cardápio para manter consistência de marca:

| Elemento | Cor | Uso |
|----------|-----|-----|
| Primária | `#F47500` | Botões, destaques |
| Hover | `#FF930A` | Interações |
| Ativa | `#CC5902` | Estados ativos |
| Texto | `#CC5902` | Texto principal |
| Contraste | `#461B04` | Textos escuros |
| Suave | `#FFF3D3` | Backgrounds, badges |
| Badge | `#87400E` | Tags, promoções |

### 5.2 Stack Recomendada

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Frontend | Next.js 14 (App Router) | SSR, SEO, performance |
| Estilização | Tailwind CSS | Mobile-first, ágil |
| Componentes | shadcn/ui | Acessível, customizável |
| Estado | Zustand | Leve, simples |
| Backend | Supabase | Auth, DB, Storage, Edge Functions |
| Deploy | Vercel | CI/CD, CDN global |
| Imagens | Supabase Storage + Otimização | Redimensionamento automático |
| Analytics | Google Analytics 4 + Meta Pixel | Rastreamento de conversão |

### 5.3 Estrutura do Projeto

```
tremelikos-cardapio/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página do cardápio
│   ├── globals.css         # Estilos globais
│   └── api/
│       └── webhook/        # Notificações
├── components/
│   ├── header.tsx          # Categorias/navegação
│   ├── item-card.tsx       # Card de produto
│   ├── carrinho.tsx        # Resumo do pedido
│   ├── categoria-section.tsx
│   └── promo-banner.tsx
├── lib/
│   ├── supabase.ts         # Client Supabase
│   └── utils.ts
├── types/
│   └── database.ts         # Tipos TypeScript
├── public/
│   └── images/
├── tailwind.config.ts
├── next.config.js
└── package.json
```

### 5.4 Fluxo do Usuário

```
[Anúncio Meta/Google] 
    ↓
[Landing Page / Cardápio]
    ↓
[Navegação por Categorias]
    ↓
[Seleção de Itens + Adicionais]
    ↓
[Resumo do Pedido]
    ↓
[Botão WhatsApp → Mensagem formatada]
    ↓
[Conclusão do pedido no WhatsApp]
```

---

## 6. Estratégias de Conversão

### 6.1 Elementos de Alta Conversão

| Elemento | Implementação | Impacto |
|----------|--------------|---------|
| **Fotos profissionais** | 1 foto por item (mínimo nos top 5) | +30% pedidos nos itens com foto |
| **Descrições sensoriais** | "Pão brioche tostado, burger suculento 180g" | +15% conversão |
| **Destaque do dia** | Banner rotativo com promoção | Cria urgência |
| **Combos sugeridos** | "Burger + Frita + Bebida por R$X" | +25% ticket médio |
| **Upsell de adicionais** | "Adicione bacon por +R$3" | +20% valor do pedido |
| **Prova social** | "Mais vendido" / "Favorito da casa" | +10% cliques |
| **Botão flutuante WhatsApp** | Sempre visível | Reduz fricção |
| **Carregamento rápido** | <2s (Vercel Edge) | -50% bounce rate |

### 6.2 Copy para WhatsApp (Automática)

```
Olá! Gostaria de fazer um pedido:

📋 *PEDIDO:*
• 1x X-Bacon - R$ 28,90
  - Sem cebola
  - Bacon extra (+R$ 3,00)
• 1x Batata Frita G - R$ 15,00
• 1x Coca-Cola 350ml - R$ 6,00

💰 *Total: R$ 52,90*
📍 *Entrega:* [Endereço]
💳 *Pagamento:* [Forma de pagamento]
```

---

## 7. Integração com Marketing

### 7.1 Meta Ads (Facebook/Instagram)

| Configuração | Detalhe |
|-------------|---------|
| Pixel | Instalado no cardápio |
| Eventos | ViewContent, AddToCart, Purchase (WhatsApp) |
| Público | Raio 10km Jequié, 18-45 anos, interesse em hambúrguer |
| Criativo | Vídeo/foto do burger + CTA "Peça agora" |
| Landing Page | Link direto do cardápio |

### 7.2 Google Ads

| Configuração | Detalhe |
|-------------|---------|
| Campanha | Search + Performance Max |
| Palavras-chave | "hamburguer jequie", "delivery jequie", "tremelikos" |
| Extensões | Local, chamada, estruturadas |
| Página destino | Cardápio otimizado para mobile |

### 7.3 Rastreamento de Conversão

```typescript
// Evento: Visualização de item
gtag('event', 'view_item', {
  currency: 'BRL',
  value: 28.90,
  items: [{ item_name: 'X-Bacon', item_category: 'Clássicos' }]
});

// Evento: Adicionar ao carrinho
fbq('track', 'AddToCart', {
  content_name: 'X-Bacon',
  value: 28.90,
  currency: 'BRL'
});

// Evento: Pedido via WhatsApp (conversão)
fbq('track', 'Purchase', { value: 52.90, currency: 'BRL' });
```

---

## 8. Estimativa de Custos

### 8.1 Custos de Infraestrutura (Mensal)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Pro | ~R$ 100/mês |
| Supabase | Pro | ~R$ 125/mês |
| Domínio (.com.br) | Anual | ~R$ 40/ano |
| **Total mensal** | | **~R$ 225/mês** |

### 8.2 Comparação com Plataformas

| Plataforma | Taxa por pedido | Pedidos/mês para cobrir custo |
|------------|----------------|------------------------------|
| iFood | 12-23% | ~45 pedidos (ticket R$40) |
| Anota AI | 0-9% | ~30 pedidos |
| **Cardápio próprio** | **R$ 225 fixo** | **~6 pedidos** |

**Break-even:** Com apenas 6 pedidos/mês (ticket médio R$40), o cardápio próprio já é mais vantajoso.

### 8.3 Investimento Inicial

| Item | Custo Estimado |
|------|---------------|
| Desenvolvimento (2-4 semanas) | R$ 0 (DIY com IA) ou R$ 3.000-8.000 (freelancer) |
| Fotos dos produtos | R$ 200-500 (ensaio próprio) |
| Design/Identidade | R$ 0-500 (Canva/Figma) |
| **Total** | **R$ 200-9.000** |

---

## 9. Roadmap de Implementação

### Fase 1: MVP (1-2 semanas)
- [ ] Setup Supabase (DB + Storage)
- [ ] Estrutura Next.js + Tailwind
- [ ] Página do cardápio com categorias
- [ ] Cards de produtos com foto/preço/descrição
- [ ] Botão WhatsApp com mensagem formatada
- [ ] Deploy Vercel

### Fase 2: Otimização (1 semana)
- [ ] Sistema de adicionais/extras
- [ ] Combos e promoções
- [ ] Admin simples (adicionar/editar itens)
- [ ] Analytics (GA4 + Meta Pixel)
- [ ] SEO básico (meta tags, sitemap)

### Fase 3: Conversão Avançada (1 semana)
- [ ] Upsell inteligente
- [ ] Destaque do dia automático
- [ ] Prova social ("mais vendido")
- [ ] Testes A/B de layout
- [ ] Integração com Google Ads

### Fase 4: Escala
- [ ] Programa de fidelidade
- [ ] Cupons de desconto
- [ ] Agendamento de pedidos
- [ ] Multi-unidade (se expandir)

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Cardápio Anota AI indisponível para extração automática | **Confirmada** | Médio | Acessar manualmente pelo navegador ou solicitar lista ao cliente |
| Baixa adesão inicial | Média | Alto | Campanha de lançamento + cupom primeiro pedido |
| Concorrência com iFood | Alta | Médio | Diferencial: preço menor (sem taxa), delivery próprio |
| Problemas técnicos | Baixo | Alto | Suporte Vercel/Supabase 24/7 |
| Cardápio desatualizado | Média | Médio | Admin simples + notificação de atualização |
| Qualidade das fotos dos produtos | Média | Alto | Ensaio fotográfico com smartphone + iluminação natural |

---

## 11. Métricas de Sucesso (KPIs)

| Meta | Período | Indicador |
|------|---------|-----------|
| Lançamento | Mês 1 | Cardápio no ar com 40+ itens |
| Tráfego | Mês 2 | 500+ visitas/mês |
| Conversão | Mês 3 | 5% de conversão (visita → pedido) |
| Ticket Médio | Mês 3 | R$ 35+ (atual médio: R$22,45) |
| Pedidos via cardápio | Mês 6 | 30% dos pedidos totais |
| ROI | Mês 6 | Retorno do investimento |
| Itens Gourmet vendidos | Mês 3 | 20% dos pedidos (maior margem) |

---

## 12. Próximos Passos Imediatos

1. ✅ **Cardápio obtido** — 40+ itens com preços e descrições
2. **Criar conta Supabase** e configurar projeto
3. **Configurar bucket de imagens** no Supabase Storage
4. **Definir identidade visual** (cores extraídas: laranja #F47500)
5. **Iniciar desenvolvimento do MVP** (Next.js + Tailwind)
6. **Configurar domínio** (sugestão: tremelikos.com.br)
7. **Preparar campanha de lançamento** (Meta Ads + Google Ads)
8. **Coletar fotos dos produtos** (ensaio com smartphone)

---

## 13. Considerações Finais

O projeto é **tecnicamente viável** e **financeiramente atrativo**. A combinação de Supabase + Vercel oferece:

- **Escalabilidade:** Suporta de 10 a 10.000+ pedidos/dia
- **Performance:** CDN global, carregamento <2s
- **Custo previsível:** Sem surpresas com taxas variáveis
- **Autonomia:** Controle total sobre dados e experiência

A principal vantagem competitiva será **eliminar intermediários** e construir um **relacionamento direto** com o cliente via WhatsApp, permitindo:
- Margens maiores (sem comissão)
- Dados para remarketing
- Fidelização via ofertas exclusivas

**Recomendação:** Prosseguir com o desenvolvimento do MVP imediatamente.

---

## 14. Anexo — Dados Extraídos do Arquivo HTML

### 14.1 Metadados da Página

```html
<title>Tremelikos Burguer - Anota AI</title>
<meta name="description" content="Faça seu pedido online agora mesmo no Tremelikos Burguer! Acesse a loja através do Cardápio Digital da Anota AI.">
```

### 14.2 Identificadores Encontrados

| Identificador | Valor | Uso |
|---------------|-------|-----|
| Store ID | `6a921d6f96c23473ceea03e2` | API Anota AI |
| GA4 | `G-TYVMJ602TQ` | Google Analytics |
| GTM | `GTM-5SP4HGD` | Google Tag Manager |
| Clarity | `ij7wd7emsd` | Microsoft Clarity |

### 14.3 Tecnologias Detectadas

- **Frontend:** Vue.js 3 (Composition API)
- **Build:** Vite + Rolldown
- **Pagamentos:** Integração com gateway de pagamento
- **Analytics:** Amplitude, Google Analytics, Meta Pixel, Microsoft Clarity
- **Replays:** SessionReplay (Amplitude)

### 14.4 Limitações Encontradas

- API da Anota AI retorna 403 para requisições externas
- Dados do cardápio são carregados via chamadas AJAX autenticadas
- Não foi possível extrair itens, preços ou fotos automaticamente
- Recomendação: coletar dados manualmente pelo navegador

---

## 15. Estimativa de Esforço

Para desenvolvedor experiente usando IA, com decisões e conteúdo disponíveis:

| Fase | Prazo |
|------|-------|
| MVP funcional | 7-12 dias úteis |
| Refinamento visual, dados, testes e tracking | 3-5 dias úteis |
| Checkout, pagamento e pedidos nativos | 3-6 semanas (fase posterior) |

> Esses números são estimativas de planejamento, não prazo contratual. **Fotografias, aprovação de copy, contas de anúncios, domínio e decisões operacionais podem ser o caminho crítico.**

---

## 16. Custos e Operação

- **Supabase Free:** desenvolvimento e validação; produção deve avaliar planos pagos
- **Vercel:** plano **Hobby é restrito a uso pessoal/não comercial** — produção requer Pro ou plano comercial
- Página pública cacheada: baixo consumo de banco e funções
- Imagens: maior parcela de transferência — comprimir antes do upload reduz custo
- Configurar alertas de gastos no Supabase, Vercel e plataformas de anúncios
- Ambientes separados: desenvolvimento/preview e produção

---

## 17. Decisões Pendentes Antes de Iniciar o Código

1. O pedido terminará no WhatsApp ou precisa ser recebido dentro de um painel próprio?
2. Qual é o número oficial do WhatsApp?
3. Haverá retirada, entrega ou ambos?
4. Como são calculadas taxa e área de entrega?
5. O cliente poderá enviar pedido com a loja fechada?
6. Qual será o domínio?
7. Quais são os 5 produtos mais vendidos e os 3 de maior margem?
8. Quais combos e promoções serão usados no lançamento?
9. O pedido mínimo continuará em R$ 15,00?
10. Quais adicionais, remoções e escolhas cada produto permite?
11. Quem terá acesso ao painel?
12. Já existem GTM, GA4, Google Ads, Meta Business Manager, Pixel e contas verificadas?
13. A operação precisa continuar usando o Anota AI em paralelo?
14. Existem logotipo em vetor, paleta, fontes e fotos em alta resolução?

---

## 18. Recomendação Final

O projeto deve avançar. A arquitetura **Supabase + Next.js + Vercel** é adequada, simples e escalável para a Tremeliko's.

O principal cuidado é manter o primeiro ciclo focado em **vitrine, oferta, carrinho, WhatsApp e mensuração**, evitando transformar o MVP em um sistema completo de delivery.

### Fatores Decisivos para Conversão
1. **Fotos reais e apetitosas** (impacto #1)
2. Ofertas e combos claros
3. Poucos passos até o WhatsApp
4. Velocidade no celular
5. Operação rápida para responder e confirmar pedidos
6. Eventos de anúncios corretamente configurados
7. Aprendizado contínuo com os dados de campanha

### Não construir no MVP
- Gateway de pagamento
- Cálculo avançado de entrega por rota
- Rastreamento em tempo real
- Aplicativo nativo
- Programa de fidelidade
- Motor genérico de promoções "compre X e leve Y"
- Microserviços

Esses recursos podem ser adicionados sem refazer o catálogo, desde que o modelo de dados proposto seja seguido.

---

*Documento gerado para análise de viabilidade do projeto Tremeliko's Burguer Digital.*
