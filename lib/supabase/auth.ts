import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export function getServerAuthClient() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}