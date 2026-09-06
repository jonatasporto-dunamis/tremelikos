import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateCartTotal } from '@/features/promotions/promoCalculator';
import { generateShortCartId } from './formatOrder';
import type { WhatsAppOrder } from './formatOrder';
import { loadCanonicalCartItems, type OrderItemInput } from '@/features/orders/canonicalCart';
import { loadValidCoupon } from '@/features/orders/couponValidation';

export interface SendOrderPayload {
  storeId: string;
  cartId?: string;
  customerName?: string;
  contact?: { name?: string; phone?: string; email?: string };
  items: OrderItemInput[];
  couponCode?: string | null;
  scheduledFor?: string | null;
  orderType?: 'pickup' | 'delivery';
  paymentMethod?: 'pix' | 'cash' | 'card' | 'whatsapp';
  deliveryAddress?: {
    address?: string;
    neighborhood?: string;
    city?: string;
    zip?: string;
    complement?: string;
  };
  deliveryFee?: number;
}

export async function buildServerOrder(payload: SendOrderPayload) {
  const cartId = payload.cartId || generateShortCartId();
  const [{ data: store }, { data: promos }, { data: links }, couponObj] = await Promise.all([
    supabaseAdmin.from('stores').select('*').eq('id', payload.storeId).maybeSingle(),
    supabaseAdmin
      .from('promotions')
      .select('id, store_id, name, type, value, starts_at, ends_at, weekdays, priority, active')
      .eq('active', true)
      .or(`store_id.is.null,store_id.eq.${payload.storeId}`),
    supabaseAdmin.from('promotion_products').select('promotion_id, product_id'),
    loadValidCoupon(payload.storeId, payload.couponCode),
  ]);

  if (!store) throw new Error('store_not_found');

  const { items } = await loadCanonicalCartItems({
    storeId: payload.storeId,
    items: payload.items,
  });

  const promotions = (promos || []) as any[];
  const productPromoIds = new Map<string, Set<string>>();
  for (const l of links || []) {
    const ids = productPromoIds.get(l.product_id) || new Set<string>();
    ids.add(l.promotion_id);
    productPromoIds.set(l.product_id, ids);
  }

  const total = calculateCartTotal(items, promotions, productPromoIds, couponObj);
  const deliveryFee = payload.orderType === 'delivery' ? Math.max(0, Number(payload.deliveryFee || 0)) : 0;
  const appliedPromotions = total.appliedPromotions.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    promotionName: p.promotionName,
    discount: p.discount,
  }));

  const order: WhatsAppOrder = {
    cartId,
    store,
    items,
    subtotal: total.subtotal,
    minimumOrder: store.minimum_order || 15,
    promotions: appliedPromotions,
    coupon: couponObj
      ? { code: couponObj.code, discount: total.couponDiscount }
      : null,
    totalDiscount: total.totalDiscount + total.couponDiscount,
    finalTotal: total.finalTotal + deliveryFee,
    customerName: payload.customerName || payload.contact?.name,
    contact: payload.contact,
    scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : undefined,
    orderType: payload.orderType,
    paymentMethod: payload.paymentMethod,
    deliveryAddress: payload.deliveryAddress,
    deliveryFee,
  };

  return { order, total };
}
