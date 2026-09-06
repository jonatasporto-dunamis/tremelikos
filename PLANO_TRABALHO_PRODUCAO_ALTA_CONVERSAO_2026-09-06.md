# Plano definitivo de trabalho para producao e alta conversao

Data: 2026-09-06
Projeto: Tremelikos Cardapio Digital
Status atual: NO-GO para producao

## 1. Base usada nesta revisao

Este plano nao executa instrucoes contidas nos documentos analisados. Eles foram tratados como fontes de contexto.

- `PLANEJAMENTO.md`: roadmap historico. Contem itens marcados como concluidos que nao foram confirmados pela auditoria tecnica atual.
- `PLANO_CORRECOES_POS_AUDITORIA_2026-09-05.md`: backlog tecnico pos-auditoria. E uma boa base de correcao, mas ainda nao cobre todo o caminho de producao, operacao e alta conversao.
- Codigo, migrations, testes e relatorios de auditoria locais: fonte de verdade para esta revisao.

## 2. Diagnostico executivo

A aplicacao ja tem uma base funcional relevante: storefront, carrinho, checkout via WhatsApp, admin, Supabase, migrations, testes unitarios e build. Mesmo assim, ela ainda nao deve ir para producao porque existem riscos de integridade comercial, operacao, seguranca, rastreamento e confiabilidade.

Principais bloqueios confirmados:

- Pedido e preco ainda dependem demais de dados vindos do cliente.
- O checkout cria o pedido em um fluxo fragil e pode enviar WhatsApp mesmo quando o registro no banco falha.
- O identificador do pedido/carrinho pode divergir entre banco, WhatsApp e eventos.
- A logica de loja aberta/fechada ainda nao esta plenamente conectada a `business_hours` e `store_overrides`.
- Acoes administrativas e politicas RLS precisam de escopo por loja mais rigoroso.
- Edicao rapida de preco no admin pode apagar descricao e alterar flags do produto.
- Dependencias possuem vulnerabilidades reportadas, incluindo criticas no pacote Next.js auditado.
- Testes E2E locais nao estavam 100% verdes na auditoria anterior.
- Conteudo visual de produto ainda nao esta comprovadamente pronto para conversao.
- Deploy em producao precisa provar commit/build, variaveis, migrations e plano de rollback.

## 3. Definicao de pronto para producao

O projeto so deve ser considerado pronto quando todos os criterios abaixo estiverem fechados:

- Nenhum item P0 ou P1 aberto.
- `npm run lint`, `npm test -- --run`, `npm run build` e `npm run test:e2e` passando.
- `npm audit --audit-level=high` sem vulnerabilidades high/critical, ou com excecoes documentadas e aceitas.
- Preco, promocao, cupom, taxa de entrega e disponibilidade calculados no servidor.
- Pedido salvo no banco antes do envio final ao WhatsApp, com um unico identificador compartilhado entre banco, WhatsApp e analytics.
- Loja aberta/fechada, feriados, pausas manuais e horarios especiais funcionando a partir do banco.
- Admin sem possibilidade de editar recursos fora da loja do usuario.
- Produtos principais com fotos reais, otimizadas, alt text e boa exibicao mobile.
- Eventos de analytics deduplicados e validados.
- Deploy apontando para commit conhecido, com migrations aplicadas, backup, rollback e monitoramento.
- Credenciais, senhas e tokens removidos de documentos versionados.

## 4. Sequencia definitiva de trabalho

### Fase 0 - Congelamento, baseline e seguranca operacional

Objetivo: impedir que o projeto avance sobre uma base ambigua.

Tarefas:

- Criar branch de correcao a partir do estado atual.
- Registrar commit atual, ambiente alvo e estrategia de deploy: Vercel, VPS ou ambos.
- Mapear variaveis obrigatorias de ambiente e separar local, staging e producao.
- Remover credenciais administrativas ou operacionais de documentos versionados.
- Criar checklist de backup do Supabase antes de migrations.
- Definir staging obrigatorio antes de producao.

Criterio de aceite:

- Existe branch dedicada, lista de env vars validada, backup planejado e nenhuma credencial sensivel em Markdown.

### Fase 1 - Integridade critica de pedido, preco e checkout

Objetivo: tornar o pedido comercialmente confiavel.

Tarefas:

