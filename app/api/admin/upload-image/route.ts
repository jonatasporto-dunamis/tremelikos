import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';
const MAX_BYTES = 500 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('admin_profiles')
    .select('active')
    .eq('user_id', userId)
    .single();
  return Boolean(data?.active);
}

export async function POST(req: NextRequest) {
  try {
    // 1) auth: precisa de usuário admin ativo
    const sb = createRouteHandlerClient({ cookies: () => cookies() });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // 2) parse form
    const form = await req.formData();
    const file = form.get('file');
    const path = form.get('path');
    if (!(file instanceof File) || typeof path !== 'string' || !path) {
      return NextResponse.json({ error: 'file e path são obrigatórios' }, { status: 400 });
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json({ error: `Tipo não permitido: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Arquivo acima de ${MAX_BYTES / 1024}KB` }, { status: 400 });
    }
    // path seguro: sem "..", sem caracteres especiais
    if (path.includes('..') || /[^a-zA-Z0-9._\-/]/.test(path)) {
      return NextResponse.json({ error: 'path inválido' }, { status: 400 });
    }
    if (!path.startsWith('products/')) {
      return NextResponse.json({ error: 'path deve começar com products/' }, { status: 400 });
    }

    // 3) upload
    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: true,
        cacheControl: '31536000',
      });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ path, bucket: BUCKET });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sb = createRouteHandlerClient({ cookies: () => cookies() });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    if (!path || !path.startsWith('products/') || path.includes('..')) {
      return NextResponse.json({ error: 'path inválido' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado' }, { status: 500 });
  }
}
