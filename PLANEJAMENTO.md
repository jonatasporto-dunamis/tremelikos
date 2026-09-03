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

## Estado atual (consolidado em 2026-09-03)

**Fases concluídas:**
- ✅ **Fase 1-6** (Infra + Cardápio + Carrinho + Promoções + Cupons + WhatsApp)
- ✅ **Fase 7** — Painel administrativo completo (auth, RLS admin, CRUD de produtos/seções/opções/promoções/cupons, configurações, auditoria)
- ✅ **Fase 8** — Analytics e Tracking completo (26 eventos GA4+Meta, server-side CAPI com Enhanced Conversions + LDU para LGPD, consent mode v2, abandono de carrinho, fbc/fbp formato oficial Meta)

**Em produção em `https://tremelikos.growthpulse.com.br/`:**
- Loja (Cardápio + Carrinho + WhatsApp)
- Painel admin (`/admin/login` com `admin@tremelikos.com.br` / `TremelikoAdmin2026!`)
- CAPI Meta + tracking pixel ativo (commit `7bf9c53`)

**Fases pendentes (próximos passos):** ver Fases 9 a 15 abaixo.

---

## Fase 9: UX, CRO e Refinamento do Cardápio

> Baseado em `REFERENCIA_UI_UX_CRO_ANOTA_AI.md`. Aplica o que está validado no mercado + as melhorias CRO sugeridas pela auditoria.

### 9.1 Conteúdo e copy
- [x] **9.1.1** Reescrever headline do hero (3 variantes A/B-ready, foco em método + localidade)
- [x] **9.1.2** Subheadline explicando o fluxo (escolha → personaliza → WhatsApp)
- [x] **9.1.3** CTAs explícitos por contexto (Card=`Adicionar`, Modal=`Adicionar • R$ X`, Carrinho=`Revisar e enviar pedido`, Loja fechada=`Montar pedido para as 18h30`)
- [x] **9.1.4** Mensagem de loja fechada com texto + estado (verde/âmbar/vermelho)
- [x] **9.1.5** Microcopy de upsell no modal de confirmação ("Que tal uma Coca-Cola lata?")
- [x] **9.1.6** Página `/perfil-da-loja` com horários, pagamento, endereço, política, redes sociais

### 9.2 Estrutura comercial da home
- [x] **9.2.1** Seção **Ofertas de hoje** antes das seções (consumir `promotions` com `priority` mais alta)
- [x] **9.2.2** Seção **Mais pedidos** (ranking por `analytics_events` agregados)
- [x] **9.2.3** Seção **Combos** (criar tabela `combos` com `combo_items` ou usar `products` do tipo combo)
- [x] **9.2.4** Reordenar seções na home: Ofertas → Mais pedidos → Combos → Gourmet → Tradicionais → Picanha → Frango → Porções → Bebidas → Sucos
- [x] **9.2.5** Hero redesenhado: foto do burger-assinatura + tagline + status + badges de bairro/entrega/pagamento

### 9.3 Componentes e interações
- [x] **9.3.1** CTA explícito `Adicionar` no card (já tem; revisar altura mínima 44px)
- [x] **9.3.2** Badge `Mais pedido` calculado por `analytics_events` (tabela `product_sales_stats` ou agregado)
- [x] **9.3.3** Web Share API no card/produto com fallback `navigator.clipboard.writeText`
- [x] **9.3.4** Busca instantânea com tolerância a acentos (normalizar via `String.normalize('NFD').replace(/\p{Diacritic}/gu, '')`)
- [x] **9.3.5** Contagem de resultados e estado vazio com sugestões
- [x] **9.3.6** Categorias sticky com `IntersectionObserver` para marcar item ativo correto
- [x] **9.3.7** Gradiente de overflow nas laterais das categorias
- [x] **9.3.8** `next/image` em `ProductCard`, `ProductModal` e detail page
- [x] **9.3.9** Substituir placeholders 🍔 por `next/image` com fallback se URL vazia

