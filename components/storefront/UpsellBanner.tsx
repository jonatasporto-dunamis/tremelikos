'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/database';
import { formatMoney } from '@/lib/money';
import { useCart } from '@/features/cart/CartContext';

interface UpsellBannerProps {
  className?: string;
}

export default function UpsellBanner({ className = '' }: UpsellBannerProps) {
  const { state, addItem } = useCart();
  const [suggestions, setSuggestions] = useState<{ side: Product | null; drink: Product | null }>({
    side: null,
    drink: null,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/upsell')
      .then((r) => (r.ok ? r.json() : { side: null, drink: null }))
      .then((d) => setSuggestions({ side: d.side, drink: d.drink }))
      .catch(() => {});
  }, []);

  const hasBurger = state.items.some((i) =>
    /cheese|picanha|frango|gordon|porto|kenneth|tripoli|hard work|smash|tremeliko/i.test(i.product.name)
  );
  const hasSide = state.items.some((i) => /batata/i.test(i.product.name));
  const hasDrink = state.items.some((i) =>
    /coca|guar|água|agua|suco/i.test(i.product.name)
  );

  const showSide = hasBurger && !hasSide && suggestions.side;
  const showDrink = (hasBurger || hasSide) && !hasDrink && suggestions.drink;
  const show = (showSide || showDrink) && !dismissed;

  if (!show) return null;

  const renderCard = (product: Product, label: string) => (
    <div
      key={product.id}
      className="shrink-0 w-44 card p-3 flex-shrink-0"
    >
      <p className="text-xs text-brand-text font-medium uppercase tracking-wide">{label}</p>
      <h4 className="font-semibold text-sm text-brand-contrast mt-1 line-clamp-2">
        {product.name}
      </h4>
      <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-brand">{formatMoney(product.base_price)}</span>
        <button
          onClick={() => {
            addItem({ product, quantity: 1 });
          }}
          className="btn-primary text-xs px-3 py-1.5"
        >
          Adicionar
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={[
        'bg-gradient-to-r from-brand-soft to-brand/10 border border-brand/20 rounded-xl p-3',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-brand-text">
          ✨ Que tal completar seu pedido?
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-500 hover:text-gray-700"
          aria-label="Dispensar sugestão"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {showSide && suggestions.side && renderCard(suggestions.side, '🍟 Acompanhamento')}
        {showDrink && suggestions.drink && renderCard(suggestions.drink, '🥤 Bebida')}
      </div>
    </div>
  );
}