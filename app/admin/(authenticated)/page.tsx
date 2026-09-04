import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Icon } from '@/components/ui';

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
      <header className="mb-6">
        <h1 className="text-h1 text-ink">Visão geral</h1>
        <p className="text-sm text-ink-muted mt-1">Saúde do cardápio e ações rápidas.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={total} href="/admin/produtos" tone="default" />
        <StatCard label="Disponíveis" value={available} href="/admin/produtos" tone="success" />
        <StatCard label="Indisponíveis" value={unavailable} href="/admin/produtos" tone="warning" />
        <StatCard label="Destaques" value={featured} href="/admin/produtos" tone="default" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Panel title="Promoções ativas" href="/admin/promocoes">
          <p className="text-3xl font-bold text-brand tabular-nums">{promoActive.length}</p>
          {promoExpiringSoon.length > 0 && (
            <p className="text-xs text-warning mt-1 font-medium">
              {promoExpiringSoon.length} expiram em &lt; 7 dias
            </p>
          )}
        </Panel>
        <Panel title="Cupons" href="/admin/cupons">
          <p className="text-3xl font-bold text-brand tabular-nums">{(coupons || []).filter((c) => c.active).length}</p>
          {couponExhausted.length > 0 && (
            <p className="text-xs text-danger mt-1 font-medium">
              {couponExhausted.length} esgotado(s)
            </p>
          )}
        </Panel>
        <Panel title="Seções" href="/admin/secoes">
          <p className="text-3xl font-bold text-brand tabular-nums">{(sections || []).filter((s) => s.active).length}</p>
          <p className="text-xs text-ink-muted mt-1">{(sections || []).length} no total</p>
        </Panel>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <QuickAction
          href="/admin/produtos/novo"
          icon={<Icon.plus2 size={22} />}
          label="Adicionar produto"
          tone="primary"
        />
        <QuickAction
          href="/admin/produtos/edicao-em-massa"
          icon={<Icon.package size={22} />}
          label="Edição em massa"
          tone="ghost"
        />
        <QuickAction
          href="/admin/promocoes"
          icon={<Icon.tag size={22} />}
          label="Criar promoção"
          tone="ghost"
        />
        <QuickAction
          href="/"
          icon={<Icon.eye size={22} />}
          label="Preview do cardápio"
          tone="ghost"
          external
        />
      </div>

      {qualityAlerts.length > 0 && (
        <div className="mb-6 card p-4">
          <h2 className="font-bold text-ink mb-2 flex items-center gap-2">
            <Icon.warning size={18} className="text-warning" />
            Alertas de qualidade
          </h2>
          <ul className="space-y-1.5">
            {qualityAlerts.map((a, i) => (
              <li key={i}>
                <Link
                  href={a.href}
                  className={[
                    'text-sm hover:underline',
                    a.tone === 'danger' ? 'text-danger' :
                    a.tone === 'warning' ? 'text-warning' :
                    'text-info',
                  ].join(' ')}
                >
                  {a.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <h2 className="font-bold text-ink flex items-center gap-2">
            <Icon.audit size={18} className="text-ink-muted" />
            Últimas ações
          </h2>
          <Link href="/admin/audit" className="text-xs text-brand-text hover:underline">
            Ver tudo →
          </Link>
        </div>
        {recentAudit && recentAudit.length > 0 ? (
          <ul className="divide-y divide-app-border">
            {recentAudit.map((log: any) => (
              <li key={log.id} className="p-3 flex items-center gap-3 text-sm">
                <span className="text-ink-muted text-xs whitespace-nowrap tabular-nums">
                  {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span className="font-mono text-xs bg-app-bg text-ink px-1.5 py-0.5 rounded">
                  {log.action}
                </span>
                <span className="text-ink truncate flex-1">
                  {log.entity}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-ink-muted">Nenhuma ação registrada ainda.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href, tone }: {
  label: string; value: number; href: string; tone: 'default' | 'success' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'success' ? 'text-success' :
    tone === 'warning' ? 'text-warning' :
    tone === 'danger' ? 'text-danger' :
    'text-ink';
  return (
    <Link
      href={href}
      className="card p-4 hover:shadow-card-hover hover:border-brand transition-all min-h-touch-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={['text-2xl font-extrabold tabular-nums', toneClass].join(' ')}>{value}</p>
    </Link>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="card p-4 hover:shadow-card-hover hover:border-brand transition-all block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <p className="text-sm text-ink-muted mb-2">{title}</p>
      {children}
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
  tone,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone: 'primary' | 'ghost';
  external?: boolean;
}) {
  const base = 'rounded-md p-4 transition-all min-h-touch-lg flex items-center gap-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';
  const cls =
    tone === 'primary'
      ? 'bg-brand text-white hover:bg-brand-hover active:bg-brand-active'
      : 'card text-ink hover:border-brand hover:shadow-card-hover';
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className={[base, cls].join(' ')}
    >
      <span aria-hidden="true" className="shrink-0">{icon}</span>
      <span className="leading-tight">{label}</span>
    </Link>
  );
}
