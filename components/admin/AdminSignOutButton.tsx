'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AdminSignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
    >
      Sair
    </button>
  );
}