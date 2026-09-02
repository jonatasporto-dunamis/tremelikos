# Planejamento — Cardápio Digital Tremeliko's Burguer

> **Stack:** Next.js 14 + TypeScript + Tailwind + Supabase + WAHA (WhatsApp API)  
> **Deploy:** VPS via GitHub  
> **Data de início:** 31/08/2026  
> **Cardápio:** 39+ itens

---

## Contexto do Projeto

### Objetivo
Construir cardápio digital de alta conversão para a hamburgueria Tremeliko's Burguer em Jequié/BA. O projeto recebe tráfego de Meta Ads e Google Ads, e os pedidos são finalizados via WhatsApp usando a API WAHA.

### Stack Técnica
- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript
- **Estilo:** Tailwind CSS + shadcn/ui
- **Banco:** PostgreSQL (Supabase)
- **Autenticação:** Supabase Auth
- **Storage:** Supabase Storage (fotos)
- **WhatsApp:** WAHA API (webhook)
- **Deploy:** VPS (Ubuntu/Nginx) via GitHub
- **Domínio:** A definir

### Cores da Marca
| Nome | Hex | Uso |
|------|-----|-----|
| Primária | `#F47500` | Botões, destaques |
| Hover | `#FF930A` | Interações |
| Ativa | `#CC5902` | Estados ativos |
| Texto | `#CC5902` | Texto principal |
| Contraste | `#461B04` | Textos escuros |
| Suave | `#FFF3D3` | Backgrounds |

### Dados do Negócio
- **Nome:** Tremeliko's Burguer
- **Endereço:** Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA
- **WhatsApp:** (73) 99154-2371
- **Horário:** Terça a Sábado, 18h30 às 23h
- **Pedido mínimo:** R$ 15,00
- **Pagamentos:** Pix e cartão

---

## Fase 0: Setup e Infraestrutura

- [ ] **0.1** Criar repositório GitHub (público ou privado)
- [ ] **0.2** Inicializar projeto Next.js 14 com TypeScript
- [ ] **0.3** Configurar Tailwind CSS
- [ ] **0.4** Configurar ESLint + Prettier
- [ ] **0.5** Criar estrutura de pastas do projeto
- [ ] **0.6** Configurar variáveis de ambiente (.env.local)
- [ ] **0.7** Criar conta no Supabase e configurar projeto
- [ ] **0.8** Configurar Supabase Auth (sem cadastro público)
- [ ] **0.9** Configurar Supabase Storage (bucket público para fotos)
- [ ] **0.10** Configurar WAHA API (conta + sessão WhatsApp)
- [ ] **0.11** Testar conexão WAHA → envio de mensagem

---

## Fase 1: Banco de Dados

- [x] **1.1** Criar migration: tabela `stores`
- [x] **1.2** Criar migration: tabela `business_hours`
- [x] **1.3** Criar migration: tabela `store_overrides`
- [x] **1.4** Criar migration: tabela `sections`
- [x] **1.5** Criar migration: tabela `products`
- [x] **1.6** Criar migration: tabela `section_products`
- [x] **1.7** Criar migration: tabela `product_images`
- [x] **1.8** Criar migration: tabela `option_groups`
- [x] **1.9** Criar migration: tabela `options`
- [x] **1.10** Criar migration: tabela `product_option_groups`
- [x] **1.11** Criar migration: tabela `promotions`
- [x] **1.12** Criar migration: tabela `promotion_products`
- [x] **1.13** Criar migration: tabela `promotion_sections`
- [x] **1.14** Criar migration: tabela `coupons`
- [x] **1.15** Criar migration: tabela `admin_profiles`
- [x] **1.16** Criar migration: tabela `audit_logs`
- [x] **1.17** Habilitar RLS em todas as tabelas
- [x] **1.18** Criar políticas RLS (leitura pública, escrita admin)
- [x] **1.19** Criar seed: dados da loja (store + business_hours)
- [x] **1.20** Criar seed: seções do cardápio
- [x] **1.21** Criar seed: 39+ produtos com descrições
- [x] **1.22** Criar seed: grupos de opções e adicionais
- [x] **1.23** Testar seed completo

---

## Fase 2: Estrutura Base do Frontend

