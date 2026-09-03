'use client';

import { Product } from '@/types/database';
import type { OptionGroup } from './ProductModal';
import ProductModal from './ProductModal';
import { useCart } from '@/features/cart/CartContext';
import { useRouter } from 'next/navigation';

interface Props {
  product: Product;
  optionGroups: OptionGroup[];
}

export default function ProductPersonalize({ product, optionGroups }: Props) {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <ProductModal
      product={product}
      optionGroups={optionGroups}
      mode="page"
      onClose={() => {
        if (typeof window !== 'undefined') {
          if (window.history.length > 1) router.back();
          else router.push('/');
        }
      }}
      onAdded={(item) => {
        addItem({
          product: item.product,
          quantity: item.quantity,
          observations: item.observations,
          extras: item.extras,
          removedIngredients: item.removedIngredients,
        });
        router.push('/carrinho');
      }}
    />
  );
}