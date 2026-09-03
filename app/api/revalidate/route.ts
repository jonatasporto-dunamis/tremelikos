import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const sb = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Não autorizado', status: 401 } as const;
  const { data: profile } = await supabaseAdmin
    .from('admin_profiles')
    .select('active')
    .eq('user_id', user.id)
    .single();
  if (!profile?.active) return { error: 'Sem permissão', status: 403 } as const;
  return { user } as const;
}

interface RevalidateRequest {
  paths?: string[];
  tags?: string[];
  /** se true, revalida home e detail de todos os produtos */
  fullHome?: boolean;
}

/**
 * 10.3.3 — endpoint autenticado para revalidar páginas ISR.
 * Uso: POST /api/revalidate { paths: ['/'], tags: ['home'] }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json().catch(() => ({}))) as RevalidateRequest;
  const revalidated: string[] = [];

  if (body.fullHome) {
    revalidatePath('/');
    revalidated.push('/');
    revalidatePath('/admin/produtos');
    revalidated.push('/admin/produtos');
  }

  for (const p of body.paths || []) {
    if (typeof p !== 'string' || !p.startsWith('/')) {
      return NextResponse.json({ error: `path inválido: ${p}` }, { status: 400 });
    }
    revalidatePath(p);
    revalidated.push(p);
  }

  for (const t of body.tags || []) {
    if (typeof t !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(t)) {
      return NextResponse.json({ error: `tag inválida: ${t}` }, { status: 400 });
    }
    revalidateTag(t);
    revalidated.push(`tag:${t}`);
  }

  return NextResponse.json({ ok: true, revalidated });
}
