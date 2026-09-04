'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AdminSignOutButton from '@/components/admin/AdminSignOutButton';
import { Icon } from '@/components/ui';
import type { SVGProps } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: (p: SVGProps<SVGSVGElement>) => JSX.Element;
  match?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: Icon.chart, match: (p) => p === '/admin' },
  { href: '/admin/produtos', label: 'Produtos', icon: Icon.store, match: (p) => p.startsWith('/admin/produtos') },
  { href: '/admin/produtos/edicao-em-massa', label: 'Edição em massa', icon: Icon.package },
  { href: '/admin/secoes', label: 'Seções', icon: Icon.list },
  { href: '/admin/opcoes', label: 'Adicionais', icon: Icon.plus },
  { href: '/admin/promocoes', label: 'Promoções', icon: Icon.tag },
  { href: '/admin/cupons', label: 'Cupons', icon: Icon.ticket },
  { href: '/admin/midia', label: 'Mídia', icon: Icon.image },
  { href: '/admin/desempenho', label: 'Desempenho', icon: Icon.chart },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Icon.cog, match: (p) => p.startsWith('/admin/configuracoes') },
  { href: '/admin/audit', label: 'Auditoria', icon: Icon.audit },
];

export default function AdminSidebar({
  email,
  role,
  status,
}: {
  email: string;
  role: string;
  status: { isOpen: boolean; label: string; tone: 'success' | 'warning' | 'danger' };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (item: NavItem) => {
    if (item.match) return item.match(pathname);
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const toneClass =
    status.tone === 'success' ? 'pill-success' :
    status.tone === 'warning' ? 'pill-warning' :
    'pill-danger';

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-30 w-12 h-12 rounded-full bg-brand text-white shadow-card-hover grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        aria-label="Abrir menu"
      >
        <Icon.menu size={22} />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-app-surface shadow-modal overflow-y-auto animate-slide-up">
            {renderContent({ collapsed: false, onClose: () => setMobileOpen(false) })}
          </aside>
        </div>
      )}

      <aside
        className={[
          'hidden md:block bg-app-surface border-r border-app-border min-h-screen transition-all',
          collapsed ? 'md:w-16' : 'md:w-64',
        ].join(' ')}
        aria-label="Menu administrativo"
      >
        {renderContent({ collapsed, onCollapse: () => setCollapsed((v) => !v) })}
      </aside>
    </>
  );

  function renderContent({
    collapsed,
    onClose,
    onCollapse,
  }: {
    collapsed: boolean;
    onClose?: () => void;
    onCollapse?: () => void;
  }) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-app-border">
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-extrabold text-ink truncate text-base">Tremeliko&apos;s Admin</p>
                <p className="text-xs text-ink-muted truncate">{email}</p>
                <span className="inline-block mt-1 pill pill-brand uppercase tracking-wide">
                  {role}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {onCollapse && (
                <button
                  type="button"
                  onClick={onCollapse}
                  className="w-9 h-9 rounded-md hover:bg-app-bg grid place-items-center text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? '»' : '«'}
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-md hover:bg-app-bg grid place-items-center text-ink md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Fechar menu"
                >
                  <Icon.close size={18} />
                </button>
              )}
            </div>
          </div>
          {!collapsed && (
            <div
              className={['mt-3 pill', toneClass].join(' ')}
              title="Status do cardápio"
            >
              <span
                className={[
                  'w-1.5 h-1.5 rounded-full',
                  status.tone === 'success' ? 'bg-success' :
                  status.tone === 'warning' ? 'bg-warning' :
                  'bg-danger',
                ].join(' ')}
                aria-hidden="true"
              />
              {status.label}
            </div>
          )}
        </div>

        <nav
          className="flex-1 p-2 space-y-1 overflow-y-auto"
          aria-label="Navegação principal"
        >
          {NAV.map((item) => {
            const active = isActive(item);
            const IconEl = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={[
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
                  active
                    ? 'bg-brand-soft text-brand-text font-semibold'
                    : 'text-ink hover:bg-app-bg',
                ].join(' ')}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand rounded-r"
                  />
                )}
                <IconEl
                  width={18}
                  height={18}
                  className="shrink-0"
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-app-border space-y-1">
          <AdminSignOutButton collapsed={collapsed} />
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-ink hover:bg-app-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            title="Ver cardápio"
          >
            <Icon.eye width={18} height={18} className="shrink-0" />
            {!collapsed && <span>Ver cardápio</span>}
          </Link>
        </div>
      </div>
    );
  }
}
