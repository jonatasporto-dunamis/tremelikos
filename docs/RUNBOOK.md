# Runbook Operacional — Tremeliko's Burguer

Documento vivo. Última atualização: 2026-09-03.

## 1. Backups (13.3.2)

### 1.1 Banco de dados (Supabase)

- **Supabase** faz dump automático diário. Retenção: 7 dias (plano Free) / 30 dias (Pro).
- **Backup extra local** (cron diário, 04:00 BRT):
  ```bash
  pg_dump "postgresql://postgres:[PASSWORD]@db.xsrkvfrqdchkgdejvgbx.supabase.co:5432/postgres" \
    --no-owner --no-privileges -Fc \
    -f /var/backups/supabase/tremelikos-$(date +\%Y\%m\%d).dump
  ```
- Retenção local: 14 dias (`find /var/backups/supabase -mtime +14 -delete`).
- Armazenar também em S3 / B2 (fora do VPS) — **pendente configurar**.

### 1.2 Imagens (bucket Supabase Storage)

- Bucket `product-images`: replicação do Supabase já abrange.
- Backup manual via API:
  ```bash
  supabase storage download product-images --recursive /var/backups/storage-$(date +%Y%m%d)
  ```

### 1.3 Restaurar (drill a cada 90 dias)

```bash
createdb tremelikos_restore
pg_restore -d tremelikos_restore /var/backups/supabase/tremelikos-20260901.dump
```

## 2. Monitoramento (13.3.3)

### 2.1 Healthcheck interno

Endpoint: `https://tremelikos.growthpulse.com.br/api/health` (a ser criado).
Retorna 200 com `{"ok":true,"db":"up","uptime":...}`.

### 2.2 Uptime externo

- **UptimeRobot** (free): checa `https://tremelikos.growthpulse.com.br/` a cada 5 min.
- Alerta por e-mail/WhatsApp se 2 falhas consecutivas.

### 2.3 Logs

- Container Next.js: `docker logs -f tremelikos-app-1 --tail 200`
- PM2 (legado): `pm2 logs tremelikos`
- Retenção: rotação via `logrotate` em `/etc/logrotate.d/tremelikos` (15 dias, comprimir gzip).

### 2.4 Métricas-chave

| Métrica | Alvo | Alerta |
|---|---|---|
| Uptime | ≥99% | <99% 24h |
| Latência P95 | <800ms | >1.5s |
| LCP (Lighthouse) | <2.5s | >3s |
| Taxa de erro 5xx | <0.5% | >1% |
| Pedidos/hora | baseline | -50% vs 7d |

## 3. Cost alerts (13.3.4)

### 3.1 Supabase

- **DB size**: alertar em 80% do limite (Free: 500MB, Pro: 8GB).
- **Bandwidth**: alertar em 80% do limite (Free: 2GB, Pro: 250GB).
- **Storage**: alertar em 80% do limite (Free: 1GB, Pro: 100GB).
- Configurar em Supabase → Settings → Billing → Usage emails.

### 3.2 Vercel (se migrar)

- Limite mensal: US$20.
- Alerta em 50%, 80%, 100%.

### 3.3 VPS (Hostinger)

- Plano atual: KVM 2 (4GB RAM, 2 vCPU).
- Custo: ~R$ 35/mês.
- Banda: 8TB/mês — alerta se uso > 6TB.

### 3.4 Domínio + e-mail

- `growthpulse.com.br` (registro.br): R$ 40/ano — renovações em 11/2026.
- Cloudflare proxy: free.

## 4. Incident Response

### 4.1 Site fora do ar

1. `curl -I https://tremelikos.growthpulse.com.br/` — confirmar 5xx.
2. `ssh vps "docker ps -a"` — ver estado dos containers.
3. `ssh vps "docker logs --tail 100 tremelikos-app-1"`.
4. Se DB down: verificar status Supabase.
5. Se necessário: `docker compose --env-file .env.local up -d --build app`.

### 4.2 Pedido não chega no WhatsApp

1. Verificar WAHA: `curl -u $WAHA_API_KEY $WAHA_API_URL/api/sessions/tremelikos`.
2. Estado deve ser `WORKING`. Reiniciar se `FAILED`.
3. `pm2 restart waha` ou `docker restart waha`.
4. Verificar logs: `docker logs waha`.

### 4.3 Falso-positivo de fraude (admin)

1. Admin abre `/admin/pedidos/[id]`.
2. Botão "Liberar pedido" remove flag de fraude.
3. Notificar cliente via WhatsApp.

## 5. Releases

- Branch `master` é produção.
- PR de feature → revisão → merge → CI/CD auto-deploy.
- Tags semânticas: `v1.0.0` (12/2025), `v1.1.0` (fase 9), `v1.2.0` (fase 13).
