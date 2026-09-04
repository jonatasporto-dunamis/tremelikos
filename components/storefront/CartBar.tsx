'use client';

import Link from 'next/link';
import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { formatMoney } from '@/lib/money';
import { Icon } from '@/components/ui';

export default function CartBar() {
  const { subtotal, itemCount } = useCart();
  const { store } = useStore();

  const minimumOrder = store?.minimum_order ?? 15.0;
  const remaining = Math.max(0, minimumOrder - subtotal);
  const isBelowMinimum = itemCount > 0 && remaining > 0;

  if (itemCount === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-app-surface border-t border-app-border shadow-cartbar safe-bottom"
      role="region"
      aria-label="Resumo do carrinho"
    >
      <div className="container-store py-2.5">
        {isBelowMinimum && (
          <p
            className="text-xs text-warning font-medium text-center mb-1.5"
            role="status"
            aria-live="polite"
          >
            Falta {formatMoney(remaining)} para o pedido mínimo
          </p>
        )}
        <Link
          href="/carrinho"
          className="btn-primary w-full min-h-touch-lg py-3 flex items-center justify-between text-base"
        >
          <span className="flex items-center gap-2">
            <span
              className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold min-w-[24px] text-center"
              aria-hidden="true"
            >
              {itemCount}
            </span>
            <span>Ver pedido</span>
            <Icon.chevronRight size={18} />
          </span>
          <span className="font-bold tabular-nums">{formatMoney(subtotal)}</span>
        </Link>
      </div>
    </div>
  );
}