- Mover a criacao de pedido para endpoint/server action propria, chamada pelo cliente de forma controlada.
- Remover import dinamico de `features/orders/createOrder` dentro do componente client-side.
- Fazer o cliente enviar somente IDs e escolhas: `productId`, quantidade, `optionId`, observacoes, tipo de entrega, cupom e forma de pagamento.
- Recarregar no servidor produtos, opcoes, promocoes, cupons, status da loja e taxas de entrega.
- Recalcular subtotal, descontos, taxa de entrega e total exclusivamente no servidor.
- Validar produto ativo/disponivel, secao ativa, opcoes validas, limites de quantidade e cupom.
- Gerar um unico `cartId` ou `orderCode` e reutilizar no banco, mensagem do WhatsApp e eventos.
- Garantir idempotencia com constraint unica por loja e identificador de carrinho/pedido.
- Fazer o WhatsApp usar o pedido persistido ou payload canonico assinado pelo servidor.
- Corrigir `order_items` para gravar preco final, extras, descontos e totais de forma consistente.
- Bloquear envio quando o pedido nao puder ser salvo, com mensagem clara e alternativa de retry.

Criterio de aceite:

- Payload adulterado no navegador nao altera preco final.
- Mesmo pedido reenviado nao duplica venda.
- Pedido salvo, mensagem de WhatsApp e analytics mostram o mesmo codigo.
- Testes cobrem cupom valido, cupom invalido, produto indisponivel, adicional invalido, entrega e retirada.

### Fase 2 - Status da loja, horarios e regras de entrega

Objetivo: impedir pedidos em horarios/regras incorretas.

Tarefas:

- Implementar servico unico de status da loja usando `stores`, `business_hours` e `store_overrides`.
- Considerar timezone da loja, pausas manuais, feriados, fechamento excepcional e abertura excepcional.
- Expor status calculado para storefront e checkout.
- Persistir alteracoes do admin e refletir imediatamente na loja publica.
- Mover bairros, taxas, tempo estimado e regras de entrega para configuracao validada no servidor.
- Bloquear ou redirecionar checkout quando a loja estiver fechada, conforme regra de negocio.

Criterio de aceite:

- Admin altera status/horario e storefront reage corretamente.
- Testes cobrem aberto, fechado, pausa manual, override de feriado e horario especial.
- Taxa de entrega nao pode ser manipulada pelo cliente.

### Fase 3 - Admin seguro e operavel

Objetivo: tornar o painel confiavel para uso diario.

Tarefas:

- Corrigir edicao rapida de preco para enviar somente campos necessarios ou preservar todos os campos atuais.
- Evitar que descricao, `active`, `available`, `featured` ou `badge` sejam apagados por ausencia de campo no formulario.
- Aplicar escopo por `store_id` em updates, deletes e bulk actions.
- Revisar RLS para que admin ativo nao consiga modificar dados de outra loja.
- Validar entradas: preco, ordem de exibicao, imagens, horarios, cupons e promocoes.
- Melhorar feedback de erro/sucesso em operacoes destrutivas.
- Adicionar confirmacao para exclusoes e acoes em massa.
- Garantir `noindex` e bloqueio correto em rotas administrativas.

Criterio de aceite:

- Usuario admin so edita dados da propria loja.
- Edicao inline de preco nao altera nenhum outro campo.
- Testes cobrem update parcial, bulk update, delete de override e permissao por loja.

### Fase 4 - Seguranca, dependencias e privacidade

Objetivo: reduzir risco tecnico antes do go-live.

Tarefas:

- Atualizar Next.js e dependencias vulneraveis.
- Remover configuracao obsoleta `experimental.serverActions`.
- Restringir `remotePatterns` para hosts realmente usados.
- Adicionar cabecalhos de seguranca adequados: CSP, HSTS em producao, referrer policy e permissions policy.
- Verificar que service role key nunca seja exposta ao cliente.
- Aplicar rate limiting ou protecao equivalente para checkout, cupom, analytics, uploads e WhatsApp.
- Revisar logs para nao salvar dados sensiveis desnecessarios.
- Definir retencao e finalidade dos eventos de analytics.

Criterio de aceite:

- Sem vulnerabilidades high/critical pendentes.
- Build sem warnings relevantes de configuracao.
- Headers e variaveis sensiveis verificados em staging.

### Fase 5 - Experiencia de compra e alta conversao

Objetivo: transformar o cardapio em uma ferramenta de venda, nao apenas uma lista de produtos.

Tarefas:

