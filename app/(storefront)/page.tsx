import { supabase } from '@/lib/supabase/client';
import { Product, Section } from '@/types/database';
import ProductCard from '@/components/storefront/ProductCard';
import CategoryNav from '@/components/storefront/CategoryNav';

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

  return data
    .map((item) => item.products)
    .filter((p): p is Product => p !== null && p.active && p.available);
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

export default async function HomePage() {
  const sections = await getSections();
  const featured = await getFeaturedProducts();

  const sectionsWithProducts = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      products: await getProductsBySection(section.id),
    }))
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand to-brand-hover text-white py-8">
        <div className="container-store">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Hambúrguer na brasa, sabor de verdade
          </h2>
          <p className="text-white/90 text-sm md:text-base">
            Faça seu pedido online e receba em casa ou retire no balcão
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              📍 Jequiezinho, Jequié
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              🚚 Delivery
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              💳 Pix e Cartão
            </span>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <CategoryNav sections={sections} />

      {/* Featured Products */}
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

      {/* Menu Sections */}
      {sectionsWithProducts.map((section) => (
        <section key={section.id} id={section.slug} className="container-store py-4">
          <h2 className="text-lg font-bold text-brand-contrast mb-3">
            {section.name}
          </h2>
          {section.products.length > 0 ? (
            <div className="space-y-3">
              {section.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum produto disponível nesta seção.</p>
          )}
        </section>
      ))}

      {/* Store Info */}
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
    </div>
  );
}