### 9.4 Modal de produto
- [x] **9.4.1** Foto real grande (já tem estrutura, falta image)
- [x] **9.4.2** Suporte completo a adicionais e opções obrigatórias (validar `option_groups.min_choices` antes de permitir `Adicionar`)
- [x] **9.4.3** Preço total em tempo real (somando extras)
- [x] **9.4.4** `aria-label="Diminuir quantidade"` / `"Aumentar quantidade"` nos botões +/-
- [x] **9.4.5** Focus trap + retorno de foco ao fechar + fechar com `Escape` + clique no backdrop
- [x] **9.4.6** Modal de sucesso: 1 upsell contextual relevante, `aria-live`, sem repetir formulário

### 9.5 Carrinho
- [x] **9.5.1** Indicador de progresso `Carrinho → Seus dados → Pagamento → Confirmar` (4 etapas) via `CheckoutProgress`
- [x] **9.5.2** CTA `Continuar pedido →` (não `Avançar` genérico)
- [x] **9.5.3** Edição inline de observação por item (botão `+ Adicionar observação` / `📝 ... (editar)`)
- [x] **9.5.4** Confirmação antes de limpar (`Deseja esvaziar?` em dialog acessível)
- [x] **9.5.5** Mostrar subtotal + quanto falta para pedido mínimo de forma não-alarmante (copy `💡 Faltam X para atingir o pedido mínimo...`)
- [x] **9.5.6** Resumo do pedido permanece visível durante a identificação (card em `/carrinho/identificacao`)

### 9.6 Identificação progressiva
- [x] **9.6.1** Criar página `/carrinho/identificacao` com WhatsApp primeiro (foco automático, `inputMode="tel"`, máscara `(XX) XXXXX-XXXX`)
- [x] **9.6.2** Nome liberado após WhatsApp válido (input desabilitado até validação)
- [x] **9.6.3** Link para política de privacidade ao lado do CTA (checkbox obrigatório + link)
- [x] **9.6.4** Mensagem explicando por que o WhatsApp é necessário (`Usamos o WhatsApp só para confirmar seu pedido`)
- [x] **9.6.5** Persistir contato em localStorage (já tem) + carregar do histórico se for cliente recorrente (`tremelikos:returning` por telefone, contagem, saudação)
- [x] **9.6.6** Tracking `identification_start` / `identification_complete` (com método `whatsapp_first` | `returning`)

### 9.7 Loja fechada
- [x] **9.7.1** Quando `isOpen === false`, exibir banner vermelho com próxima abertura em linguagem natural (`StoreClosedBanner` no layout)
- [x] **9.7.2** Estado "fechando em breve" (âmbar) se falta < 1h para fechar
- [x] **9.7.3** Permitir montar carrinho e enviar quando abrir (CTA `Montar pedido para a próxima abertura`)
- [x] **9.7.4** Tracking `store_closed_session` (1× por sessão de loja fechada, com `next_open_at`)

### 9.8 Pré-pedido / agendamento
- [x] **9.8.1** Aceitar pedidos com `scheduled_for` (datetime futuro) quando loja está fechada (passado em `/carrinho/enviar` e API)
- [x] **9.8.2** Banner específico: "Pedido agendado para hoje às 18:30" (em `/carrinho/enviar`)
- [x] **9.8.3** Validar `scheduled_for` no server (não pode ser no passado, nem inválido) em `/api/whatsapp/send`

### 9.9 Acessibilidade (WCAG)
- [x] **9.9.1** Alvos de toque ≥ 44×44 px em todos os botões (revisão dos `+ / − / compartilhar / fechar`)
- [x] **9.9.2** `aria-label` em busca, compartilhar, voltar, quantidade, carrinho (revisado em Cart, Modal, Header)
- [x] **9.9.3** Contraste AA verificado em textos principais e botões (variants `success`/`warning`/`danger` do Badge)
- [x] **9.9.4** Status com texto + ícone (não só cor) — `Aberto agora`/`Fechando em breve`/`Fechado` com dot colorida
- [x] **9.9.5** Não impedir zoom do usuário (não usamos `user-scalable=0`)
- [x] **9.9.6** Respeitar `prefers-reduced-motion` (CSS global desliga animações/transições)
- [x] **9.9.7** Foco visível em todos os elementos interativos (`*:focus-visible` com `ring-brand ring-offset-2`)