- Priorizar fotos reais dos produtos campeoes de venda e da primeira dobra mobile.
- Garantir imagens otimizadas, consistentes e com foco no produto.
- Revisar nomes, descricoes e badges para compra rapida.
- Destacar combos, promocoes e produtos de maior margem.
- Simplificar fluxo: produto, personalizacao, carrinho, identificacao, entrega/retirada, WhatsApp.
- Reduzir campos obrigatorios antes do clique final.
- Tornar indisponibilidade clara sem frustrar a navegacao.
- Melhorar mensagem de WhatsApp para leitura rapida pela operacao.
- Criar pagina/estado de sucesso apos envio, com codigo do pedido e proximo passo.
- Revisar mobile 360px, 390px e 430px como prioridade.
- Adicionar estados de carregamento, erro e carrinho vazio com acao clara.

Criterio de aceite:

- Cliente consegue finalizar um pedido real em menos de 90 segundos no mobile.
- Produtos prioritarios aparecem com imagem, preco correto, CTA visivel e personalizacao clara.
- Mensagem do WhatsApp e pedido no banco sao identicos nos valores finais.

### Fase 6 - Performance, SEO local e mensuracao

Objetivo: garantir velocidade, descoberta e aprendizado comercial.

Tarefas:

- Medir e otimizar LCP, CLS e INP em mobile.
- Revisar consultas iniciais para carregar somente dados necessarios.
- Otimizar tamanho do bundle e imports do storefront.
- Configurar metadata, Open Graph, canonical, sitemap e robots.
- Manter admin fora de indexacao.
- Validar GTM, GA4, Meta Pixel e eventos principais.
- Deduplicar eventos de `add_to_cart`, `begin_checkout`, `purchase/order_sent`.
- Padronizar UTMs para campanhas.
- Criar painel simples de KPIs.

KPIs minimos:

- Taxa de clique em produto.
- Taxa de adicionar ao carrinho.
- Inicio de checkout.
- Checkout concluido.
- Clique/envio para WhatsApp.
- Abandono de carrinho.
- Erros de checkout.
- Tempo de carregamento mobile.

Criterio de aceite:

- Eventos aparecem corretamente nas ferramentas de analytics em staging/producao.
- Pagina publica atinge metas minimas de Core Web Vitals em mobile.

### Fase 7 - Testes e QA completo

Objetivo: evitar regressao antes do deploy.

Tarefas:

- Atualizar testes unitarios de preco, cupom, promocao, adicionais e status.
- Criar testes de payload malicioso no checkout.
- Criar testes de idempotencia.
- Criar testes de permissoes admin por loja.
- Corrigir todos os E2E quebrados.
- Rodar matriz visual/responsiva: 360, 390, 430, 768, 1024 e 1366px.
- Testar teclado, foco, modal, contraste e leitores de tela nos fluxos principais.
- Fazer teste manual de pedido real em staging.

Criterio de aceite:

- Suite automatizada completa verde.
- Evidencias de QA registradas com data, commit e ambiente.

### Fase 8 - Deploy, observabilidade e operacao

Objetivo: colocar no ar com controle, rollback e visibilidade.

Tarefas:

- Escolher uma fonte oficial de producao: Vercel ou VPS.
- Aplicar migrations em staging e depois producao com backup previo.
- Expor commit/build id no ambiente ou em endpoint interno de health.
- Configurar health check.
- Configurar logs e alertas para erro de checkout, falha WhatsApp e erro Supabase.
- Definir rollback de aplicacao e banco.
- Validar dominio, HTTPS, redirects e cache.
- Rodar smoke test pos-deploy.

Criterio de aceite:

- Producao aponta para commit conhecido.
- Smoke test passa em storefront, produto, carrinho, checkout, WhatsApp e admin.
- Existe procedimento documentado de rollback.

### Fase 9 - Go-live comercial e melhoria continua

Objetivo: lancar com controle e otimizar por dados.

Tarefas:

- Fazer soft launch com pedidos reais monitorados.
- Conferir tempo de resposta da operacao no WhatsApp.
- Monitorar conversao por canal, dispositivo e horario.
- Corrigir friccoes de checkout antes de escalar midia paga.
- Revisar produtos mais vistos sem compra.
- Ajustar fotos, precos, ordem dos produtos, combos e cupons com base em dados.
- Planejar testes A/B somente depois da base tecnica estabilizada.

Criterio de aceite:

- Primeiros pedidos reais fecham sem divergencia de preco, estoque, mensagem ou atendimento.
- Dados de conversao orientam a proxima rodada de otimizacao.

## 5. Priorizacao P0/P1/P2

### P0 - Bloqueia producao