- [x] **2.1** Criar layout principal (root layout)
- [x] **2.2** Criar layout da loja (storefront)
- [x] **2.3** Criar layout administrativo (admin)
- [x] **2.4** Criar componentes UI base (Button, Input, Badge, Card)
- [x] **2.5** Criar componente Header (logo, status, horário)
- [x] **2.6** Criar componente Hero (foto, posicionamento, oferta)
- [x] **2.7** Criar componente Footer (info da loja, endereço)
- [x] **2.8** Criar componente CategoryNav (navegação horizontal fixa)
- [x] **2.9** Criar componente ProductCard (foto, nome, preço, botão)
- [x] **2.10** Criar componente ProductModal (detalhes, adicionais)
- [x] **2.11** Criar componente CartBar (barra fixa inferior)
- [x] **2.12** Criar componente SearchBar
- [x] **2.13** Criar componente PromoBanner
- [x] **2.14** Criar componente StoreStatus (aberto/fechado)
- [x] **2.15** Criar componente LoadingSkeleton

---

## Fase 3: Páginas Públicas

- [x] **3.1** Criar página inicial (/) — cardápio completo
- [x] **3.2** Implementar busca de produtos
- [x] **3.3** Implementar filtro por categoria
- [x] **3.4** Implementar scroll suave para categorias
- [x] **3.5** Criar página de produto (/produto/[slug])
- [x] **3.6** Criar página de política de privacidade
- [x] **3.7** Criar página /combos (campanha)
- [x] **3.8** Criar sitemap.xml dinâmico
- [x] **3.9** Criar robots.txt
- [x] **3.10** Criar manifest.webmanifest
- [x] **3.11** Configurar metadata e Open Graph
- [x] **3.12** Configurar JSON-LD (Restaurant)

---

## Fase 4: Carrinho e Estado

- [x] **4.1** Criar Context do carrinho (CartContext)
- [x] **4.2** Implementar useReducer para estado do carrinho
- [x] **4.3** Implementar persistência em localStorage
- [x] **4.4** Implementar adicionar item ao carrinho
- [x] **4.5** Implementar remover item do carrinho
- [x] **4.6** Implementar alterar quantidade
- [x] **4.7** Implementar adicionais/extras
- [x] **4.8** Implementar remoção de ingredientes
- [x] **4.9** Implementar campo de observações
- [x] **4.10** Calcular subtotal em tempo real
- [x] **4.11** Validar pedido mínimo
- [x] **4.12** Implementar sugestão de bebida/batata (upsell)

---

## Fase 5: Integração WhatsApp (WAHA)

- [ ] **5.1** Criar lib WAHA (cliente API)
- [ ] **5.2** Criar função de formatar mensagem do pedido
- [ ] **5.3** Implementar envio de mensagem via WAHA
- [ ] **5.4** Criar endpoint /api/whatsapp/send
- [ ] **5.5** Implementar webhook receiver (confirmação)
- [ ] **5.6** Implementar código curto do carrinho
- [ ] **5.7** Testar fluxo completo: carrinho → WhatsApp
- [ ] **5.8** Implementar mensagem de loja fechada
- [ ] **5.9** Implementar mensagem de pedido futuro (agendamento)

---

## Fase 6: Promoções e Cupons

- [x] **6.1** Criar função de cálculo de promoções
- [x] **6.2** Implementar preço promocional do produto
- [x] **6.3** Implementar desconto percentual
- [x] **6.4** Implementar desconto fixo
- [x] **6.5** Implementar cupom simples
- [x] **6.6** Validar regras de promoção (período, dias da semana)
- [x] **6.7** Implementar prioridade de promoções
- [x] **6.8** Garantir que promoções não acumulam
- [x] **6.9** Mostrar economia no card do produto
- [x] **6.10** Registrar promoção aplicada no carrinho

---

## Fase 7: Painel Administrativo

