import { supabase } from '@/lib/supabase/client';
import { Product, Section } from '@/types/database';
import ProductCard from '@/components/storefront/ProductCard';
import CategoryNav from '@/components/storefront/CategoryNav';
import Hero from '@/components/storefront/Hero';
import SearchBar from '@/components/storefront/SearchBar';
import PromoBanner, { PromotionBannerItem } from '@/components/storefront/PromoBanner';
import LoadingSkeleton, { SectionSkeleton } from '@/components/ui/LoadingSkeleton';
import { Suspense } from 'react';

export const revalidate = 60;

async function getSections(): Promise<Section[]> {
  const { data } = await supabase
    .from('sections')
    .select('*')
    .eq('active', true)
    .order('position');
  return data || [];
}

async function getProductsBySection(sectionId: string): Promise<Product[]> {
  const { data } = await supabase
    .from('section_products')
    .select(`
      position,
      products (*)
    `)
    .eq('section_id', sectionId)
    .order('position');

  if (!data) return [];

  type SectionProductWithProducts = {
    position: number;
    products: Product[];
  };

  return (data as SectionProductWithProducts[])
    .flatMap((item) => item.products)
    .filter((p) => p.active && p.available);
}

async function getFeaturedProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('available', true)
    .eq('featured', true)
    .limit(6);
  return data || [];
}

async function getAllProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('available', true);
  return data || [];
}

async function getActivePromotions(): Promise<PromotionBannerItem[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('promotions')
    .select('id, name, type, value, ends_at')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gte.${now}`);
  return (data as PromotionBannerItem[]) || [];
}

async function getPromotionsForCards() {
  const now = new Date().toISOString();
  const [{ data: promos }, { data: links }] = await Promise.all([
    supabase
      .from('promotions')
      .select('id, store_id, name, type, value, starts_at, ends_at, weekdays, priority, active, created_at')
      .eq('active', true)
      .or(`ends_at.is.null,ends_at.gte.${now}`),
    supabase.from('promotion_products').select('promotion_id, product_id'),
  ]);
  const productPromotions: Record<string, string[]> = {};
  for (const l of links || []) {
    if (!productPromotions[l.product_id]) productPromotions[l.product_id] = [];
    productPromotions[l.product_id].push(l.promotion_id);
  }
  return { promotions: promos || [], productPromotions };
}

export default async function HomePage() {
  const [sections, featured, allProducts, promotions, promoData] = await Promise.all([
    getSections(),
    getFeaturedProducts(),
    getAllProducts(),
    getActivePromotions(),
    getPromotionsForCards(),
  ]);

  const sectionsWithProducts = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      products: await getProductsBySection(section.id),
    }))
  );

  const serverPromotions = {
    promotions: promoData.promotions as any,
    productPromotions: promoData.productPromotions,
  };

  return (
    <div>
      <Hero
        title="Hambúrguer na brasa, sabor de verdade"
        subtitle="Faça seu pedido online e receba em casa ou retire no balcão"
        badges={['📍 Jequiezinho, Jequié', '🚚 Delivery', '💳 Pix e Cartão']}
      />

      <PromoBanner promotions={promotions} />

      <Suspense fallback={<LoadingSkeleton />}>
        <SearchBar products={allProducts} />
      </Suspense>

      <CategoryNav sections={sections} />

      {featured.length > 0 && (
        <section className="container-store py-4">
          <h2 className="text-lg font-bold text-brand-contrast mb-3">
            ⭐ Destaques
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {featured.map((product) => (
              <div
                key={product.id}
                className="shrink-0 w-40 card p-2"
              >
                <div className="w-full h-24 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                  <span className="text-3xl">🍔</span>
                </div>
                <h3 className="text-sm font-medium text-brand-contrast truncate">
                  {product.name}
                </h3>
                <p className="text-brand font-bold">
                  R$ {product.base_price.toFixed(2).replace('.', ',')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sectionsWithProducts.map((section) => (
        <section key={section.id} id={section.slug} className="container-store py-4">
          <h2 className="text-lg font-bold text-brand-contrast mb-3">
            {section.name}
          </h2>
          {section.products.length > 0 ? (
            <div className="space-y-3">
              {section.products.map((product) => (
                <ProductCard key={product.id} product={product} serverPromotions={serverPromotions} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum produto disponível nesta seção.</p>
          )}
        </section>
      ))}

      <Suspense fallback={<SectionSkeleton count={1} />}>
        <section className="container-store py-6">
          <div className="card p-4">
            <h3 className="font-bold text-brand-contrast mb-2">Informações</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📍 Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA</p>
              <p>🕐 Terça a Sábado: 18:30 às 23:00</p>
              <p>📱 WhatsApp: (73) 99154-2371</p>
              <p>💳 Aceitamos Pix e cartão de crédito</p>
              <p>🛒 Pedido mínimo: R$ 15,00</p>
            </div>
          </div>
        </section>
      </Suspense>
    </div>
  );
}
