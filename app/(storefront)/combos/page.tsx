import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/types/database';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = {
  title: "Combos — Tremeliko's Burguer",
  description:
    'Combinações de hambúrguer + acompanhamento + bebida com preço especial. Entrega em Jequié/BA.',
  openGraph: {
    title: "Combos — Tremeliko's Burguer",
    description:
      'Combinações de hambúrguer + acompanhamento + bebida com preço especial.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export const revalidate = 300;

interface Suggestion {
  burger: Product;
  side: Product | null;
  drink: Product | null;
  savings: number;
}

async function getFeatured() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('available', true)
    .order('base_price', { ascending: false });
  return data || [];
}

function pickSuggestions(products: Product[]): Suggestion[] {
  const burgers = products.filter((p) =>
    /cheese|picanha|frango|gordon|porto|kenneth|tripoli|hard work|smash|tremeliko/i.test(p.name)
  );
  const sides = products.filter((p) => /batata/i.test(p.name));
  const drinks = products.filter((p) => /coca|guar|água|agua/i.test(p.name));

  return burgers.slice(0, 6).map((burger) => {
    const side = sides[0] || null;
    const drink = drinks.find((d) => /lata/i.test(d.name)) || drinks[0] || null;
    const sidePrice = side?.base_price || 0;
    const drinkPrice = drink?.base_price || 0;
    const totalAvulso = burger.base_price + sidePrice + drinkPrice;
    const comboPrice = Number((totalAvulso * 0.9).toFixed(2));
    const savings = Number((totalAvulso - comboPrice).toFixed(2));
    return { burger, side, drink, savings };
  });
}

export default async function CombosPage() {
  const products = await getFeatured();
  const suggestions = pickSuggestions(products);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: suggestions.map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: `Combo com ${s.burger.name}`,
        offers: {
          '@type': 'Offer',
          price: (s.burger.base_price + (s.side?.base_price || 0) + (s.drink?.base_price || 0)),
          priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <div className="container-store py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-2xl font-bold text-brand-contrast mb-1">Combos</h1>
      <p className="text-sm text-gray-600 mb-4">
        Hambúrguer + acompanhamento + bebida com <strong>10% OFF</strong> sobre o preço avulso.
        Monte seu pedido e finalize no WhatsApp.
      </p>

      <div className="space-y-3">
        {suggestions.map((s, idx) => {
          const total = s.burger.base_price + (s.side?.base_price || 0) + (s.drink?.base_price || 0);
          return (
            <article key={idx} className="card p-4">
              <header className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="font-bold text-brand-contrast">Combo #{idx + 1}</h2>
                  <p className="text-xs text-gray-500">Sugestão — personalize no carrinho</p>
                </div>
                <span className="px-2 py-1 bg-brand text-white text-xs font-bold rounded">
                  Economize {formatMoney(s.savings)}
                </span>
              </header>

              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span>1× {s.burger.name}</span>
                  <span>{formatMoney(s.burger.base_price)}</span>
                </li>
                {s.side && (
                  <li className="flex justify-between">
                    <span>1× {s.side.name}</span>
                    <span>{formatMoney(s.side.base_price)}</span>
                  </li>
                )}
                {s.drink && (
                  <li className="flex justify-between">
                    <span>1× {s.drink.name}</span>
                    <span>{formatMoney(s.drink.base_price)}</span>
                  </li>
                )}
              </ul>

              <footer className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-brand">
                  Total: {formatMoney(total)}
                </span>
                <Link
                  href={`/produto/${s.burger.slug}`}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Personalizar
                </Link>
              </footer>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-6">
        * Os descontos são simulados como 10% sobre os itens avulsos. Promoções reais devem
        ser configuradas no painel administrativo (Fase 6).
      </p>
    </div>
  );
}