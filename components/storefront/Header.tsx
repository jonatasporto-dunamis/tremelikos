'use client';

import Link from 'next/link';
import { useStore } from '@/features/cart/StoreContext';
import { useCart } from '@/features/cart/CartContext';
import StoreStatus from '@/components/storefront/StoreStatus';
import { Icon } from '@/components/ui';

export default function Header() {
  const { store } = useStore();
  const { itemCount } = useCart();

  return (
    <header
      className="sticky top-0 z-50 bg-app-surface border-b border-app-border shadow-sticky"
      role="banner"
    >
      <div className="container-store h-14 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
          aria-label={`${store?.name || "Tremeliko's Burguer"} — página inicial`}
        >
          <span
            className="w-10 h-10 shrink-0 rounded-md bg-brand text-white grid place-items-center font-extrabold text-lg"
            aria-hidden="true"
          >
            T
          </span>
          <span className="min-w-0">
            <span className="block font-extrabold text-ink leading-tight truncate text-base">
              {store?.name || "Tremeliko's Burguer"}
            </span>
            <StoreStatus />
          </span>
        </Link>

        <Link
          href="/carrinho"
          className="relative w-11 h-11 grid place-items-center rounded-md text-ink hover:bg-app-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={`Carrinho${itemCount > 0 ? ` com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}` : ''}`}
        >
          <Icon.cart size={22} />
          {itemCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-brand text-white text-[11px] font-bold rounded-full grid place-items-center"
              aria-hidden="true"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