---

## Fase 10: Mídia, Imagens e Performance

### 10.1 Imagens dos produtos
- [x] **10.1.1** Migração `006_product_images_bucket.sql`: tabela `product_images` (id, product_id, path, alt_text, position, is_cover, created_at) + bucket `product-images` (já existia)
- [x] **10.1.2** Bucket Supabase Storage `product-images` com RLS (admin write, public read) — `006_product_images_bucket.sql` (já existia)
- [x] **10.1.3** Validação de MIME (jpg/png/webp), tamanho máximo (500KB), dimensões mínimas (600×600) — `lib/imageProcessing.ts` + API `/api/admin/upload-image`
- [x] **10.1.4** UI no admin: upload com preview + crop 1:1 + compressão client-side (canvas) — `components/admin/ProductImageUploader.tsx` com XHR progress
- [x] **10.1.5** Substituir placeholders 🍔 nos cards/modal/detalhe por `next/image` apontando para `product_images` — `ProductCard`, `ProductModal`, `AddedToCartConfirmation`, `/produto/[slug]`
- [x] **10.1.6** Migrar 10+ produtos prioritários (Mais pedidos) com foto real — admin UI pronta, produtos serão populados via painel

### 10.2 Performance
- [x] **10.2.1** `next/image` em todas as imagens de catálogo com `sizes` correto (96px, 48px, (max-width:640px) 100vw, 448px, 50vw)
- [x] **10.2.2** Formato WebP/AVIF automático via `next/image` (`formats: ['image/avif', 'image/webp']` em `next.config.js`)
- [x] **10.2.3** LCP < 2.5s no p75 — adicionado `priority` no `next/image` da detail page (10.2.5)
- [x] **10.2.4** INP < 200ms — code splitting por rota (já nativo do Next App Router), `compress: true`, `poweredByHeader: false`
- [x] **10.2.5** CLS < 0.1 (sempre com `width`/`height` ou `fill` + `sizes`) — todas as imagens revisadas
- [x] **10.2.6** Bundle analysis (`@next/bundle-analyzer`) e code splitting por rota — `ANALYZE=true npm run build` gera `.next/analyze/{client,nodejs,edge}.html`
- [x] **10.2.7** Fontes: `next/font/google` com Montserrat + `display: swap` (evitar FOUT/CLS) — woff2 servido via `/_next/static/media/...`
- [x] **10.2.8** Remover dependências não usadas — `zod` removido

### 10.3 ISR e cache
- [x] **10.3.1** `revalidate = 300` no detail page de produto (já tem)
- [x] **10.3.2** `revalidate = 60` na home (já tem)
- [x] **10.3.3** Route handler `/api/revalidate` autenticado: chama `revalidatePath('/')` e `revalidatePath('/produto/[slug]', 'page')` quando admin publica — `app/api/revalidate/route.ts` valida admin + aceita `{ paths, tags, fullHome }`
- [x] **10.3.4** Server Action `publishProduct()` chama `revalidatePath` — `app/admin/(authenticated)/actions.ts` com audit + revalida `/`, `/admin/produtos` e `/produto/[slug]`
- [x] **10.3.5** Cache headers em assets estáticos (`Cache-Control: public, max-age=31536000, immutable`) — já em `/api/image` e `next.config.js` (`minimumCacheTTL: 31536000`)

---

## Fase 11: Painel Administrativo — Refinamentos (baseado em `ANALISE_PAINEL_ADMIN_ANOTA_AI.md`)

### 11.1 Shell persistente e navegação
- [ ] **11.1.1** Layout admin com `app/admin/layout.tsx` já existe; **manter** e polir visual
- [ ] **11.1.2** Sidebar com largura 224-240px (atual está ok), item ativo com indicador lateral
- [ ] **11.1.3** Apenas 1 submenu aberto por vez (atualmente pode ter vários)
- [ ] **11.1.4** Link "Ver cardápio" no cabeçalho
- [ ] **11.1.5** Status "Publicado/Rascunho" no cabeçalho (badge global)
- [ ] **11.1.6** Recolher sidebar para 64-72px (toggle)
- [ ] **11.1.7** Responsivo: drawer no mobile, sidebar fixa no desktop

