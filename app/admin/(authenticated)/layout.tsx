import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerAuthClient } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import AdminSignOutButton from '@/components/admin/AdminSignOutButton';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: profile } = await supabaseAdmin
    .from('admin_profiles')
    .select('role, active')
    .eq('user_id', user.id)
    .single();

  if (!profile || !profile.active) redirect('/admin/login');

  const nav = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/produtos', label: 'Produtos', icon: '🍔' },
    { href: '/admin/secoes', label: 'Seções', icon: '📂' },
    { href: '/admin/opcoes', label: 'Adicionais', icon: '➕' },
    { href: '/admin/promocoes', label: 'Promoções', icon: '🏷️' },
    { href: '/admin/cupons', label: 'Cupons', icon: '🎟️' },
    { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙️' },
    { href: '/admin/audit', label: 'Auditoria', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="md:w-64 bg-white border-r border-gray-200 md:min-h-screen">
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-bold text-gray-900">Tremeliko&apos;s Admin</h1>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-brand-soft text-brand-text px-2 py-0.5 rounded">
            {profile.role}
          </span>
        </div>
        <nav className="p-2 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-100">
          <AdminSignOutButton />
          <Link
            href="/"
            className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
          >
            ← Ver cardápio
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}