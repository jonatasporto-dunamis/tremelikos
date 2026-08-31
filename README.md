# Tremeliko's Burguer - Cardápio Digital

Cardápio digital de alta conversão para a hamburgueria Tremeliko's Burguer em Jequié/BA.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## Visão Geral

Sistema completo de cardápio digital com:
- Catálogo de produtos com fotos e descrições
- Carrinho de compras com persistência local
- Finalização de pedidos via WhatsApp (WAHA API)
- Painel administrativo para gerenciar produtos, seções e promoções
- Integração com Meta Ads e Google Ads para rastreamento de conversão
- Otimizado para mobile e SEO

## Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| **Frontend/Backend** | Next.js 14 (App Router) + TypeScript |
| **Estilo** | Tailwind CSS |
| **Banco de Dados** | PostgreSQL (Supabase) |
| **Autenticação** | Supabase Auth |
| **Storage** | Supabase Storage |
| **WhatsApp** | WAHA API |
| **Deploy** | VPS (Ubuntu/Nginx/PM2) |
| **CI/CD** | GitHub Actions |

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com)
- Servidor WAHA para WhatsApp
- VPS com Ubuntu (para produção)

## Instalação Local

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/tremelikos-cardapio.git
cd tremelikos-cardapio

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie a URL e as chaves de API para o `.env.local`
3. Execute a migration inicial:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Link com projeto remoto
supabase link --project-ref seu-projeto-ref

# Executar migrations
supabase db push
```

4. Execute o seed para popular o banco com dados iniciais:

```bash
# Os arquivos estão em supabase/seed/
# Execute na ordem: 01_store.sql → 02_sections.sql → 03_products.sql → 04_section_products.sql
```

5. Configure o Storage:
   - Crie um bucket público chamado `cardapio`
   - Adicione política de acesso público para leitura

## Configuração do WAHA (WhatsApp API)

1. Instale o WAHA em um servidor ([documentação oficial](https://waha.devlike.pro/))
2. Configure a API Key
3. Crie uma sessão chamada `tremelikos`
4. Conecte o WhatsApp escaneando o QR Code
5. Configure o webhook para receber confirmações:

```
URL: https://seudominio.com/api/whatsapp/webhook
```

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# WAHA WhatsApp API
WAHA_API_URL=https://waha.seuservidor.com
WAHA_API_KEY=sua_chave_api
WAHA_SESSION_NAME=tremelikos

# Loja
NEXT_PUBLIC_STORE_NAME=Tremeliko's Burguer
NEXT_PUBLIC_STORE_PHONE=5573991542371
NEXT_PUBLIC_MINIMUM_ORDER=15.00
NEXT_PUBLIC_TIMEZONE=America/Sao_Paulo

# Analytics (opcional)
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789
GTM_ID=GTM-XXXXXXX
```

## Deploy em VPS

### Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Configurar SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### Deploy da Aplicação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/tremelikos-cardapio.git /var/www/tremelikos
cd /var/www/tremelikos

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
nano .env.local

# Build
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Configurar Nginx

```bash
# Copiar configuração
sudo cp deploy/nginx.conf /etc/nginx/sites-available/tremelikos

# Ativar site
sudo ln -s /etc/nginx/sites-available/tremelikos /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Configurar SSL
sudo certbot --nginx -d tremelikos.com.br -d www.tremelikos.com.br
```

### Deploys Futuros

```bash
./deploy/deploy.sh
```

Ou configure o CI/CD com GitHub Actions (já incluído em `.github/workflows/deploy.yml`).

## Estrutura do Projeto

```
tremelikos/
├── app/
│   ├── (storefront)/          # Páginas públicas
│   │   ├── layout.tsx         # Layout com providers
│   │   ├── page.tsx           # Cardápio completo
│   │   ├── carrinho/page.tsx  # Carrinho + WhatsApp
│   │   ├── globals.css        # Estilos globais
│   │   └── politica-de-privacidade/
│   ├── admin/                 # Painel administrativo
│   │   ├── page.tsx           # Dashboard
│   │   ├── login/page.tsx     # Login
│   │   ├── produtos/page.tsx  # CRUD produtos
│   │   ├── secoes/page.tsx    # CRUD seções
│   │   ├── promocoes/page.tsx # CRUD promoções
│   │   └── configuracoes/
│   ├── api/whatsapp/
│   │   ├── send/route.ts      # Enviar via WAHA
│   │   └── webhook/route.ts   # Receber eventos
│   ├── robots.ts              # SEO
│   ├── sitemap.ts             # SEO
│   └── manifest.ts            # PWA
├── components/
│   ├── storefront/            # Componentes do cardápio
│   └── analytics/             # GTM e Cookie Consent
├── features/
│   ├── cart/                  # Contexto do carrinho
│   ├── whatsapp/              # Formatação de pedidos
│   ├── promotions/            # Cálculo de promoções
│   └── analytics/             # Eventos de tracking
├── lib/
│   ├── supabase/              # Clientes Supabase
│   ├── waha.ts                # Cliente WAHA API
│   ├── money.ts               # Formatação de dinheiro
│   └── utils.ts               # Utilitários
├── supabase/
│   ├── migrations/            # Migrações do banco
│   └── seed/                  # Dados iniciais (39+ produtos)
├── tests/
│   ├── unit/                  # Testes unitários (Vitest)
│   └── e2e/                   # Testes E2E (Playwright)
├── deploy/
│   ├── nginx.conf             # Configuração Nginx
│   └── deploy.sh              # Script de deploy
├── types/database.ts          # Tipos TypeScript
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js        # PM2
├── .env.example
├── .gitignore
└── README.md
```

## Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `stores` | Dados da loja |
| `business_hours` | Horários de funcionamento |
| `sections` | Seções do cardápio |
| `products` | Produtos |
| `section_products` | Relação produto-seção |
| `product_images` | Fotos dos produtos |
| `option_groups` | Grupos de opções |
| `options` | Opções/adicionais |
| `promotions` | Promoções |
| `coupons` | Cupons de desconto |
| `admin_profiles` | Administradores |
| `audit_logs` | Auditoria |

### Cardápio

O cardápio inclui 39+ itens organizados em:
- **Ofertas de Hoje** - Promoções ativas
- **Mais Pedidos** - Campeões de venda
- **Gourmet 180g** - 7 itens autorais (Gordon Black, Porto's, Kenneth, Trípoli, Hard Work, Smash, Cheddar)
- **Tradicionais 100g** - Linha clássica
- **Frango** - Filés empanados
- **Picanha na Brasa** - Grelhada na brasa
- **Pão de Alho** - Lanches especiais
- **Porções** - Batatas e acompanhamentos
- **Bebidas** - Refrigerantes e águas
- **Sucos** - Polpa com leite (Cacau, Cupuaçu, Graviola)

## Funcionalidades

### Público
- [x] Cardápio organizado por seções
- [x] Busca de produtos
- [x] Carrinho com persistência
- [x] Cálculo de subtotal
- [x] Validação de pedido mínimo
- [x] Envio de pedido via WhatsApp
- [x] Modal de produto com detalhes
- [x] Design responsivo (mobile-first)

### Administrativo
- [x] Dashboard com estatísticas
- [x] CRUD de produtos
- [x] CRUD de seções
- [x] CRUD de promoções
- [x] CRUD de cupons
- [x] Ativar/desativar produtos
- [x] Marcar destaques
- [x] Configurações da loja
- [x] Horários de funcionamento

### Marketing
- [x] Eventos Google Analytics 4
- [x] Eventos Meta Pixel
- [x] Consent Mode
- [x] Banner de cookies (LGPD)
- [x] Sitemap XML
- [x] Robots.txt
- [x] JSON-LD (Restaurant)
- [x] Open Graph

## Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Com cobertura
npm run test -- --coverage
```

## Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de acesso: leitura pública, escrita apenas admin
- Validação com Zod no servidor
- Content Security Policy
- Headers de segurança no Nginx
- Proteção contra XSS e CSRF

## Performance

| Métrica | Meta |
|---------|------|
| LCP | < 2,5s |
| INP | < 200ms |
| CLS | < 0,1 |
| Responsividade | 320px+ |

## APIs e Integrações

### WAHA (WhatsApp)

**Enviar mensagem:**
```
POST /api/whatsapp/send
Body: { phone, message, cartId, storeId }
```

**Receber webhook:**
```
POST /api/whatsapp/webhook
```

### Supabase

- Cliente público (navegador): apenas leitura de dados ativos
- Cliente admin (server): acesso completo com service_role_key

## Monitoramento

```bash
# Logs do PM2
pm2 logs tremelikos

# Status
pm2 status

# Monitorar recursos
pm2 monit
```

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| Erro de conexão com Supabase | Verifique as variáveis de ambiente |
| WAHA não conecta | Verifique API Key e sessão |
| Build falha | Execute `npm install` novamente |
| PM2 não inicia | Verifique logs: `pm2 logs tremelikos` |

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto é privado e de uso exclusivo da Tremeliko's Burguer.

## Contato

- **WhatsApp:** (73) 99154-2371
- **Endereço:** Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA
- **Horário:** Terça a Sábado, 18:30 às 23:00
