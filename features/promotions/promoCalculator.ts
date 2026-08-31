import { Promotion, Product } from '@/types/database';
import { CartItem } from '@/features/cart/CartContext';

export interface CalculatedPrice {
  originalPrice: number;
  finalPrice: number;
  discount: number;
  promotionName: string | null;
}

export function calculateProductPrice(
  product: Product,
  promotions: Promotion[]
): CalculatedPrice {
  let finalPrice = product.base_price;
  let bestPromotion: Promotion | null = null;
  let maxDiscount = 0;

  const now = new Date();
  const dayOfWeek = now.getDay();

  for (const promo of promotions) {
    if (!promo.active) continue;
    if (promo.starts_at && new Date(promo.starts_at) > now) continue;
    if (promo.ends_at && new Date(promo.ends_at) < now) continue;
    if (promo.weekdays.length > 0 && !promo.weekdays.includes(dayOfWeek)) continue;

    let discount = 0;

    switch (promo.type) {
      case 'fixed_percent':
        discount = product.base_price * (promo.value / 100);
        break;
      case 'fixed_amount':
        discount = promo.value;
        break;
      case 'product_price':
        discount = product.base_price - promo.value;
        break;
    }

    if (discount > maxDiscount && discount > 0) {
      maxDiscount = discount;
      bestPromotion = promo;
    }
  }

  finalPrice = Math.max(0, product.base_price - maxDiscount);

  return {
    originalPrice: product.base_price,
    finalPrice,
    discount: maxDiscount,
    promotionName: bestPromotion?.name || null,
  };
}

export function calculateCartTotal(
  items: CartItem[],
  promotions: Promotion[]
): {
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const calculated = calculateProductPrice(item.product, promotions);
    subtotal += calculated.originalPrice * item.quantity;
    totalDiscount += calculated.discount * item.quantity;

    const extrasTotal = item.extras?.reduce((sum, e) => sum + e.price, 0) || 0;
    subtotal += extrasTotal * item.quantity;
  }

  return {
    subtotal,
    totalDiscount,
    finalTotal: subtotal - totalDiscount,
  };
}

export function isPromotionActive(promotion: Promotion): boolean {
  const now = new Date();

  if (!promotion.active) return false;
  if (promotion.starts_at && new Date(promotion.starts_at) > now) return false;
  if (promotion.ends_at && new Date(promotion.ends_at) < now) return false;

  if (promotion.weekdays.length > 0) {
    const dayOfWeek = now.getDay();
    if (!promotion.weekdays.includes(dayOfWeek)) return false;
  }

  return true;
}
