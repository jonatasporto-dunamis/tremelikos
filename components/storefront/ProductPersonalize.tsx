'use client';

import { Product } from '@/types/database';
import type { OptionGroup } from './ProductModal';
import ProductModal from './ProductModal';

interface Props {
  product: Product;
  optionGroups: OptionGroup[];
}

export default function ProductPersonalize({ product, optionGroups }: Props) {
  return (
    <ProductModal
      product={product}
      optionGroups={optionGroups}
      onClose={() => {
        if (typeof window !== 'undefined') {
          if (window.history.length > 1) window.history.back();
          else window.location.href = '/';
        }
      }}
    />
  );
}