- [x] **7.1** Criar página de login (/admin/login)
- [x] **7.2** Implementar autenticação Supabase
- [x] **7.3** Criar middleware de proteção de rotas /admin
- [x] **7.4** Criar dashboard simples
- [x] **7.5** CRUD de produtos (listar, criar, editar, excluir)
- [ ] **7.6** Upload de fotos (com preview e crop) — *pendente; campos de URL existentes*
- [x] **7.7** Ativar/desativar produto
- [x] **7.8** CRUD de seções (com reordenação)
- [x] **7.9** Associar produto a múltiplas seções
- [x] **7.10** CRUD de grupos de opções e adicionais
- [x] **7.11** CRUD de promoções (com agendamento)
- [x] **7.12** CRUD de cupons
- [x] **7.13** Configurações de horários
- [x] **7.14** Configurações da loja (WhatsApp, mínimo, endereço)
- [x] **7.15** Pré-visualização do cardápio — *via rota pública `/` em iframe*
- [x] **7.16** Histórico de alterações (audit_logs)

---

## Fase 8: Analytics e Tracking

- [x] **8.1** Instalar Google Tag Manager
- [x] **8.2** Configurar Google Analytics 4
- [x] **8.3** Configurar Meta Pixel
- [x] **8.4** Criar módulo de eventos (features/analytics)
- [x] **8.5** Implementar evento view_menu
- [x] **8.6** Implementar evento view_item
- [x] **8.7** Implementar evento add_to_cart
- [x] **8.8** Implementar evento remove_from_cart
- [x] **8.9** Implementar evento begin_checkout
- [x] **8.10** Implementar evento whatsapp_order (Lead)
- [x] **8.11** Preservar UTMs e click IDs (gclid/fbclid/msclkid/ttclid)
- [x] **8.12** Implementar Consent Mode v2 (LGPD)
- [x] **8.13** Banner de cookies com preferências (essencial/analytics/marketing)
- [x] **8.14** Endpoint server-side `/api/analytics/events` → Meta CAPI + GA4 Measurement Protocol

**Eventos extras recomendados pelo mercado** (também implementados):
- [x] **8.15** `view_item_list` (GA4) — quando uma seção fica visível (IntersectionObserver)
- [x] **8.16** `select_item` (GA4) — clique no card para abrir modal
- [x] **8.17** `view_promotion` / `select_promotion` (GA4/Meta) — banner de promoções
- [x] **8.18** `add_payment_info` (GA4) — tipo de pagamento (whatsapp/PIX)
- [x] **8.19** `add_shipping_info` (GA4) — tipo de entrega (delivery/pickup)
- [x] **8.20** `purchase` (GA4) / `Purchase` (Meta) — conversão final com `transaction_id` e deduplicação via `event_id`
- [x] **8.21** `coupon_apply` / `coupon_remove` (custom) — atribuição de cupom
- [x] **8.22** `search` (GA4) — busca no cardápio (com debounce)
- [x] **8.23** `Lead` (Meta) — sincronizado com whatsapp_order para otimização de campanhas
- [x] **8.24** `User-ID` anônimo persistente (session + user_id) + `client_id` para GA4 join
- [x] **8.25** SHA-256 de email/telefone no CAPI para Enhanced Conversions
- [x] **8.26** Tabela `analytics_events` (Supabase) para auditoria de conversões

**Env vars (server-side, opcionais mas recomendados):**
```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_PIXEL_ID=123456789012345        # server
META_CAPI_TOKEN=EAAB...              # token de acesso Meta
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=...                   # secret do Measurement Protocol
```

---

## Fase 9: Performance e SEO

- [ ] **9.1** Configurar ISR para catálogo
- [ ] **9.2** Implementar revalidação sob demanda
- [ ] **9.3** Otimizar imagens (WebP, tamanhos, lazy loading)
- [ ] **9.4** Configurar cache headers
- [ ] **9.5** Implementar loading states (skeleton)
- [ ] **9.6** Testar Core Web Vitals (Lighthouse)
- [ ] **9.7** Garantir responsividade (320px+)
- [ ] **9.8** Testar contraste WCAG AA
- [ ] **9.9** Testar em dispositivos reais (iOS Safari, Android Chrome)

---

## Fase 10: Testes

