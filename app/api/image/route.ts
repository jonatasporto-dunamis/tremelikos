import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = process.env.NEXT_PUBLIC_PRODUCT_IMAGES_BUCKET || 'product-images';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'missing path' }, { status: 400 });
  }
  // Cria client anônimo só para gerar signed URL pública
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await sb.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  // 301 para o Storage do Supabase (cache de 1 ano)
  return NextResponse.redirect(data.publicUrl, {
    status: 301,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}