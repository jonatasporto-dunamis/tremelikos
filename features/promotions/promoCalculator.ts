import { Promotion, Product } from '@/types/database';
import { CartItem } from '@/features/cart/CartContext';

export interface CalculatedPrice {
  originalPrice: number;
  finalPrice: number;
  discount: number;
  promotionName: string | null;
  promotionId: string | null;
}

export function isPromotionActive(promotion: Promotion, now: Date = new Date()): boolean {
  if (!promotion.active) return false;
  if (promotion.starts_at && new Date(promotion.starts_at) > now) return false;
  if (promotion.ends_at && new Date(promotion.ends_at) < now) return false;
  if (promotion.weekdays.length > 0) {
    const dayOfWeek = now.getDay();
    if (!promotion.weekdays.includes(dayOfWeek)) return false;
  }
  return true;
}

function computeDiscount(promo: Promotion, basePrice: number): number {
  switch (promo.type) {
    case 'fixed_percent':
      return basePrice * (promo.value / 100);
    case 'fixed_amount':
      return promo.value;
    case 'product_price':
      return basePrice - promo.value;
    default:
      return 0;
  }
}

/**
 * Calcula o preço de um produto aplicando a melhor promoção.
 *
 * Regra de prioridade: a promoção com maior `priority` vence. Em empate,
 * vence a que concede maior desconto (nunca acumula). Promoções inválidas
 * (fora de período/dia ou inativas) são descartadas.
 */
export function calculateProductPrice(
  product: Product,
  promotions: Promotion[],
  productPromoIds: Set<string> = new Set(promotions.map((p) => p.id)),
  now: Date = new Date()
): CalculatedPrice {
  const eligible = promotions.filter((promo) => {
    if (!isPromotionActive(promo, now)) return false;
    if (productPromoIds.size > 0 && !productPromoIds.has(promo.id)) return false;
    return true;
  });

  let bestPromotion: Promotion | null = null;
  let maxDiscount = 0;

  for (const promo of eligible) {
    const discount = computeDiscount(promo, product.base_price);
    if (discount <= 0) continue;

    const higherPriority =
      bestPromotion === null || promo.priority > bestPromotion.priority;
    const samePriorityHigherDiscount =
      bestPromotion !== null &&
      promo.priority === bestPromotion.priority &&
      discount > maxDiscount;

    if (higherPriority || samePriorityHigherDiscount) {
      maxDiscount = discount;
      bestPromotion = promo;
    }
  }

  const finalPrice = Math.max(0, product.base_price - maxDiscount);

  return {
    originalPrice: product.base_price,
    finalPrice,
    discount: maxDiscount,
    promotionName: bestPromotion?.name || null,
    promotionId: bestPromotion?.id || null,
  };
}

export interface CartTotal {
  subtotal: number;
  totalDiscount: number;
  couponDiscount: number;
  finalTotal: number;
  appliedPromotions: Array<{
    productId: string;
    productName: string;
    promotionName: string;
    discount: number;
  }>;
  couponCode: string | null;
  couponError: string | null;
}

export function calculateCartTotal(
  items: CartItem[],
  promotions: Promotion[],
  productPromoIds: Map<string, Set<string>> = new Map(),
  coupon: { code: string; type: 'fixed_percent' | 'fixed_amount'; value: number; minimum_order: number } | null = null,
  now: Date = new Date()
): CartTotal {
  let subtotal = 0;
  let totalDiscount = 0;
  const appliedPromotions: CartTotal['appliedPromotions'] = [];

  for (const item of items) {
    const ids = productPromoIds.get(item.product.id);
    const calculated = calculateProductPrice(item.product, promotions, ids, now);
    subtotal += calculated.originalPrice * item.quantity;
    totalDiscount += calculated.discount * item.quantity;

    const extrasTotal = item.extras?.reduce((sum, e) => sum + e.price, 0) || 0;
    subtotal += extrasTotal * item.quantity;

    if (calculated.promotionName && calculated.discount > 0) {
      appliedPromotions.push({
        productId: item.product.id,
        productName: item.product.name,
        promotionName: calculated.promotionName,
        discount: calculated.discount * item.quantity,
      });
    }
  }

  let couponDiscount = 0;
  let couponError: string | null = null;
  let couponCode: string | null = null;

  if (coupon) {
    couponCode = coupon.code;
    if (subtotal < coupon.minimum_order) {
      couponError = `Pedido mínimo para este cupom: ${coupon.minimum_order.toFixed(2).replace('.', ',')}`;
    } else {
      if (coupon.type === 'fixed_percent') {
        couponDiscount = subtotal * (coupon.value / 100);
      } else {
        couponDiscount = coupon.value;
      }
      couponDiscount = Math.min(couponDiscount, subtotal - totalDiscount);
    }
  }

  const finalTotal = Math.max(0, subtotal - totalDiscount - couponDiscount);

  return {
    subtotal,
    totalDiscount,
    couponDiscount,
    finalTotal,
    appliedPromotions,
    couponCode,
    couponError,
  };
}