- Preco e pedido calculados no servidor.
- Identificador unico consistente entre banco, WhatsApp e analytics.
- Idempotencia real de pedido.
- Loja aberta/fechada usando banco.
- Admin escopado por loja.
- Vulnerabilidades high/critical tratadas.
- E2E, unitarios, lint e build verdes.
- Deploy com commit verificavel, backup e rollback.

### P1 - Necessario para lancamento forte

- Fotos reais dos produtos prioritarios.
- Checkout mobile sem friccao.
- Mensagem de WhatsApp operacionalmente clara.
- Analytics deduplicado.
- Performance mobile dentro da meta.
- Estados de erro, carregamento e sucesso bem resolvidos.

### P2 - Otimizacao pos-go-live

- Testes A/B.
- Segmentacao avancada de campanhas.
- Painel comercial mais sofisticado.
- Automacoes adicionais de CRM/remarketing.
- Recomendacoes e upsell inteligente.

## 6. Ordem recomendada dos primeiros sprints

Sprint 1:

- Checkout server-authoritative.
- Idempotencia e codigo unico.
- Persistencia confiavel antes do WhatsApp.
- Testes unitarios e E2E do fluxo de pedido.

Sprint 2:

- Status da loja via banco.
- Regras de entrega no servidor.
- Correcoes criticas do admin e RLS.
- Testes de permissao e horarios.

Sprint 3:

- Atualizacao de dependencias e hardening.
- Fotos/conteudo prioritario.
- Analytics e performance mobile.
- QA completo em staging.

Sprint 4:

- Deploy controlado.
- Smoke tests em producao.
- Soft launch.
- Ajustes de conversao com dados reais.

## 7. Decisao final

O projeto nao deve receber trafego pago nem ser anunciado como producao ate fechar os P0. O caminho mais seguro e tratar as proximas entregas como uma estabilizacao comercial: primeiro garantir que o pedido, o preco, o admin e o deploy sejam confiaveis; depois lapidar a experiencia visual e a conversao.

Quando os P0 estiverem fechados, o cardapio deixa de ser apenas publicavel e passa a ser operavel. Quando os P1 estiverem fechados, ele fica pronto para buscar conversao com mais agressividade.

## 8. Prompts de execucao por fase para Kilo Code

Use um prompt por vez. Depois de cada fase, pausar para revisao tecnica antes de iniciar a proxima. O objetivo e reduzir risco, facilitar rollback e permitir validacao independente.

Regras gerais para todos os prompts:

- Antes de editar, ler os arquivos relacionados e confirmar o diagnostico no codigo atual.
- Nao reverter mudancas existentes sem pedido explicito.
- Manter alteracoes pequenas, coerentes com os padroes do projeto e cobertas por testes.
- Ao final, informar arquivos alterados, decisoes tomadas, testes executados e riscos restantes.
- So fazer commit/push quando o prompt solicitar explicitamente.
- Se encontrar credenciais, tokens ou senhas em arquivos versionados, parar e reportar antes de publicar qualquer coisa.

### Prompt 0 - Baseline, branch e higiene pre-implementacao

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Preparar uma base controlada para as correcoes de producao, sem alterar comportamento da aplicacao.

Leia primeiro:
- PLANO_TRABALHO_PRODUCAO_ALTA_CONVERSAO_2026-09-06.md
- PLANO_CORRECOES_POS_AUDITORIA_2026-09-05.md
- PLANEJAMENTO.md, apenas como historico
- package.json
- migrations do Supabase

Tarefas:
1. Verificar `git status --short --branch` e registrar se ha mudancas pendentes.
2. Criar uma branch de trabalho com nome claro, por exemplo `fix/producao-p0-cardapio`, se ainda nao existir branch dedicada.
3. Mapear variaveis de ambiente usadas pelo projeto, sem expor valores.
4. Identificar documentos versionados que contenham credenciais, senhas, tokens ou acessos operacionais.
5. Criar ou atualizar um checklist local de release/staging, se ja existir padrao no repo.
6. Nao alterar codigo funcional nesta etapa.

Testes/validacoes obrigatorias:
- `git status --short --branch`
- `npm run lint`
- `npm test -- --run`
- `npm run build`

Entrega esperada:
- Resumo do baseline.
- Lista de env vars obrigatorias por ambiente, sem valores.
- Lista de possiveis segredos em documentos, se houver.
- Resultado dos testes.

Commit/push:
- Nao fazer push se houver credenciais em arquivos versionados.
- Se apenas documentacao/checklist seguro foi alterado e os testes passaram, criar commit:
  `chore: prepare production remediation baseline`
