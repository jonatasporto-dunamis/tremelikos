import { NextRequest, NextResponse } from 'next/server';
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

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  let q = supabaseAdmin.from('audit_logs').select('*');
  if (searchParams.get('action')) q = q.eq('action', searchParams.get('action')!);
  if (searchParams.get('entity')) q = q.eq('entity', searchParams.get('entity')!);
  if (searchParams.get('actor')) q = q.eq('actor_id', searchParams.get('actor')!);
  if (searchParams.get('from')) q = q.gte('created_at', new Date(searchParams.get('from')!).toISOString());
  if (searchParams.get('to')) q = q.lte('created_at', new Date(searchParams.get('to')! + 'T23:59:59').toISOString());
  const { data } = await q.order('created_at', { ascending: false }).limit(5000);

  const rows = (data || []) as any[];
  const header = ['id', 'created_at', 'action', 'entity', 'entity_id', 'actor_id', 'payload'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.id,
      r.created_at,
      r.action,
      r.entity,
      r.entity_id,
      r.actor_id,
      r.payload,
    ].map(csvEscape).join(','));
  }
  const csv = lines.join('\n');
  const filename = `audit_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