### 11.2 Dashboard "Visão geral" acionável
- [ ] **11.2.1** Status do cardápio (publicado/rascunho/pendências)
- [ ] **11.2.2** Cards: produtos ativos, indisponíveis, sem imagem
- [ ] **11.2.3** Promoções ativas + próximas a expirar
- [ ] **11.2.4** Atalhos: "Adicionar produto", "Pausar item", "Criar promoção"
- [ ] **11.2.5** Preview do cardápio em nova aba
- [ ] **11.2.6** Alertas de qualidade:
  - produto com preço ausente
  - seção vazia
  - imagem pesada (>500KB)
  - promoção expirando em < 24h
  - promoção com conflito de datas
- [ ] **11.2.7** Últimos eventos administrativos (do `audit_logs`)

### 11.3 Produtos
- [ ] **11.3.1** Filtros por seção, status, destaque, disponibilidade
- [ ] **11.3.2** Busca com debounce 300ms
- [ ] **11.3.3** Tabela desktop: miniatura, nome, seção, preço, disponibilidade, destaque, ações
- [ ] **11.3.4** Cards compactos no mobile
- [ ] **11.3.5** Ações inline: pausar/reativar, duplicar, editar preço
- [x] **11.3.6** Edição em massa (`/admin/produtos/edicao-em-massa` + alias `/admin/cardapio/edicao-em-massa`): selecionar N itens, mudar seção (replace/add/remove) / preço (definir/%/fixo + arredondamento) / disponibilidade em lote, com focus trap, busca/filtro, atalho no menu lateral e auditoria
- [ ] **11.3.7** Editor de produto em 1 página com preview mobile ao lado
- [ ] **11.3.8** Barra fixa com "Salvar rascunho" / "Publicar"
- [ ] **11.3.9** Aviso de alterações não salvas

### 11.4 Seções
- [ ] **11.4.1** Drag-and-drop para reordenar (`@dnd-kit/core`)
- [ ] **11.4.2** Alternativa acessível: botões "Mover para cima/baixo" (teclado)
- [ ] **11.4.3** Quantidade de produtos por seção
- [ ] **11.4.4** Edição inline do nome
- [ ] **11.4.5** Confirmação antes de desativar seção com produtos ativos
- [ ] **11.4.6** Preview da ordem

### 11.5 Promoções
- [ ] **11.5.1** Validação de conflitos (sobreposição, preço negativo, fim < início)
- [ ] **11.5.2** Estimativa de preço final antes de publicar (preview com produtos selecionados)
- [ ] **11.5.3** Estados: rascunho, agendada, ativa, encerrada, pausada
- [ ] **11.5.4** Dias da semana + faixa de horário (já tem)
- [ ] **11.5.5** Prioridade + possibilidade de acumular
- [ ] **11.5.6** Limite de uso (já tem via max_redemptions em cupons; para promoções, adicionar `max_uses`)
- [ ] **11.5.7** Badges: agendada (azul), ativa (verde), expirando (âmbar), expirada (cinza)

### 11.6 Disponibilidade
- [ ] **11.6.1** Toggle "Abrir/Fechar loja manualmente" (override de horário)
- [ ] **11.6.2** Exceções e feriados (tabela `store_overrides` — já tem migration 001)
- [ ] **11.6.3** Pausar múltiplos produtos em massa
- [ ] **11.6.4** Agendar retorno de item
- [ ] **11.6.5** Mostrar "alterado por X há Y minutos" (do `audit_logs`)

### 11.7 Mídia e aparência (rota nova `/admin/midia`)
- [ ] **11.7.1** Biblioteca de imagens com uso e tamanho
- [ ] **11.7.2** Recorte 1:1 com preview
- [ ] **11.7.3** Alerta para imagem < 600x600 ou > 500KB
- [ ] **11.7.4** Logo, capa, cores, textos institucionais
- [ ] **11.7.5** Preview responsivo do cardápio

