'use client';

import { Product } from '@/types/database';
import { formatMoney } from '@/lib/money';
import { useCart } from '@/features/cart/CartContext';
import { useState } from 'react';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');

  const handleAddToCart = () => {
    addItem({
      product,
      quantity,
      observations: observations.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Product Image Placeholder */}
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <span className="text-6xl">🍔</span>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-bold text-brand-contrast">
            {product.name}
          </h2>
          {product.description && (
            <p className="mt-2 text-gray-600 text-sm">
              {product.description}
            </p>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                -
              </button>
              <span className="text-lg font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: sem cebola, ponto da carne..."
              className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 btn-primary py-3"
            >
              Adicionar • {formatMoney(product.base_price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
