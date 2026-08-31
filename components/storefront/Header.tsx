'use client';

import Link from 'next/link';
import { useStore } from '@/features/cart/StoreContext';
import { useCart } from '@/features/cart/CartContext';

export default function Header() {
  const { store, isOpen, nextOpenTime } = useStore();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container-store py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-brand-contrast leading-tight">
              {store?.name || "Tremeliko's Burguer"}
            </h1>
            <div className="flex items-center gap-1">
              {isOpen ? (
                <span className="text-xs text-green-600 font-medium">Aberto agora</span>
              ) : (
                <span className="text-xs text-red-600 font-medium">
                  {nextOpenTime || 'Fechado'}
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/carrinho"
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Carrinho"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
