import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase/client';

const BASE = 'https://tremelikos.growthpulse.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('active', true);

  const productUrls = (products || []).map((p) => ({
    url: `${BASE}/produto/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE}/combos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...productUrls,
  ];
}