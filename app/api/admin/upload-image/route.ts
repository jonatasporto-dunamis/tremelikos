import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getServerAuthClient } from '@/lib/supabase/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ADMIN_UPLOAD_IMAGE_LIMIT = { interval: 60_000, maxRequests: 10 };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';
const MAX_BYTES = 500 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function requireAdmin() {
  const sb = await getServerAuthClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Não autorizado', status: 401 } as const;
  const { data } = await supabaseAdmin
    .from('admin_profiles')
    .select('active, store_id')
    .eq('user_id', user.id)
    .single();
  if (!data?.active) return { error: 'Sem permissão', status: 403 } as const;
  return { user, storeId: data.store_id as string } as const;
}

/**
 * Extrai o productId do path products/{productId}/...
 * Retorna null se o path não for de produto.
 */
function extractProductIdFromPath(path: string): string | null {
  const m = path.match(/^products\/([0-9a-fA-F-]{36})(?:\/|$)/);
  return m ? m[1] : null;
}

async function productBelongsToStore(productId: string, storeId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('store_id', storeId)
    .maybeSingle();
  return Boolean(data);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`admin:upload-image:${ip}`, ADMIN_UPLOAD_IMAGE_LIMIT);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
  }

  try {
    // 1) auth: precisa de usuário admin ativo
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2) parse form
    const form = await req.formData();
    const file = form.get('file');
    const path = form.get('path');
    const productIdForm = form.get('productId');
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

    // 3) validação de escopo: extrair productId do path OU exigir via FormData
    let productId = extractProductIdFromPath(path);
    if (!productId && typeof productIdForm === 'string' && productIdForm) {
      productId = productIdForm;
    }
    if (!productId) {
      return NextResponse.json(
        { error: 'productId não encontrado no path nem no form' },
        { status: 400 }
      );
    }
    if (!(await productBelongsToStore(productId, auth.storeId))) {
      return NextResponse.json({ error: 'Produto não pertence à loja' }, { status: 403 });
    }

    // 4) upload
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
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    if (!path || !path.startsWith('products/') || path.includes('..')) {
      return NextResponse.json({ error: 'path inválido' }, { status: 400 });
    }
    // validação de escopo: extrair productId do path
    const productId = extractProductIdFromPath(path);
    if (!productId) {
      return NextResponse.json({ error: 'productId não encontrado no path' }, { status: 400 });
    }
    if (!(await productBelongsToStore(productId, auth.storeId))) {
      return NextResponse.json({ error: 'Produto não pertence à loja' }, { status: 403 });
    }
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado' }, { status: 500 });
  }
}