- Fazer push da branch para o GitHub somente depois do commit:
  `git push -u origin fix/producao-p0-cardapio`
```

### Prompt 1 - Checkout server-authoritative e pedido confiavel

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Corrigir o fluxo critico de pedido para que preco, promocao, cupom, disponibilidade e taxa sejam calculados no servidor, e para que o WhatsApp use o mesmo pedido salvo no banco.

Leia primeiro:
- app/(storefront)/carrinho/enviar/page.tsx
- features/orders/createOrder.ts
- features/whatsapp/buildServerOrder.ts
- features/whatsapp/formatOrder.ts
- app/api/whatsapp/send/route.ts
- features/cart/CartContext.tsx
- features/promotions/usePromotions.ts
- migrations relacionadas a orders, products, options, promotions e coupons
- tests/unit existentes relacionados a cart, pricing, promotions e orders

Tarefas:
1. Remover a dependencia de dados de preco vindos do cliente para gravacao de pedido.
2. Fazer o cliente enviar somente IDs, quantidades e escolhas do usuario.
3. No servidor, recarregar produtos, opcoes, promocoes, cupons, loja e regras de entrega.
4. Calcular subtotal, descontos, taxa e total exclusivamente no servidor.
5. Validar produto ativo/disponivel, secao ativa, opcoes permitidas, cupom e limites de quantidade.
6. Garantir um unico codigo de pedido/carrinho para banco, WhatsApp e analytics.
7. Garantir idempotencia real com constraint unica ou controle equivalente.
8. Impedir envio final para WhatsApp quando o pedido nao puder ser salvo.
9. Corrigir persistencia de `order_items` para refletir preco final, extras, descontos e total de forma consistente.
10. Preservar UX mobile e estados de erro/retry.

Testes obrigatorios:
- Unitario: preco adulterado no payload do cliente nao altera total final.
- Unitario: produto indisponivel bloqueia pedido.
- Unitario: opcao/adicional invalido bloqueia pedido.
- Unitario: cupom valido aplica desconto correto.
- Unitario: cupom invalido/expirado nao aplica desconto e retorna erro claro.
- Unitario: entrega e retirada calculam totais corretos.
- Unitario: mesma idempotency key/cart id nao duplica pedido.
- E2E: usuario adiciona produto, aplica cupom, finaliza e abre WhatsApp com mesmo codigo do pedido.
- E2E: falha ao salvar pedido nao dispara WhatsApp.

Comandos obrigatorios:
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`

Entrega esperada:
- Arquivos alterados.
- Explicacao do novo contrato entre cliente e servidor.
- Evidencia de que preco final e calculado no servidor.
- Resultado dos testes.
- Riscos pendentes, se houver.

Commit/push:
- Se todos os testes passarem, criar commit:
  `fix: make checkout order creation server authoritative`
- Fazer push para a branch remota.
- Se algum teste nao passar, nao fazer push; reportar bloqueio e causa.
```

### Prompt 2 - Status da loja e regras de entrega via banco

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Conectar loja aberta/fechada, pausas manuais, horarios especiais e regras de entrega ao banco, eliminando logica hardcoded ou divergente no cliente.

Leia primeiro:
- lib/storeStatus.ts
- features/storeStatus, se existir
- features/cart/StoreContext.tsx
- components/storefront/StoreClosedBanner.tsx
- app/admin/(authenticated)/actions.ts
- telas admin relacionadas a horarios/status/overrides
- migrations de stores, business_hours e store_overrides
- tests/unit/storeStatus.test.ts

Tarefas:
1. Criar ou consolidar um servico unico de status da loja.
2. Usar timezone da loja.
3. Considerar `business_hours`, `store_overrides`, pausa manual, abertura excepcional e fechamento excepcional.
4. Fazer storefront, checkout e admin consumirem a mesma regra.
5. Persistir alteracoes do admin e refletir no storefront.
6. Mover taxa/area/tempo de entrega para regra server-side ou configuracao confiavel.
7. Bloquear ou orientar checkout quando a loja estiver fechada, conforme regra do negocio.

Testes obrigatorios:
- Unitario: loja aberta em horario normal.
- Unitario: loja fechada fora do horario.
- Unitario: pausa manual fecha a loja.
- Unitario: abertura excepcional abre fora do horario comum.
- Unitario: fechamento excepcional fecha dentro do horario comum.
- Unitario: timezone nao desloca indevidamente o resultado.
- E2E: banner de loja fechada aparece e checkout respeita bloqueio.
- E2E: alteracao no admin muda o estado publico esperado.

Comandos obrigatorios:
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`

