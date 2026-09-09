import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getServerAuthClient } from '@/lib/supabase/auth';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ADMIN_PRODUCT_IMAGES_LIMIT = { interval: 60_000, maxRequests: 10 };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const sb = await getServerAuthClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Não autorizado', status: 401 } as const;
  const { data: profile } = await supabaseAdmin
    .from('admin_profiles')
    .select('active, store_id')
    .eq('user_id', user.id)
    .single();
  if (!profile?.active) return { error: 'Sem permissão', status: 403 } as const;
  return { user, storeId: profile.store_id as string } as const;
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
  const rate = checkRateLimit(`admin:product-images:${ip}`, ADMIN_PRODUCT_IMAGES_LIMIT);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
  }

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = await req.json();
  const { productId, path, altText, isCover = true, position = 0 } = body || {};
  if (!productId || !path) {
    return NextResponse.json({ error: 'productId e path são obrigatórios' }, { status: 400 });
  }
  if (typeof path !== 'string' || !path.startsWith('products/') || path.includes('..')) {
    return NextResponse.json({ error: 'path inválido' }, { status: 400 });
  }

  if (!(await productBelongsToStore(productId, auth.storeId))) {
    return NextResponse.json({ error: 'Produto não pertence à loja' }, { status: 403 });
  }

  if (isCover) {
    // desmarca outras capas
    await supabaseAdmin
      .from('product_images')
      .update({ is_cover: false })
      .eq('product_id', productId);
  }
  // upsert
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .upsert(
      { product_id: productId, path, alt_text: altText || null, is_cover: isCover, position },
      { onConflict: 'product_id,path' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // revalidate usando slug do produto (rota usa slug, não productId)
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('slug')
    .eq('id', productId)
    .single();
  revalidatePath('/');
  if (product?.slug) revalidatePath(`/produto/${product.slug}`);
  return NextResponse.json({ image: data });
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`admin:product-images:${ip}`, ADMIN_PRODUCT_IMAGES_LIMIT);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
  }

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const path = searchParams.get('path');
  if (!productId) {
    return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });
  }
  if (!(await productBelongsToStore(productId, auth.storeId))) {
    return NextResponse.json({ error: 'Produto não pertence à loja' }, { status: 403 });
  }
  if (path) {
    // remove apenas essa imagem
    const { error } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId)
      .eq('path', path);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!path.includes('..')) {
      await supabaseAdmin.storage.from('product-images').remove([path]);
    }
  } else {
    // remove todas as capas
    const { data: imgs } = await supabaseAdmin
      .from('product_images')
      .select('path')
      .eq('product_id', productId);
    await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId);
    const paths = (imgs || []).map((i) => i.path).filter((p) => !p.includes('..'));
    if (paths.length > 0) {
      await supabaseAdmin.storage.from('product-images').remove(paths);
    }
  }

  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
