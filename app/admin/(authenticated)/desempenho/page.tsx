import { supabaseAdmin } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const SINCE_DAYS = 30;

export default async function AdminDesempenhoPage({ searchParams }: {
  searchParams: Promise<{ since?: string }>;
}) {
  const sp = await searchParams;
  const days = Math.max(1, Math.min(180, Number(sp.since || SINCE_DAYS)));
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Funil baseado em analytics_events (server-side)
  const { data: events } = await supabaseAdmin
    .from('analytics_events')
    .select('event_name, value, session_id, user_id, items, created_at')
    .gte('created_at', sinceISO);

  const counts: Record<string, number> = {};
  const sessions: Set<string> = new Set();
  const users: Set<string> = new Set();
  const productAdd: Map<string, { name: string; add: number; buy: number }> = new Map();
  let totalValue = 0;
  let purchases = 0;

  for (const e of (events || []) as any[]) {
    counts[e.event_name] = (counts[e.event_name] || 0) + 1;
    if (e.session_id) sessions.add(e.session_id);
    if (e.user_id) users.add(e.user_id);
    if (e.event_name === 'purchase' || e.event_name === 'whatsapp_order') {
      purchases++;
      totalValue += Number(e.value || 0);
    }
    if (e.event_name === 'add_to_cart' && Array.isArray(e.items)) {
      for (const it of e.items) {
        const id = it.item_id;
        if (!id) continue;
        const cur = productAdd.get(id) || { name: it.item_name || id, add: 0, buy: 0 };
        cur.add += Number(it.quantity || 0);
        productAdd.set(id, cur);
      }
    }
    if ((e.event_name === 'purchase' || e.event_name === 'whatsapp_order') && Array.isArray(e.items)) {
      for (const it of e.items) {
        const id = it.item_id;
        if (!id) continue;
        const cur = productAdd.get(id) || { name: it.item_name || id, add: 0, buy: 0 };
        cur.buy += Number(it.quantity || 0);
        productAdd.set(id, cur);
      }
    }
  }

  const order = [
    'view_menu', 'search', 'view_item', 'view_item_list',
    'add_to_cart', 'begin_checkout', 'purchase', 'whatsapp_order', 'cart_abandon',
  ];
  const funnel = order
    .map((k) => ({ name: k, count: counts[k] || 0 }))
    .filter((f) => f.count > 0);
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));

  const topProducts = Array.from(productAdd.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.add - b.add)
    .slice(0, 10);

  // 11.8.6 — produtos com add sem purchase (oportunidade)
  const opportunities = Array.from(productAdd.entries())
    .map(([id, v]) => ({ id, ...v, opportunity: v.add - v.buy }))
    .filter((p) => p.opportunity > 0)
    .sort((a, b) => b.opportunity - a.opportunity)
    .slice(0, 5);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Desempenho</h1>
          <p className="text-sm text-ink-muted">
            Últimos <strong>{days}</strong> dias — {sessions.size} sessões, {users.size} usuários únicos, {purchases} pedidos, {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em vendas.
          </p>
        </div>
        <div className="flex gap-1 text-xs">
          {[7, 30, 60, 90].map((d) => (
            <Link
              key={d}
              href={`/admin/desempenho?since=${d}`}
              className={`px-3 py-2 rounded border ${days === d ? 'bg-brand text-white border-brand' : 'border-app-border hover:bg-app-bg'}`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      {/* 11.8.1 — funil */}
      <div className="bg-white border border-app-border rounded-xl p-4 mb-4">
        <h2 className="font-semibold text-ink mb-3">Funil de conversão</h2>
        <ul className="space-y-2">
          {funnel.map((f, i) => {
            const pct = (f.count / maxCount) * 100;
            return (
              <li key={f.name}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-32 sm:w-40 text-ink font-mono text-xs">{f.name}</span>
                  <div className="flex-1 bg-app-bg rounded h-6 relative overflow-hidden">
                    <div
                      className="h-full bg-brand rounded transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-brand-contrast">
                      {f.count}
                    </span>
                  </div>
                  {i > 0 && (
                    <span className="text-xs text-ink-muted w-14 text-right">
                      {((f.count / Math.max(1, funnel[i - 1].count)) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </li>
            );
          })}
          {funnel.length === 0 && (
            <p className="text-sm text-ink-muted">Nenhum evento registrado no período.</p>
          )}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 11.8.4 — top produtos */}
        <div className="bg-white border border-app-border rounded-xl p-4">
          <h2 className="font-semibold text-ink mb-3">🏆 Top 10 produtos (add to cart)</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink-muted">Sem dados de add_to_cart ainda.</p>
          ) : (
            <ol className="space-y-1">
              {topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-ink-muted font-mono">{i + 1}.</span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs font-semibold text-ink">{p.add}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* 11.8.6 — oportunidades */}
        <div className="bg-white border border-app-border rounded-xl p-4">
          <h2 className="font-semibold text-ink mb-3">💡 Oportunidades (add sem purchase)</h2>
          {opportunities.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhum produto com abandono alto.</p>
          ) : (
            <ol className="space-y-1">
              {opportunities.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs">
                    <span className="text-ink-muted">{p.add} add</span>
                    {' → '}
                    <span className="text-amber-700 font-semibold">{p.opportunity} abandonados</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-muted mt-2">
        Os eventos do funil são coletados via <code className="bg-app-bg px-1 rounded">/api/analytics/events</code> (server-side). Para funil completo com view_menu/search, integre o GA4 com looker/dashboard externo.
      </p>
    </div>
  );
}