Entrega esperada:
- Descricao da regra final de status.
- Arquivos alterados.
- Resultado dos testes.
- Casos de borda ainda nao cobertos.

Commit/push:
- Se todos os testes passarem, criar commit:
  `fix: use database backed store status and delivery rules`
- Fazer push para a branch remota.
- Se houver falha de teste, nao fazer push; reportar o motivo.
```

### Prompt 3 - Admin seguro, RLS e updates parciais confiaveis

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Corrigir riscos do painel administrativo, impedir edicoes fora da loja do admin e evitar perda acidental de campos em updates parciais.

Leia primeiro:
- app/admin/(authenticated)/actions.ts
- app/admin/(authenticated)/produtos/ProductsList.tsx
- app/admin/(authenticated)/produtos/edicao-em-massa/BulkEditor.tsx
- middleware.ts
- migrations 001, 004 e demais politicas RLS
- testes existentes de admin, se houver

Tarefas:
1. Corrigir edicao inline de preco para nao limpar descricao, badge ou flags.
2. Garantir que updates parciais preservem campos ausentes.
3. Aplicar escopo por `store_id` em updates, deletes e bulk actions.
4. Revisar policies RLS para admin ativo nao operar dados de outra loja.
5. Adicionar validacoes de preco, disponibilidade, ordem, imagens, cupons e promocoes onde aplicavel.
6. Melhorar feedback de erro/sucesso em acoes destrutivas.
7. Adicionar confirmacao para exclusoes e acoes em massa, se ainda nao existir.
8. Garantir admin noindex e protecao de rota.

Testes obrigatorios:
- Unitario/integracao: update de preco nao altera descricao nem flags.
- Unitario/integracao: admin de uma loja nao atualiza produto de outra loja.
- Unitario/integracao: bulk update respeita `store_id`.
- Unitario/integracao: delete de override respeita `store_id`.
- E2E: admin edita preco e produto continua ativo/disponivel conforme estado anterior.
- E2E: fluxo basico de login/admin/produtos continua funcional.

Comandos obrigatorios:
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`

Entrega esperada:
- Lista de politicas/actions revisadas.
- Arquivos alterados.
- Evidencia dos testes de escopo por loja.
- Riscos pendentes.

Commit/push:
- Se todos os testes passarem, criar commit:
  `fix: harden admin updates and store scoped permissions`
- Fazer push para a branch remota.
- Se houver migration, destacar necessidade de aplicar em staging antes de producao.
```

### Prompt 4 - Dependencias, headers e hardening de seguranca

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Remover vulnerabilidades criticas/altas conhecidas, limpar configuracoes obsoletas e fortalecer a aplicacao para ambiente publico.

Leia primeiro:
- package.json
- package-lock.json
- next.config.js
- middleware.ts
- rotas em app/api
- uso de variaveis NEXT_PUBLIC e server-only
- relatorio anterior de npm audit, se existir

Tarefas:
1. Rodar `npm audit --audit-level=low` para confirmar vulnerabilidades atuais.
2. Atualizar Next.js e dependencias necessarias com menor impacto possivel.
3. Remover configuracao obsoleta `experimental.serverActions`, se aplicavel.
4. Revisar `remotePatterns` para permitir apenas hosts necessarios.
5. Adicionar ou ajustar headers: CSP adequada, HSTS em producao, referrer policy, permissions policy e nosniff.
6. Verificar que chaves server-side nao entram no bundle cliente.
7. Propor rate limiting/protecao para checkout, cupom, analytics, upload e WhatsApp. Implementar se houver padrao no projeto.
8. Garantir que logs nao exponham dados sensiveis.

Testes obrigatorios:
- `npm audit --audit-level=high`
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`
- Verificacao manual ou automatizada dos headers em ambiente local/staging.

Entrega esperada:
- Dependencias atualizadas e motivo.
- Vulnerabilidades restantes, se houver, com justificativa.
- Headers finais.
- Resultado dos testes.

Commit/push:
- Se build/testes passarem e nao houver high/critical sem justificativa, criar commit:
  `chore: harden production security configuration`
