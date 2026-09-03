'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AdminSignOutButton from '@/components/admin/AdminSignOutButton';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  match?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '📊', match: (p) => p === '/admin' },
  { href: '/admin/produtos', label: 'Produtos', icon: '🍔', match: (p) => p.startsWith('/admin/produtos') },
  { href: '/admin/produtos/edicao-em-massa', label: 'Edição em massa', icon: '📦' },
  { href: '/admin/secoes', label: 'Seções', icon: '📂' },
  { href: '/admin/opcoes', label: 'Adicionais', icon: '➕' },
  { href: '/admin/promocoes', label: 'Promoções', icon: '🏷️' },
  { href: '/admin/cupons', label: 'Cupons', icon: '🎟️' },
  { href: '/admin/midia', label: 'Mídia', icon: '🖼️' },
  { href: '/admin/desempenho', label: 'Desempenho', icon: '📈' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙️', match: (p) => p.startsWith('/admin/configuracoes') },
  { href: '/admin/audit', label: 'Auditoria', icon: '📋' },
];

export default function AdminSidebar({ email, role, status }: {
  email: string;
  role: string;
  status: { isOpen: boolean; label: string; tone: 'success' | 'warning' | 'danger' };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 11.1.3 — apenas 1 submenu aberto por vez
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (item: NavItem) => {
    if (item.match) return item.match(pathname);
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const toneClass =
    status.tone === 'success' ? 'bg-green-100 text-green-800' :
    status.tone === 'warning' ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800';

  return (
    <>
      {/* 11.1.7 — botão mobile */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-30 w-12 h-12 rounded-full bg-brand text-white shadow-lg flex items-center justify-center"
        aria-label="Abrir menu"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* 11.1.7 — drawer mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
            {renderContent({ collapsed: false, onClose: () => setMobileOpen(false) })}
          </aside>
        </div>
      )}

      <aside
        className={`hidden md:block bg-white border-r border-gray-200 min-h-screen transition-all ${
          collapsed ? 'md:w-16' : 'md:w-64'
        }`}
        aria-label="Menu administrativo"
      >
        {renderContent({ collapsed, onCollapse: () => setCollapsed((v) => !v) })}
      </aside>
    </>
  );

  function renderContent({ collapsed, onClose, onCollapse }: {
    collapsed: boolean;
    onClose?: () => void;
    onCollapse?: () => void;
  }) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 truncate">Tremeliko&apos;s Admin</h1>
                <p className="text-xs text-gray-500 truncate">{email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-brand-soft text-brand-text px-2 py-0.5 rounded">
                  {role}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {onCollapse && (
                <button
                  type="button"
                  onClick={onCollapse}
                  className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center"
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
                  className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center md:hidden"
                  aria-label="Fechar menu"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {/* 11.1.5 — status global Publicado/Rascunho */}
          {!collapsed && (
            <div
              className={`mt-3 inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${toneClass}`}
              title="Status do cardápio"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.tone === 'success' ? 'bg-green-500' :
                  status.tone === 'warning' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                aria-hidden="true"
              />
              {status.label}
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto" aria-label="Navegação principal">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-brand-soft text-brand-text font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {/* 11.1.2 — indicador lateral */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1 bottom-1 w-1 bg-brand rounded-r"
                  />
                )}
                <span aria-hidden="true" className="text-lg shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-100 space-y-1">
          <AdminSignOutButton collapsed={collapsed} />
          {/* 11.1.4 — Ver cardápio no cabeçalho */}
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            title="Ver cardápio"
          >
            <span aria-hidden="true">👀</span>
            {!collapsed && <span>Ver cardápio</span>}
          </Link>
        </div>
      </div>
    );
  }
}
