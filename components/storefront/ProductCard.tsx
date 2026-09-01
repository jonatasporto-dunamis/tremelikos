'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/database';
import { formatMoney } from '@/lib/money';
import { useCart } from '@/features/cart/CartContext';
import ProductModal, { OptionGroup } from './ProductModal';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);

  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    fetch(`/api/products/${product.id}/option-groups`)
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((data) => {
        if (!cancelled) setOptionGroups(data.groups || []);
      })
      .catch(() => {
        if (!cancelled) setOptionGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showModal, product.id]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ product, quantity: 1 });
  };

  return (
    <>
      <div
        id={`product-${product.id}`}
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
              aria-label={`Adicionar ${product.name}`}
            >
              Adicionar
            </button>
          </div>
        </div>

        <a
          href={`/produto/${product.slug}`}
          className="shrink-0 w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Ver ${product.name}`}
        >
          <span className="text-3xl">🍔</span>
        </a>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
              <span className="text-5xl">🍔</span>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold text-brand-contrast">{product.name}</h2>
              {product.description && (
                <p className="mt-1 text-sm text-gray-600">{product.description}</p>
              )}
              <div className="mt-4">
                <ProductModal
                  product={product}
                  optionGroups={optionGroups}
                  onClose={() => setShowModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}