- Fazer push para a branch remota.
- Se update de dependencia quebrar fluxo critico, nao fazer push; reportar rollback ou alternativa.
```

### Prompt 5 - Conversao, conteudo visual e UX mobile

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Melhorar a experiencia de compra mobile e preparar o cardapio para converter melhor, sem comprometer a estabilidade tecnica ja corrigida.

Leia primeiro:
- componentes storefront principais
- ProductCard, ProductModal, CartBar, Header, Footer, CouponInput, StoreClosedBanner
- paginas de carrinho, identificacao e envio
- configuracao de imagens e dados de produtos
- testes E2E/visuais existentes

Tarefas:
1. Priorizar primeira dobra mobile com produtos e CTAs claros.
2. Garantir que produtos principais tenham suporte correto a fotos reais, alt text e fallback elegante.
3. Melhorar clareza de preco, promocao, adicionais e disponibilidade.
4. Reduzir friccao no carrinho e checkout.
5. Criar ou melhorar estado de sucesso apos envio ao WhatsApp, com codigo do pedido.
6. Garantir estados de loading, erro, vazio e loja fechada bem resolvidos.
7. Validar responsividade em 360, 390, 430, 768, 1024 e 1366px.
8. Nao transformar a pagina em landing page; manter experiencia de compra como primeira tela.

Testes obrigatorios:
- E2E: adicionar produto simples.
- E2E: produto com adicionais obrigatorios/opcionais.
- E2E: carrinho vazio.
- E2E: cupom aplicado e removido.
- E2E: checkout mobile completo.
- E2E: estado de loja fechada.
- Visual/responsivo: 360, 390, 430, 768, 1024, 1366px sem overlap de textos/botoes.
- Acessibilidade basica: foco visivel, navegacao por teclado em modal e botoes principais.

Comandos obrigatorios:
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`

Entrega esperada:
- Alteracoes de UX/conversao feitas.
- Evidencias de telas/responsividade, se a stack permitir screenshots.
- Resultado dos testes.
- Pontos recomendados para fotos/conteudo real que dependem do negocio.

Commit/push:
- Se testes passarem, criar commit:
  `feat: improve storefront conversion and mobile checkout`
- Fazer push para a branch remota.
```

### Prompt 6 - Analytics, SEO local e performance

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Garantir que a aplicacao seja mensuravel, rapida em mobile e preparada para trafego organico/local e campanhas.

Leia primeiro:
- configuracoes de metadata/SEO
- componentes de analytics existentes
- rotas e paginas publicas
- next.config.js
- uso de imagens
- testes relacionados a analytics, se houver

Tarefas:
1. Revisar metadata, Open Graph, canonical, robots e sitemap.
2. Garantir admin noindex.
3. Validar eventos principais: view_item, add_to_cart, begin_checkout, coupon_apply, order_created/order_sent.
4. Deduplicar eventos entre cliente, servidor e WhatsApp.
5. Padronizar IDs: order code, cart id, transaction id.
6. Otimizar LCP, CLS e INP, especialmente mobile.
7. Revisar queries e bundle inicial do storefront.
8. Padronizar UTMs e preservar origem no checkout/eventos, se ja houver suporte.

Testes obrigatorios:
- Unitario: eventos recebem IDs consistentes.
- Unitario: eventos nao duplicam no fluxo principal.
- E2E: fluxo completo dispara eventos esperados, com mocks quando necessario.
- Build analise: verificar warnings e tamanho de bundle, se o projeto tiver ferramenta.
- Lighthouse ou equivalente em mobile para pagina inicial e checkout, se disponivel.

Comandos obrigatorios:
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`

Entrega esperada:
- Mapa dos eventos implementados/validados.
- Resultado de performance.
- Arquivos alterados.
- Resultado dos testes.

Commit/push:
- Se validacoes passarem, criar commit:
  `feat: validate analytics seo and mobile performance`
- Fazer push para a branch remota.
```

### Prompt 7 - QA final em staging e evidencia de release

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Validar a release candidata em staging antes de qualquer deploy em producao.

Pre-condicoes:
- Prompts 0 a 6 concluidos ou explicitamente dispensados.
- Branch remota atualizada.
- Ambiente de staging configurado.
- Migrations aplicadas em staging com backup previo, se houver migrations novas.

Tarefas:
1. Fazer deploy em staging ou preview.
2. Registrar URL, commit SHA e horario do deploy.
3. Aplicar migrations em staging, se houver.
4. Rodar smoke test manual e automatizado.
5. Validar storefront, produto, modal, carrinho, checkout, WhatsApp e admin.
6. Validar headers, robots/noindex admin e analytics.
7. Registrar evidencias em documento de release ou auditoria.
8. Corrigir qualquer P0/P1 antes de liberar producao.

Testes obrigatorios:
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`
- Smoke manual em staging:
  - abrir home
  - abrir produto
  - adicionar ao carrinho
  - aplicar cupom valido/invalido
  - finalizar pedido
  - conferir pedido salvo
  - conferir mensagem WhatsApp
  - acessar admin
  - editar preco sem alterar flags
  - alternar status da loja

