import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase/client';

const BASE = 'https://tremelikos.growthpulse.com.br';

export const revalidate = 3600; // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: products }, { data: sections }] = await Promise.all([
    supabase
      .from('products')
      .select('slug, updated_at, active, available')
      .eq('active', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('sections')
      .select('slug, updated_at')
      .eq('active', true)
      .order('position'),
  ]);

  const now = new Date();
  const productUrls = (products || []).map((p) => ({
    url: `${BASE}/produto/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: 'weekly' as const,
    priority: p.available ? 0.7 : 0.3,
  }));

  const sectionUrls = (sections || []).map((s) => ({
    url: `${BASE}/#${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE}/combos`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/perfil-da-loja`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE}/politica-de-privacidade`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...sectionUrls,
    ...productUrls,
  ];
}
