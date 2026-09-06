# Checklist — Release / Staging (Tremeliko's Burguer)

Documento vivo. Última atualização: 2026-09-06.

> Siga esta lista antes de qualquer deploy em staging ou produção. Cada checkbox deve ser fechado antes de prosseguir para a próxima fase.

## 0. Controle de versão e branch

- [ ] Branch dedicada criada (ex: `fix/producao-p0-cardapio`) a partir do commit base.
- [ ] `git status` limpo para o commit de baseline antes de iniciar alterações funcionais.
- [ ] Nenhuma credencial, senha ou token real em arquivos versionados (`README.md`, `PLANEJAMENTO.md`, `docs/RUNBOOK.md`, migrations, seeds, documentos de auditoria).
- [ ] `.env.local`, `.env`, `.env.*.local` permanecem no `.gitignore` e nunca são commitados.
- [ ] Commit de baseline separado das correções funcionais (ex: `chore: prepare production remediation baseline`).

## 1. Variáveis de ambiente obrigatórias por ambiente

> Todos os valores são sensíveis. Armazene-os no provedor de cada ambiente (VPS env-file, GitHub Secrets, Vercel/Render envs), nunca em código ou documentos públicos.

### 1.1 Variáveis server-side (nunca expostas ao navegador)

| Variável | Local (dev) | Staging | Produção |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | obrigatório | obrigatório | obrigatório |
| `WAHA_API_URL` | obrigatório | obrigatório | obrigatório |
| `WAHA_API_KEY` | obrigatório | obrigatório | obrigatório |
| `WAHA_SESSION_NAME` | obrigatório | obrigatório | obrigatório |
| `META_PIXEL_ID` | opcional | recomendado | obrigatório |
| `META_CAPI_TOKEN` | opcional | recomendado | obrigatório |
| `GA4_MEASUREMENT_ID` (server) | opcional | recomendado | obrigatório |
| `GA4_API_SECRET` | opcional | recomendado | obrigatório |

### 1.2 Variáveis client-side (expostas via `NEXT_PUBLIC_*`)

| Variável | Local (dev) | Staging | Produção |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | obrigatório | obrigatório | obrigatório |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | obrigatório | obrigatório | obrigatório |
| `NEXT_PUBLIC_STORE_NAME` | obrigatório | obrigatório | obrigatório |
| `NEXT_PUBLIC_STORE_PHONE` | obrigatório | obrigatório | obrigatório |
| `NEXT_PUBLIC_MINIMUM_ORDER` | obrigatório | obrigatório | obrigatório |
| `NEXT_PUBLIC_TIMEZONE` | obrigatório | obrigatório | obrigatório |
| `NEXT_PUBLIC_GTM_ID` | opcional | recomendado | recomendável |
| `NEXT_PUBLIC_META_PIXEL_ID` | opcional | recomendado | recomendável |
| `NEXT_PUBLIC_GA4_ID` | opcional | recomendado | recomendável |
| `NEXT_PUBLIC_PRODUCT_IMAGES_BUCKET` | padrão | padrão | padrão |
| `NEXT_PUBLIC_BASE_URL` | padrão | conforme staging | conforme produção |

### 1.3 Variáveis de runtime / CI

| Variável | Uso |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `ANALYZE` | `true` para gerar `.next/analyze/*.html` |
| `PLAYWRIGHT_BASE_URL` | URL base dos testes E2E |
| `CI` | ativa retries/workers no Playwright |

## 2. Higiene de segurança em documentos versionados

Antes de qualquer commit ou push, confirme:

- [ ] `PLANEJAMENTO.md` não contém credenciais reais de login (trocar por `admin@exemplo.com / ***`).
- [ ] `docs/RUNBOOK.md` não expõe hostnames de banco, chaves de API ou endereços internos.
- [ ] `README.md` usa apenas placeholders (`sua_chave_aqui`, `eyJxxx...`).
- [ ] Nenhum arquivo de migração ou seed contém senhas, chaves ou tokens reais.
- [ ] Auditoria de arquivos (`grep -RinE 'password|secret|token|api.key|admin@|eyJ'`) limpa antes de push.

## 3. Testes obrigatórios (rodar em sequência)

```bash
npm run lint
npm test -- --run
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Critérios de aceite:

- [ ] `lint`: zero erros (warnings são observáveis, não bloqueantes).
- [ ] `test`: 100% dos testes passam.
- [ ] `build`: compilação completa sem erros de rota ou asset.
- [ ] `test:e2e`: todos os E2E passam (ou falhas conhecidas estão documentadas).
- [ ] `audit`: nenhuma vulnerabilidade high/critical pendente, ou exceção documentada.

## 4. Migrations e backup

- [ ] Backup do Supabase realizado antes de qualquer migration (`pg_dump` ou painel Supabase).
- [ ] Migrations aplicadas em staging primeiro, com validação.
- [ ] Rollback testado ou procedimento documentado (`docs/RUNBOOK.md`).
- [ ] Commit com migration nova referencia o arquivo SQL no commit message.

## 5. Deploy em staging

- [ ] Branch push para o repositório remoto.
- [ ] CI/CD passando (typecheck, lint, tests, build).
- [ ] Variáveis de staging configuradas no provedor (separadas das de produção).
- [ ] Health check retornando 200 (`/api/health`).
- [ ] URL de staging registrada (ex: `https://staging.tremelikos.growthpulse.com.br`).
- [ ] Rodada de smoke manual:
  - [ ] Homepage carrega
  - [ ] Produto abre, modal funciona
  - [ ] Carrinho adiciona/remove
  - [ ] Checkout salva pedido e abre WhatsApp
  - [ ] Admin protege rota e permite login
  - [ ] Headers de segurança presentes (X-Content-Type-Options, Referrer-Policy)
  - [ ] Analytics dispara eventos sem duplicação óbvia

## 6. Deploy em produção

- [ ] Staging com GO.
- [ ] Commit SHA aprovado e registrado.
- [ ] Nenhuma credencial real em branch/documentos versionados.
- [ ] Backup do banco de produção realizado antes de migrations.
- [ ] Variáveis de produção configuradas (separadas, com secrets gerenciados).
- [ ] CI/CD passando na branch de release.
- [ ] Rollback plano definido e testável.
- [ ] Smoke test pós-deploy registrado com data, commit e responsável.

## 7. Pós-go-live (primeiras 48h)

- [ ] Monitoramento de erros de checkout nos logs.
- [ ] Conferência de divergência entre banco, WhatsApp e atendimento.
- [ ] Eventos de analytics validados (view_item, add_to_cart, purchase).
- [ ] Incidentes registrados e corrigidos em commits separados.
