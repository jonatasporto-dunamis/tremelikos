import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import ProductPersonalize from '@/components/storefront/ProductPersonalize';
import type { OptionGroup } from '@/components/storefront/ProductModal';

interface PageProps {
  params: { slug: string };
}

async function getProduct(slug: string) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();
  return data;
}

async function getCoverImage(productId: string): Promise<string | null> {
  const { data } = await supabase
    .from('product_images')
    .select('path, alt_text')
    .eq('product_id', productId)
    .eq('is_cover', true)
    .maybeSingle();
  return data?.path || null;
}

async function getOptionGroups(productId: string): Promise<OptionGroup[]> {
  const { data } = await supabase
    .from('product_option_groups')
    .select(`
      position,
      option_groups (
        id, name, min_choices, max_choices, required,
        options ( id, name, price_delta, available, position )
      )
    `)
    .eq('product_id', productId)
    .order('position');

  if (!data) return [];
  return data
    .map((row: any) => row.option_groups)
    .filter(Boolean)
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      min_choices: g.min_choices,
      max_choices: g.max_choices,
      required: g.required,
      options: (g.options || [])
        .filter((o: any) => o.available)
        .sort((a: any, b: any) => a.position - b.position),
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Produto não encontrado — Tremeliko\'s Burguer' };

  const price = product.base_price.toFixed(2).replace('.', ',');
  const description = product.description
    ? `${product.description} — R$ ${price}`
    : `Peça ${product.name} por R$ ${price}. Entrega em Jequié/BA.`;

  // canonical + OG
  const canonical = `https://tremelikos.growthpulse.com.br/produto/${params.slug}`;
  // tenta descobrir imagem de capa (best-effort)
  const { data: cover } = await supabase
    .from('product_images')
    .select('path')
    .eq('product_id', product.id)
    .eq('is_cover', true)
    .maybeSingle();
  const imageUrl = cover?.path
    ? `https://tremelikos.growthpulse.com.br/api/image?path=${encodeURIComponent(cover.path)}`
    : `${process.env.NEXT_PUBLIC_BASE_URL || 'https://tremelikos.growthpulse.com.br'}/icon-512x512.png`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      locale: 'pt_BR',
      url: canonical,
      images: [{ url: imageUrl, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [imageUrl],
    },
  };
}

export const revalidate = 300;

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const [optionGroups, coverPath] = await Promise.all([
    getOptionGroups(product.id),
    getCoverImage(product.id),
  ]);
  const coverUrl = coverPath ? `/api/image?path=${encodeURIComponent(coverPath)}` : null;

  const absoluteImage = coverUrl
    ? `https://tremelikos.growthpulse.com.br${coverUrl}`
    : undefined;
  const productUrl = `https://tremelikos.growthpulse.com.br/produto/${product.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: absoluteImage,
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: "Tremeliko's Burguer" },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      price: product.base_price.toFixed(2),
      priceCurrency: 'BRL',
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: "Tremeliko's Burguer" },
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Cardápio',
        item: 'https://tremelikos.growthpulse.com.br/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="container-store py-4">
      <nav className="text-sm text-gray-500 mb-3" aria-label="breadcrumb">
        <a href="/" className="hover:text-brand">← Voltar ao cardápio</a>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProductView',
            item_id: product.id,
            item_name: product.name,
            price: product.base_price,
            currency: 'BRL',
          }),
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || []; window.dataLayer.push({event:'view_item',currency:'BRL',value:${product.base_price},items:[{item_id:'${product.id}',item_name:${JSON.stringify(product.name)},price:${product.base_price}}]});`,
        }}
      />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card aspect-square bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden relative">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-7xl" aria-hidden="true">🍔</span>
          )}
        </div>
        <div>
          {product.badge && (
            <span className="inline-block text-xs font-bold text-white bg-brand px-2 py-1 rounded mb-2">
              {product.badge}
            </span>
          )}
          <h1 className="text-2xl font-bold text-brand-contrast">{product.name}</h1>
          {product.description && (
            <p className="text-gray-600 mt-2">{product.description}</p>
          )}
          <p className="text-2xl font-bold text-brand mt-4">
            R$ {product.base_price.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Pedido mínimo: R$ 15,00. Taxa de entrega e pagamento são tratados no WhatsApp.
          </p>
        </div>
      </div>

      <section className="card p-4">
        <h2 className="text-lg font-bold text-brand-contrast mb-2">Personalize</h2>
        <ProductPersonalize product={product} optionGroups={optionGroups} />
      </section>
    </div>
  );
}