'use client';

import { useState } from 'react';
import { Product } from '@/types/database';
import { formatMoney } from '@/lib/money';
import { useCart } from '@/features/cart/CartContext';
import ProductModal from './ProductModal';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [showModal, setShowModal] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      product,
      quantity: 1,
    });
  };

  return (
    <>
      <div
        className="card flex flex-row gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowModal(true)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-brand-contrast leading-tight truncate">
              {product.name}
            </h3>
            {product.badge && (
              <span className="shrink-0 px-2 py-0.5 bg-brand-soft text-brand-badge text-xs font-medium rounded-full">
                {product.badge}
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-brand">
              {formatMoney(product.base_price)}
            </span>
            <button
              onClick={handleQuickAdd}
              disabled={!product.available}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar
            </button>
          </div>
        </div>

        <div className="shrink-0 w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          <span className="text-3xl">🍔</span>
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={product}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