Entrega esperada:
- Documento de evidencias com commit, URL, testes e resultado.
- Lista final de riscos.
- Recomendacao clara: GO ou NO-GO.

Commit/push:
- Se criar documento de evidencia, commit:
  `docs: add staging release evidence`
- Fazer push.
- Nao fazer merge para branch principal sem revisao humana.
```

### Prompt 8 - Deploy controlado em producao

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Publicar em producao somente uma release validada, com rollback e verificacao pos-deploy.

Pre-condicoes obrigatorias:
- QA final em staging com GO.
- Commit SHA aprovado.
- Backup do banco realizado.
- Migrations revisadas.
- Plano de rollback definido.
- Nenhum P0/P1 aberto.

Tarefas:
1. Confirmar branch/commit exato a ser publicado.
2. Fazer merge ou promocao conforme fluxo do projeto.
3. Aplicar migrations em producao, se houver, com backup previo.
4. Fazer deploy de producao.
5. Registrar URL, commit SHA, horario e responsavel.
6. Rodar smoke test pos-deploy.
7. Validar que producao aponta para o commit aprovado.
8. Monitorar logs de checkout, WhatsApp, Supabase e analytics.
9. Se houver falha P0, acionar rollback.

Testes obrigatorios pos-deploy:
- Home publica 200.
- Produto/modal funcionando.
- Carrinho funcionando.
- Checkout salva pedido.
- WhatsApp recebe dados corretos.
- Admin protegido por login.
- Edicao admin basica funcionando.
- Headers de seguranca presentes.
- Analytics recebendo eventos sem duplicidade obvia.

Entrega esperada:
- Relatorio de deploy com GO/NO-GO pos-producao.
- Evidencias dos smoke tests.
- Riscos residuais.
- Proximas acoes comerciais.

Commit/push:
- Push ja deve ter ocorrido antes do deploy.
- Apos deploy, se apenas documento de release for atualizado, commit:
  `docs: record production release`
- Fazer push.
```

### Prompt 9 - Soft launch e melhoria por dados

```text
Voce esta trabalhando no projeto Tremelikos em /opt/tremelikos.

Objetivo desta etapa:
Acompanhar os primeiros pedidos reais e transformar dados em melhorias de conversao.

Pre-condicoes:
- Producao com GO pos-deploy.
- Analytics validado.
- Operacao pronta para receber pedidos no WhatsApp.

Tarefas:
1. Monitorar primeiros pedidos reais.
2. Conferir divergencia entre banco, WhatsApp e atendimento.
3. Medir funil: view_item, add_to_cart, begin_checkout, order_sent.
4. Identificar abandono de carrinho e pontos de friccao.
5. Revisar produtos mais vistos sem compra.
6. Priorizar melhorias de fotos, nomes, descricoes, ordem dos produtos, combos e cupons.
7. Nao iniciar trafego pago forte antes de estabilidade operacional.

Validacoes obrigatorias:
- Pelo menos 3 pedidos reais ou simulados assistidos de ponta a ponta.
- Nenhuma divergencia de total entre banco e WhatsApp.
- Nenhum erro critico de checkout nos logs.
- Eventos principais chegando nas ferramentas configuradas.

Entrega esperada:
- Relatorio de soft launch.
- Lista priorizada de melhorias de conversao.
- Recomendacao: escalar trafego, manter soft launch ou voltar para correcao.

Commit/push:
- Se houver apenas relatorio, commit:
  `docs: add soft launch findings`
- Para mudancas de codigo, abrir commits separados por melhoria.
```

## 9. Como controlar a execucao comigo

Depois que o Kilo Code concluir cada prompt, envie para revisao:

- Nome do prompt executado.
- Commit SHA, se houve commit.
- Link/branch do GitHub, se houve push.
- Lista de arquivos alterados.
- Saida resumida dos testes.
- Pontos que o Kilo Code marcou como risco ou duvida.

Eu devo revisar cada entrega como auditoria tecnica, conferindo:

- Se o escopo da fase foi respeitado.
- Se nao houve regressao funcional.
- Se os testes realmente cobrem o risco principal.
- Se o codigo segue os padroes do projeto.
- Se a fase pode receber GO para a proxima etapa.
