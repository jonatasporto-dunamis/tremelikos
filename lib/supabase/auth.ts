import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getServerAuthClient() {
  const cookieStore = await cookies();
  return createServerComponentClient({ cookies: async () => cookieStore });
}
