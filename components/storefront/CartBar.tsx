'use client';

import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { formatMoney } from '@/lib/money';
import Link from 'next/link';

export default function CartBar() {
  const { subtotal, itemCount } = useCart();
  const { store } = useStore();

  const minimumOrder = store?.minimum_order || 15.0;
  const isBelowMinimum = subtotal < minimumOrder && itemCount > 0;

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-bottom">
      <div className="container-store py-3">
        {isBelowMinimum && (
          <p className="text-xs text-yellow-700 mb-2 text-center">
            Falta {formatMoney(minimumOrder - subtotal)} para o pedido mínimo
          </p>
        )}
        <Link
          href="/carrinho"
          className="btn-primary w-full py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">
              {itemCount}
            </span>
            <span>Ver pedido</span>
          </div>
          <span className="font-bold">{formatMoney(subtotal)}</span>
        </Link>
      </div>
    </div>
  );
}
