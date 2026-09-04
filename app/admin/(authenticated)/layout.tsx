import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerAuthClient } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Icon } from '@/components/ui';

export const dynamic = 'force-dynamic';

function computeStoreStatus(): { isOpen: boolean; label: string; tone: 'success' | 'warning' | 'danger' } {
  // Espelha a lógica do StoreContext no client (mas server-side)
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const schedule: Record<number, { open: number; close: number } | null> = {
    0: null, 1: null,
    2: { open: 18 * 60 + 30, close: 23 * 60 },
    3: { open: 18 * 60 + 30, close: 23 * 60 },
    4: { open: 18 * 60 + 30, close: 23 * 60 },
    5: { open: 18 * 60 + 30, close: 23 * 60 },
    6: { open: 18 * 60 + 30, close: 23 * 60 },
  };
  const s = schedule[day];
  if (!s) return { isOpen: false, label: 'Fechado hoje', tone: 'danger' };
  if (minutes >= s.open && minutes < s.close) {
    const minutesLeft = s.close - minutes;
    if (minutesLeft <= 60) {
      return { isOpen: true, label: 'Fechando em breve', tone: 'warning' };
    }
    return { isOpen: true, label: 'Aberto agora', tone: 'success' };
  }
  return { isOpen: false, label: 'Fechado', tone: 'danger' };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServerAuthClient();
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

  const status = computeStoreStatus();

  return (
    <div className="min-h-screen bg-app-bg flex flex-col md:flex-row">
      <AdminSidebar
        email={user.email || ''}
        role={profile.role}
        status={status}
      />
      <main
        className="flex-1 max-w-full overflow-x-hidden px-4 py-4 md:px-6 md:py-6"
        role="main"
      >
        <div className="container-admin">
          <div className="mb-4 flex items-center justify-end">
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              className="text-xs text-ink-muted hover:text-brand-text inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
            >
              Ver cardápio em nova aba
              <Icon.eye size={14} />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
