'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';

export default function AdminSignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      type="button"
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-danger hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 transition-colors"
      title="Sair"
    >
      <Icon.signOut width={18} height={18} className="shrink-0" />
      {!collapsed && <span>Sair</span>}
    </button>
  );
}