- [ ] **10.1** Configurar Vitest
- [ ] **10.2** Testes unitários: formatação de dinheiro
- [ ] **10.3** Testes unitários: cálculo de promoções
- [ ] **10.4** Testes unitários: cupom e pedido mínimo
- [ ] **10.5** Testes unitários: subtotal do carrinho
- [ ] **10.6** Testes unitários: horário aberto/fechado
- [ ] **10.7** Testes unitários: mensagem WhatsApp
- [ ] **10.8** Configurar Playwright
- [ ] **10.9** Teste E2E: fluxo completo de pedido
- [ ] **10.10** Teste E2E: busca e filtro
- [ ] **10.11** Teste E2E: cupom válido/inválido
- [ ] **10.12** Teste E2E: loja fechada
- [ ] **10.13** Teste E2E: CRUD admin
- [ ] **10.14** Testes de RLS (permissões)

---

## Fase 11: Deploy e Produção

- [ ] **11.1** Criar Dockerfile (se necessário)
- [ ] **11.2** Configurar GitHub Actions (CI/CD)
- [ ] **11.3** Preparar script de deploy para VPS
- [ ] **11.4** Configurar Nginx (proxy reverso)
- [ ] **11.5** Configurar SSL (Let's Encrypt)
- [ ] **11.6** Configurar PM2 (process manager)
- [ ] **11.7** Configurar variáveis de ambiente de produção
- [ ] **11.8** Configurar domínio e DNS
- [ ] **11.9** Configurar backups do banco
- [ ] **11.10** Configurar monitoramento (uptime, logs)
- [ ] **11.11** Testar deploy completo
- [ ] **11.12** Configurar alertas de gastos

---

## Fase 12: Conteúdo e Lançamento

- [ ] **12.1** Padronizar nomes e descrições dos produtos
- [ ] **12.2** Produzir fotos dos 10+ vendidos
- [ ] **12.3** Produzir fotos dos combos
- [ ] **12.4** Criar copy de posicionamento
- [ ] **12.5** Definir combos de lançamento
- [ ] **12.6** Definir promoção de estreia
- [ ] **12.7** Configurar campanhas Meta Ads
- [ ] **12.8** Configurar campanhas Google Ads
- [ ] **12.9** Testar fluxo completo com pedido real
- [ ] **12.10** Treinar atendimento (mensagem WhatsApp)
- [ ] **12.11** Lançamento oficial

---

## Arquivos de Contexto para IA

### Estrutura de Pastas
```
tremelikos-cardapio/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx
│   │   ├── produto/[slug]/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── produtos/page.tsx
│   │   ├── secoes/page.tsx
│   │   ├── promocoes/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── whatsapp/
│   │   │   ├── send/route.ts
│   │   │   └── webhook/route.ts
│   │   └── revalidate/route.ts
│   ├── layout.tsx
│   └── robots.ts
├── components/
│   ├── ui/
│   ├── storefront/
│   └── admin/
├── features/
│   ├── catalog/
│   ├── cart/
│   ├── promotions/
│   ├── store-status/
│   ├── analytics/
│   └── whatsapp/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── waha.ts
│   ├── money.ts
│   └── env.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── types/
│   └── database.ts
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Variáveis de Ambiente Necessárias
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# WAHA API
WAHA_API_URL=https://waha.seuservidor.com
WAHA_API_KEY=sua_chave_api
WAHA_SESSION_NAME=tremelikos

# Loja
NEXT_PUBLIC_STORE_NAME=Tremeliko's Burguer
NEXT_PUBLIC_STORE_PHONE=5573991542371
NEXT_PUBLIC_MINIMUM_ORDER=15.00

# Analytics (opcional no início)
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789
GTM_ID=GTM-XXXXXXX
```

### Comandos Úteis
```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e

# Lint
npm run lint

# Supabase
npx supabase gen types typescript --local > types/database.ts
npx supabase db push
npx supabase seed
```

---

## Notas Importantes

1. **WAHA API:** Usar webhook para receber confirmações. O envio é via POST para `/api/sendMessage`.

2. **VPS Deploy:** Usar PM2 para manter o Next.js rodando. Nginx como proxy reverso na porta 443 com SSL.

3. **Imagens:** Prioridade máxima — sem fotos reais, conversão cai drasticamente.

4. **LGPD:** Banner de cookies obrigatório. Política de privacidade publicada.

5. **Performance:** Meta LCP < 2,5s. Testar com Lighthouse antes do lançamento.

6. **WhatsApp:** Mensagem deve incluir código curto do carrinho para facilitar atendimento.

---

*Documento criado para planejamento e execução do projeto Tremeliko's Burguer Digital.*