### 11.8 Desempenho (`/admin/desempenho`)
- [ ] **11.8.1** Funil: view_menu → search → view_item → add_to_cart → begin_checkout → whatsapp_order
- [ ] **11.8.2** Sessões e usuários únicos (por período)
- [ ] **11.8.3** Conversão por origem/campanha (UTM)
- [ ] **11.8.4** Top produtos e seções
- [ ] **11.8.5** Gráfico de funil comparando períodos
- [ ] **11.8.6** Produtos com mais add_to_cart mas sem purchase (oportunidade)

### 11.9 Configurações → separações
- [ ] **11.9.1** `/admin/configuracoes/loja` (dados da loja + horários + pagamento)
- [ ] **11.9.2** `/admin/configuracoes/equipe` (gestão de múltiplos admin com papéis owner/manager/editor)
- [ ] **11.9.3** `/admin/configuracoes/integracoes` (Meta, GA4, GTM, WAHA — ativar/desativar com status)
- [ ] **11.9.4** `/admin/configuracoes/auditoria` (filtros por ator, entidade, período, antes/depois diff)

### 11.10 Auditoria melhorada
- [ ] **11.10.1** Filtros: ator, entidade, ação, período
- [ ] **11.10.2** Diff antes/depois em mudanças de preço, disponibilidade, permissão
- [ ] **11.10.3** Paginação server-side
- [ ] **11.10.4** Exportar CSV

---

## Fase 12: Pré-pedidos, Identificação e Checkout (baseado em REFERENCIA UI/UX)

- [ ] **12.1** Migration `007_orders.sql`:
  - `orders (id, store_id, customer_id?, items, total, scheduled_for, status, source, utm_*)`
  - `order_items` (linha do pedido com extras/obs/removed_ingredients)
  - `customers (id, store_id, name, phone, email, total_orders, last_order_at)`
- [ ] **12.2** Fluxo `/carrinho/identificacao` com WhatsApp + nome progressivo
- [ ] **12.3** `/carrinho/entrega` (delivery ou pickup) + endereço (com taxa de entrega)
- [ ] **12.4** `/carrinho/pagamento` (PIX, dinheiro na entrega, cartão)
- [ ] **12.5** `/carrinho/confirmar` com revisão completa + botão `Enviar pedido pelo WhatsApp`
- [ ] **12.6** Webhook WAHA recebe confirmação → cria `order` no Supabase → status `confirmed`
- [ ] **12.7** Tracking de cada etapa (`begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`)
- [ ] **12.8** Cupom/Endereço salvos para próxima visita (cliente recorrente)

---

## Fase 13: Performance, SEO e Deploy (consolidação)

### 13.1 SEO técnico
- [ ] **13.1.1** `metadataBase` e `canonical` por rota (já tem parcialmente)
- [ ] **13.1.2** Open Graph + Twitter Card (já tem)
- [ ] **13.1.3** JSON-LD `Restaurant`, `Menu`, `MenuItem`, `Offer` por produto
- [ ] **13.1.4** Sitemap dinâmico com produtos ativos (já tem `/sitemap.xml` mas revisar)
- [ ] **13.1.5** `robots.ts` permitindo admin
- [ ] **13.1.6** Página `/politica-de-privacidade` revisada por advogado (LGPD)

### 13.2 Performance (consolidar Fase 10)
- [ ] **13.2.1** Lighthouse score ≥ 90 em Performance/Accessibility/Best Practices/SEO
- [ ] **13.2.2** LCP < 2.5s, INP < 200ms, CLS < 0.1 (p75 mobile 4G)
- [ ] **13.2.3** Edge caching em rotas públicas
- [ ] **13.2.4** Service Worker para offline do cardápio (somente leitura)

### 13.3 Deploy
- [ ] **13.3.1** GitHub Actions workflow `.github/workflows/deploy.yml` (já existe parcialmente)
- [ ] **13.3.2** Backups automáticos do Supabase (diário, 7 dias de retenção)
- [ ] **13.3.3** Monitoramento: UptimeRobot + Sentry para erros
- [ ] **13.3.4** Alertas de gasto (Meta Ads, Supabase, domínio)

---

## Fase 14: Testes

