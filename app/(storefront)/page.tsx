import { supabase } from '@/lib/supabase/client';
import { Product, Section } from '@/types/database';
import type { Metadata } from 'next';
import ProductCard from '@/components/storefront/ProductCard';
import CategoryNav from '@/components/storefront/CategoryNav';
import Hero from '@/components/storefront/Hero';
import SearchBar from '@/components/storefront/SearchBar';
import PromoBanner, { PromotionBannerItem } from '@/components/storefront/PromoBanner';
import ViewItemList from '@/components/storefront/ViewItemList';
import LoadingSkeleton, { SectionSkeleton } from '@/components/ui/LoadingSkeleton';
import StoreStatus from '@/components/storefront/StoreStatus';
import { Suspense } from 'react';
import { getBestSellers, getProductsByIds, getCombos } from '@/features/catalog/bestSellers';
import { attachImages, type ProductWithImages } from '@/features/catalog/images';
import { getUpsellSuggestion } from '@/features/catalog/upsell';

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    default: "Tremeliko's Burguer | Hambúrguer na brasa, sabor de verdade",
    template: '%s | Tremeliko\'s Burguer',
  },
  description:
    "Cardápio digital do Tremeliko's Burguer — hambúrgueres artesanais na brasa, combos e porções. Delivery e retirada no balcão em Jequié/BA.",
  alternates: { canonical: 'https://tremelikos.growthpulse.com.br/' },
  openGraph: {
    title: "Tremeliko's Burguer | Hambúrguer na brasa, sabor de verdade",
    description: 'Cardápio digital com hambúrgueres artesanais na brasa em Jequié/BA.',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://tremelikos.growthpulse.com.br/',
    siteName: "Tremeliko's Burguer",
    images: [{ url: 'https://tremelikos.growthpulse.com.br/icon-512x512.png', width: 512, height: 512, alt: "Tremeliko's Burguer" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Tremeliko's Burguer",
    description: 'Cardápio digital com hambúrgueres artesanais na brasa em Jequié/BA.',
    images: ['https://tremelikos.growthpulse.com.br/icon-512x512.png'],
  },
};

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
  const [sections, allProducts, promotions, promoData, bestSellers, combos, defaultUpsellProduct] = await Promise.all([
    getSections(),
    getAllProducts(),
    getActivePromotions(),
    getPromotionsForCards(),
    getBestSellers(6),
    getCombos(),
    getUpsellSuggestion(''),
  ]);
  const defaultUpsell = defaultUpsellProduct ? { product: defaultUpsellProduct, hook: 'Complete com' } : null;

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

  // Top best-sellers (preserva ordem do ranking)
  const bestSellerProducts: ProductWithImages[] = await attachImages(
    await getProductsByIds(
      Object.entries(bestSellers)
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => id)
    )
  );
  const comboProducts: ProductWithImages[] = await attachImages(combos);

  // sections com imagens anexadas
  const sectionsWithProductsAndImages: Array<Section & { products: ProductWithImages[] }> = await Promise.all(
    sectionsWithProducts.map(async (s) => ({
      ...s,
      products: await attachImages(s.products),
    }))
  );

  return (
    <div>
      {/* 13.1.3 — JSON-LD Menu com MenuItem + Offer por produto */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Menu',
            name: "Cardápio - Tremeliko's Burguer",
            inLanguage: 'pt-BR',
            hasMenuSection: sectionsWithProductsAndImages.map((section) => ({
              '@type': 'MenuSection',
              name: section.name,
              hasMenuItem: section.products.map((p) => ({
                '@type': 'MenuItem',
                name: p.name,
                description: p.description || undefined,
                url: `https://tremelikos.growthpulse.com.br/produto/${p.slug}`,
                offers: {
                  '@type': 'Offer',
                  price: p.base_price.toFixed(2),
                  priceCurrency: 'BRL',
                  availability: p.available
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                },
              })),
            })),
          }),
        }}
      />
      <StoreStatus />
      <Hero />

      <PromoBanner promotions={promotions} />

      <Suspense fallback={<LoadingSkeleton />}>
        <SearchBar products={allProducts} />
      </Suspense>

      <CategoryNav sections={sections} />

      {/* Ofertas (banner + cards horizontais) já é renderizado pelo PromoBanner acima */}

      {/* Mais Pedidos — 4-6 best-sellers calculados */}
      {bestSellerProducts.length > 0 && (
        <section className="container-store py-4" id="mais-pedidos">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-bold text-brand-contrast">🔥 Mais pedidos</h2>
            <span className="text-xs text-gray-500">Últimos 30 dias</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {bestSellerProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="shrink-0 w-56">
                <ProductCard
                  product={product}
                  serverPromotions={serverPromotions}
                  bestSellerRank={bestSellers[product.id]}
                  prefetchedUpsell={defaultUpsell}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Combos */}
      {comboProducts.length > 0 && (
        <section className="container-store py-4" id="combos">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-bold text-brand-contrast">🍱 Combos</h2>
            <span className="text-xs text-gray-500">Mais economia</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {comboProducts.map((product) => (
              <div key={product.id} className="shrink-0 w-56">
                <ProductCard
                  product={product}
                  serverPromotions={serverPromotions}
                  prefetchedUpsell={defaultUpsell}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Catálogo completo (todas as seções) */}
      {sectionsWithProductsAndImages.map((section) => {
        const items = section.products.map((p) => ({
          item_id: p.id,
          item_name: p.name,
          price: p.base_price,
        }));
        return (
          <ViewItemList
            key={section.id}
            listId={section.id}
            listName={section.name}
            items={items}
          >
            <section id={section.slug} className="container-store py-4">
              <h2 className="text-lg font-bold text-brand-contrast mb-3">
                {section.name}
              </h2>
              {section.products.length > 0 ? (
                <div className="space-y-3">
                  {section.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      serverPromotions={serverPromotions}
                      bestSellerRank={bestSellers[product.id]}
                      prefetchedUpsell={defaultUpsell}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum produto disponível nesta seção.</p>
              )}
            </section>
          </ViewItemList>
        );
      })}

      <Suspense fallback={<SectionSkeleton count={1} />}>
        <section className="container-store py-6">
          <div className="card p-4">
            <h3 className="font-bold text-brand-contrast mb-2">📍 Informações</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA</p>
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
