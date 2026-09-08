import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerAuthClient } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Icon } from '@/components/ui';
import { computeStoreStatusLabel } from '@/features/storeStatus/storeStatus';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('admin_profiles')
    .select('role, active')
    .eq('user_id', user.id)
    .single();

  if (!profile || !profile.active) redirect('/login');

  const status = computeStoreStatusLabel();

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
