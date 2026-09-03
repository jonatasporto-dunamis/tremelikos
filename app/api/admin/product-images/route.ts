import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

export async function POST(req: NextRequest) {
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

  revalidatePath('/');
  revalidatePath(`/produto/${productId}`);
  return NextResponse.json({ image: data });
}

export async function DELETE(req: NextRequest) {
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
