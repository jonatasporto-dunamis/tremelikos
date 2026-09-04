'use client';

import { Product } from '@/types/database';
import { formatMoney } from '@/lib/money';
import { useCart } from '@/features/cart/CartContext';
import { useState, useEffect } from 'react';
import { useFocusTrap } from '@/lib/useFocusTrap';

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

export interface AddedItem {
  product: Product;
  quantity: number;
  observations?: string;
  extras: Array<{ name: string; price: number }>;
  removedIngredients?: string[];
  unitPrice: number;
  totalPrice: number;
}

interface ProductModalProps {
  product: Product;
  optionGroups?: OptionGroup[];
  onClose: () => void;
  /** Quando definido, em vez de adicionar ao carrinho, devolve o item montado */
  onAdded?: (item: AddedItem) => void;
  /** Página cheia (ProductPersonalize) usa 'page' para focus trap próprio */
  mode?: 'embedded' | 'page';
}

export default function ProductModal({
  product,
  optionGroups = [],
  onClose,
  onAdded,
  mode = 'embedded',
}: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, OptionItem[]>>({});
  const [showValidation, setShowValidation] = useState(false);

  // focus trap + Escape só no modo 'page' (tela cheia / drawer)
  const containerRef = useFocusTrap({
    active: mode === 'page',
    onClose,
    initialFocus: 'first',
  });

  // trava scroll quando é página cheia
  useEffect(() => {
    if (mode !== 'page') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mode]);

  const toggleOption = (group: OptionGroup, option: OptionItem) => {
    setShowValidation(false);
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

  const missingRequired = optionGroups
    .filter((g) => g.required && (selectedOptions[g.id] || []).length < g.min_choices)
    .map((g) => g.name);

  const isValid = missingRequired.length === 0;

  const handleAddToCart = () => {
    if (!isValid) {
      setShowValidation(true);
      // foca primeiro fieldset inválido
      const firstInvalid = containerRef.current?.querySelector<HTMLElement>(
        'fieldset[data-invalid="true"] input, fieldset[data-invalid="true"] button'
      );
      firstInvalid?.focus();
      return;
    }
    const extras: Array<{ name: string; price: number }> = [];
    const removedIngredients: string[] = [];
    for (const g of optionGroups) {
      const selected = selectedOptions[g.id] || [];
      if (/remover|sem/i.test(g.name)) {
        for (const o of selected) removedIngredients.push(o.name);
      } else {
        for (const o of selected) extras.push({ name: o.name, price: o.price_delta });
      }
    }
    const item: AddedItem = {
      product,
      quantity,
      observations: observations.trim() || undefined,
      extras,
      removedIngredients: removedIngredients.length > 0 ? removedIngredients : undefined,
      unitPrice,
      totalPrice,
    };
    if (onAdded) {
      onAdded(item);
    } else {
      addItem({
        product,
        quantity,
        observations: observations.trim() || undefined,
        extras,
        removedIngredients: removedIngredients.length > 0 ? removedIngredients : undefined,
      });
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-white w-full"
      role={mode === 'page' ? 'dialog' : undefined}
      aria-modal={mode === 'page' ? 'true' : undefined}
    >
      {optionGroups.length > 0 && (
        <div className="space-y-4 mb-4">
          {optionGroups.map((group) => {
            const selected = selectedOptions[group.id] || [];
            const invalid = showValidation && group.required && selected.length < group.min_choices;
            return (
              <fieldset
                key={group.id}
                data-invalid={invalid ? 'true' : 'false'}
                className={`border rounded-xl p-3 transition-colors ${
                  invalid ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? `err-${group.id}` : undefined}
              >
                <legend className="px-2 text-sm font-semibold text-brand-contrast">
                  {group.name}
                  {group.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
                  {group.max_choices > 1 && (
                    <span className="text-xs text-ink-muted ml-2 font-normal">
                      (escolha até {group.max_choices})
                    </span>
                  )}
                </legend>
                <div className="space-y-1" role={group.max_choices === 1 ? 'radiogroup' : 'group'}>
                  {group.options.map((option) => {
                    const checked = selected.some((o) => o.id === option.id);
                    const inputId = `opt-${group.id}-${option.id}`;
                    return (
                      <label
                        key={option.id}
                        htmlFor={inputId}
                        className={[
                          'flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer min-h-[44px]',
                          checked ? 'bg-brand-soft' : 'hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            id={inputId}
                            type={group.max_choices === 1 ? 'radio' : 'checkbox'}
                            name={`group-${group.id}`}
                            checked={checked}
                            onChange={() => toggleOption(group, option)}
                            className="accent-brand w-4 h-4"
                          />
                          <span className="text-sm">{option.name}</span>
                        </span>
                        {option.price_delta > 0 && (
                          <span className="text-sm font-medium text-brand whitespace-nowrap">
                            + {formatMoney(option.price_delta)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {invalid && (
                  <p id={`err-${group.id}`} role="alert" className="mt-2 text-xs text-red-700">
                    Escolha {group.min_choices === 1 ? 'uma opção' : `pelo menos ${group.min_choices}`} de “{group.name}”.
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>
      )}

      <div className="mt-2">
        <label className="block text-sm font-medium text-ink mb-1">Quantidade</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40"
            aria-label="Diminuir quantidade"
          >
            <span aria-hidden="true" className="text-lg leading-none">−</span>
          </button>
          <span aria-live="polite" className="text-lg font-bold w-8 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover"
            aria-label="Aumentar quantidade"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="obs" className="block text-sm font-medium text-ink mb-1">
          Observações
        </label>
        <textarea
          id="obs"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Ex: sem cebola, ponto da carne..."
          className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none min-h-[48px]"
          rows={2}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isValid && showValidation}
          className="flex-1 btn-primary py-3 min-h-[48px] disabled:opacity-50"
        >
          Adicionar • {formatMoney(totalPrice)}
        </button>
      </div>
    </div>
  );
}