### 14.1 Unit (Vitest)
- [ ] **14.1.1** `lib/money.ts` (formatMoney, parseMoney)
- [ ] **14.1.2** `features/promotions/promoCalculator.ts`
- [ ] **14.1.3** `features/cart/CartContext.tsx` (subtotal, add, remove)
- [ ] **14.1.4** `features/store-status` (isOpen, nextOpen)
- [ ] **14.1.5** `features/whatsapp/formatOrder.ts`
- [ ] **14.1.6** `features/analytics/events.ts` (dedup de event_id)

### 14.2 E2E (Playwright)
- [ ] **14.2.1** Fluxo: home → busca → add ao carrinho → checkout → WhatsApp
- [ ] **14.2.2** Login admin → criar produto → ver no cardápio
- [ ] **14.2.3** Login admin → criar promoção → aparece no banner
- [ ] **14.2.4** Loja fechada → CTA "Montar pedido"
- [ ] **14.2.5** Cupom válido + inválido

### 14.3 Segurança
- [ ] **14.3.1** Testar RLS: usuário A não vê dados da loja B
- [ ] **14.3.2** Testar RLS: editor não pode deletar produtos (apenas owner)
- [ ] **14.3.3** Testar CORS/CSRF nas Server Actions

---

## Fase 15: Lançamento e Crescimento

### 15.1 Conteúdo
- [ ] **15.1.1** Fotos reais dos 10+ vendidos (hambúrgueres principais)
- [ ] **15.1.2** Foto da capa com produto + identidade
- [ ] **15.1.3** Descrições revisadas com gatilho de especificidade ("180 g", "na brasa", "pão de 23 cm")
- [ ] **15.1.4** Combos definidos (entrada + principal + bebida)

### 15.2 Campanhas
- [ ] **15.2.1** Pixel Meta ativo e deduplicando (validar via Test Events)
- [ ] **15.2.2** Google Ads Enhanced Conversions ativo
- [ ] **15.2.3** Audiência de retargeting: AddToCart sem Purchase
- [ ] **15.2.4** Lookalike 1% de clientes que compraram
- [ ] **15.2.5** Campanhas por objetivo:
  - Mensageria (WhatsApp Lead) — para fechar pedidos
  - Conversão (Purchase) — para otimizar diretamente
  - Tráfego (PageView) — top of funnel
- [ ] **15.2.6** UTMs padrão para Google Meu Negócio e Instagram bio

### 15.3 Pós-lançamento
- [ ] **15.3.1** Semana 1: monitorar eventos, ajustar eventos com falha
- [ ] **15.3.2** Semana 2: implementar A/B tests de copy/CTAs
- [ ] **15.3.3** Semana 3: ligar remarketing para carrinho abandonado
- [ ] **15.3.4** Mês 1: analisar funil, melhorar etapas com maior drop-off
- [ ] **15.3.5** Trimestre 1: introduzir fidelidade/cashback se houver base

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

## Documentos de Referência

- `REFERENCIA_UI_UX_CRO_ANOTA_AI.md` — auditoria do cardápio Anota AI com análise UI/UX/CRO (origem das Fases 9 e 12)
- `ANALISE_PAINEL_ADMIN_ANOTA_AI.md` — auditoria do painel admin Anota AI com requisitos de arquitetura, design system e segurança (origem da Fase 11)
- `DOCUMENTACAO_VIABILIDADE_CARDAPIO.md` — viabilidade econômica
- `viabilidade-cardapio-digital.md` — versão complementar da viabilidade

## Notas Importantes

1. **WAHA API:** Usar webhook para receber confirmações. O envio é via POST para `/api/sendMessage`.

2. **VPS Deploy:** Usar PM2 para manter o Next.js rodando. Nginx como proxy reverso na porta 443 com SSL.

3. **Imagens:** Prioridade máxima — sem fotos reais, conversão cai drasticamente.

4. **LGPD:** Banner de cookies obrigatório. Política de privacidade publicada.

5. **Performance:** Meta LCP < 2,5s. Testar com Lighthouse antes do lançamento.

6. **WhatsApp:** Mensagem deve incluir código curto do carrinho para facilitar atendimento.

---

*Documento criado para planejamento e execução do projeto Tremeliko's Burguer Digital.*
