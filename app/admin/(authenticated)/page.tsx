import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    { data: products },
    { data: sections },
    { data: promos },
    { data: coupons },
    { data: productImages },
    { data: recentAudit },
  ] = await Promise.all([
    supabaseAdmin.from('products').select('id, name, base_price, available, active, featured, badge, updated_at, section_products(section_id)'),
    supabaseAdmin.from('sections').select('id, name, position, active').order('position'),
    supabaseAdmin.from('promotions').select('id, name, type, value, active, starts_at, ends_at, priority'),
    supabaseAdmin.from('coupons').select('id, code, active, ends_at, current_redemptions, max_redemptions'),
    supabaseAdmin.from('product_images').select('product_id'),
    supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8),
  ]);

  // 11.2.1 — status do cardápio
  const allProducts = products || [];
  const total = allProducts.length;
  const active = allProducts.filter((p) => p.active).length;
  const available = allProducts.filter((p) => p.available).length;
  const unavailable = active - available;
  const featured = allProducts.filter((p) => p.featured).length;
  const inactives = total - active;

  const productsWithoutImage = allProducts.filter(
    (p) => !(productImages || []).some((img) => img.product_id === p.id)
  );

  const now = Date.now();
  const promoActive = (promos || []).filter((p) => {
    if (!p.active) return false;
    if (p.starts_at && new Date(p.starts_at).getTime() > now) return false;
    if (p.ends_at && new Date(p.ends_at).getTime() < now) return false;
    return true;
  });
  const promoExpiringSoon = (promos || []).filter((p) => {
    if (!p.ends_at) return false;
    const diff = new Date(p.ends_at).getTime() - now;
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  });
  const couponExhausted = (coupons || []).filter(
    (c) => c.max_redemptions && c.current_redemptions >= c.max_redemptions
  );

  // 11.2.6 — alertas de qualidade
  const qualityAlerts: Array<{ tone: 'warning' | 'danger' | 'info'; text: string; href: string }> = [];
  if (productsWithoutImage.length > 0) {
    qualityAlerts.push({
      tone: 'warning',
      text: `${productsWithoutImage.length} produto(s) sem imagem`,
      href: '/admin/produtos',
    });
  }
  if (unavailable > 0) {
    qualityAlerts.push({
      tone: 'info',
      text: `${unavailable} produto(s) ativo(s) mas indisponível(is) hoje`,
      href: '/admin/produtos',
    });
  }
  if (promoExpiringSoon.length > 0) {
    qualityAlerts.push({
      tone: 'warning',
      text: `${promoExpiringSoon.length} promoção(ões) expiram em <7 dias`,
      href: '/admin/promocoes',
    });
  }
  if (couponExhausted.length > 0) {
    qualityAlerts.push({
      tone: 'danger',
      text: `${couponExhausted.length} cupom(ns) esgotado(s)`,
      href: '/admin/cupons',
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Visão geral</h1>
      <p className="text-sm text-gray-500 mb-6">Saúde do cardápio e ações rápidas.</p>

      {/* 11.2.1 status do cardápio + 11.2.2 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={total} href="/admin/produtos" tone="default" />
        <StatCard label="Disponíveis" value={available} href="/admin/produtos" tone="success" />
        <StatCard label="Indisponíveis" value={unavailable} href="/admin/produtos" tone="warning" />
        <StatCard label="Destaques" value={featured} href="/admin/produtos" tone="default" />
      </div>

      {/* 11.2.3 Promoções + cupons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Panel title="Promoções ativas" href="/admin/promocoes">
          <p className="text-3xl font-bold text-brand">{promoActive.length}</p>
          {promoExpiringSoon.length > 0 && (
            <p className="text-xs text-amber-700 mt-1">
              ⚠️ {promoExpiringSoon.length} expiram em &lt; 7 dias
            </p>
          )}
        </Panel>
        <Panel title="Cupons" href="/admin/cupons">
          <p className="text-3xl font-bold text-brand">{(coupons || []).filter((c) => c.active).length}</p>
          {couponExhausted.length > 0 && (
            <p className="text-xs text-red-700 mt-1">
              🚫 {couponExhausted.length} esgotado(s)
            </p>
          )}
        </Panel>
        <Panel title="Seções" href="/admin/secoes">
          <p className="text-3xl font-bold text-brand">{(sections || []).filter((s) => s.active).length}</p>
          <p className="text-xs text-gray-500 mt-1">{(sections || []).length} no total</p>
        </Panel>
      </div>

      {/* 11.2.4 Atalhos rápidos + 11.2.5 Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link
          href="/admin/produtos/novo"
          className="rounded-xl bg-brand text-white p-4 hover:bg-brand-hover transition-colors min-h-[80px] flex flex-col"
        >
          <span className="text-2xl" aria-hidden="true">➕</span>
          <span className="font-semibold mt-1 text-sm">Adicionar produto</span>
        </Link>
        <Link
          href="/admin/produtos/edicao-em-massa"
          className="rounded-xl bg-white border border-gray-200 p-4 hover:border-brand hover:shadow-sm transition-all min-h-[80px] flex flex-col"
        >
          <span className="text-2xl" aria-hidden="true">📦</span>
          <span className="font-semibold text-gray-900 mt-1 text-sm">Edição em massa</span>
        </Link>
        <Link
          href="/admin/promocoes"
          className="rounded-xl bg-white border border-gray-200 p-4 hover:border-brand hover:shadow-sm transition-all min-h-[80px] flex flex-col"
        >
          <span className="text-2xl" aria-hidden="true">🏷️</span>
          <span className="font-semibold text-gray-900 mt-1 text-sm">Criar promoção</span>
        </Link>
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="rounded-xl bg-white border border-gray-200 p-4 hover:border-brand hover:shadow-sm transition-all min-h-[80px] flex flex-col"
        >
          <span className="text-2xl" aria-hidden="true">👀</span>
          <span className="font-semibold text-gray-900 mt-1 text-sm">Preview do cardápio ↗</span>
        </Link>
      </div>

      {/* 11.2.6 — Alertas de qualidade */}
      {qualityAlerts.length > 0 && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-bold text-gray-900 mb-2">⚠️ Alertas de qualidade</h2>
          <ul className="space-y-1">
            {qualityAlerts.map((a, i) => (
              <li key={i}>
                <Link
                  href={a.href}
                  className={`text-sm hover:underline ${
                    a.tone === 'danger' ? 'text-red-700' :
                    a.tone === 'warning' ? 'text-amber-700' :
                    'text-blue-700'
                  }`}
                >
                  {a.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 11.2.7 — últimos eventos do audit */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">📋 Últimas ações</h2>
          <Link href="/admin/audit" className="text-xs text-brand-text hover:underline">
            Ver tudo →
          </Link>
        </div>
        {recentAudit && recentAudit.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recentAudit.map((log: any) => (
              <li key={log.id} className="p-3 flex items-center gap-3 text-sm">
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span className="font-mono text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                  {log.action}
                </span>
                <span className="text-gray-700 truncate flex-1">
                  {log.entity}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-gray-500">Nenhuma ação registrada ainda.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href, tone }: {
  label: string; value: number; href: string; tone: 'default' | 'success' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'success' ? 'text-green-700' :
    tone === 'warning' ? 'text-amber-700' :
    tone === 'danger' ? 'text-red-700' :
    'text-gray-900';
  return (
    <Link href={href} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand hover:shadow-sm transition-all min-h-[80px]">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </Link>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand hover:shadow-sm transition-all">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      {children}
    </Link>
  );
}
