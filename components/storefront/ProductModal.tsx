'use client';

import { Product } from '@/types/database';
import { formatMoney } from '@/lib/money';
import { useCart } from '@/features/cart/CartContext';
import { useState } from 'react';

export interface OptionItem {
  id: string;
  name: string;
  price_delta: number;
  available: boolean;
  position: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  min_choices: number;
  max_choices: number;
  required: boolean;
  options: OptionItem[];
}

interface ProductModalProps {
  product: Product;
  optionGroups?: OptionGroup[];
  onClose: () => void;
}

export default function ProductModal({ product, optionGroups = [], onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, OptionItem[]>>({});

  const toggleOption = (group: OptionGroup, option: OptionItem) => {
    setSelectedOptions((prev) => {
      const current = prev[group.id] || [];
      const exists = current.some((o) => o.id === option.id);
      let next: OptionItem[];
      if (exists) {
        next = current.filter((o) => o.id !== option.id);
      } else if (group.max_choices === 1) {
        next = [option];
      } else {
        if (current.length >= group.max_choices) return prev;
        next = [...current, option];
      }
      return { ...prev, [group.id]: next };
    });
  };

  const optionsTotal = Object.entries(selectedOptions).reduce(
    (sum, [, opts]) => sum + opts.reduce((s, o) => s + o.price_delta, 0),
    0
  );
  const unitPrice = product.base_price + optionsTotal;
  const totalPrice = unitPrice * quantity;

  const isValid = optionGroups.every((group) => {
    const count = (selectedOptions[group.id] || []).length;
    return count >= group.min_choices;
  });

  const handleAddToCart = () => {
    const extras = optionGroups.flatMap((g) =>
      (selectedOptions[g.id] || []).map((o) => ({ name: o.name, price: o.price_delta }))
    );
    addItem({
      product,
      quantity,
      observations: observations.trim() || undefined,
      extras,
    });
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl w-full">
      {/* Imagem só no modo modal; em embedded ela já fica na página pai */}
      <div className="hidden">
        <span>🍔</span>
      </div>

      <div>
        {optionGroups.length > 0 && (
          <div className="space-y-4 mb-4">
            {optionGroups.map((group) => {
              const selected = selectedOptions[group.id] || [];
              return (
                <fieldset key={group.id} className="border border-gray-200 rounded-xl p-3">
                  <legend className="px-2 text-sm font-semibold text-brand-contrast">
                    {group.name}
                    {group.required && <span className="text-red-500 ml-1">*</span>}
                    {group.max_choices > 1 && (
                      <span className="text-xs text-gray-500 ml-2">
                        (escolha até {group.max_choices})
                      </span>
                    )}
                  </legend>
                  <div className="space-y-1">
                    {group.options.map((option) => {
                      const checked = selected.some((o) => o.id === option.id);
                      return (
                        <label
                          key={option.id}
                          className={[
                            'flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer',
                            checked ? 'bg-brand-soft' : 'hover:bg-gray-50',
                          ].join(' ')}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type={group.max_choices === 1 ? 'radio' : 'checkbox'}
                              name={`group-${group.id}`}
                              checked={checked}
                              onChange={() => toggleOption(group, option)}
                              className="accent-brand"
                            />
                            <span className="text-sm">{option.name}</span>
                          </span>
                          {option.price_delta > 0 && (
                            <span className="text-sm font-medium text-brand">
                              + {formatMoney(option.price_delta)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}

        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="text-lg font-bold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover"
              aria-label="Aumentar quantidade"
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
            disabled={!isValid}
            className="flex-1 btn-primary py-3 disabled:opacity-50"
          >
            Adicionar • {formatMoney(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}