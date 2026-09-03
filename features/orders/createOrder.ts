import { supabaseAdmin } from '@/lib/supabase/server';
import type { CartItem } from '@/features/cart/CartContext';
import type { AppliedPromotion, AppliedCouponInfo } from '@/features/whatsapp/formatOrder';

export interface CreateOrderParams {
  storeId: string;
  customer: { name: string; phone: string; email?: string };
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  deliveryFee?: number;
  deliveryAddress?: {
    address: string;
    neighborhood?: string;
    city?: string;
    zip?: string;
    complement?: string;
  };
  paymentMethod: 'pix' | 'cash' | 'card' | 'whatsapp';
  orderType: 'pickup' | 'delivery';
  notes?: string;
  scheduledFor?: Date | null;
  cartId: string;
  transactionId: string;
  source?: string;
  utm?: Record<string, string | undefined>;
  promotions?: AppliedPromotion[];
  coupon?: AppliedCouponInfo | null;
}

export interface CreatedOrder {
  id: string;
  customerId: string;
  orderId: string;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // garante DDI 55 (Brasil)
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Cria/atualiza customer e cria order + order_items em transação.
 * Idempotente via `cart_id` (se já existir, retorna o existente).
 */
export async function createOrFindOrder(params: CreateOrderParams): Promise<CreatedOrder> {
  // 0) checar idempotência por cart_id
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('id, customer_id')
    .eq('cart_id', params.cartId)
    .maybeSingle();
  if (existing) {
    return { id: existing.id, customerId: existing.customer_id || '', orderId: existing.id };
  }

  // 1) upsert customer
  const phone = normalizePhone(params.customer.phone);
  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers')
    .upsert(
      {
        store_id: params.storeId,
        phone,
        name: params.customer.name,
        email: params.customer.email || null,
        source: 'whatsapp_first',
      },
      { onConflict: 'store_id,phone' }
    )
    .select('id, total_orders')
    .single();
  if (custErr || !customer) throw new Error(`customer: ${custErr?.message || 'no row'}`);

  // 2) lead score heurístico simples
  const leadScore = Math.min(100, 20 + (customer.total_orders || 0) * 25);

  // 3) criar order
  const { data: order, error: ordErr } = await supabaseAdmin
    .from('orders')
    .insert({
      store_id: params.storeId,
      customer_id: customer.id,
      cart_id: params.cartId,
      transaction_id: params.transactionId,
      status: 'pending',
      order_type: params.orderType,
      payment_method: params.paymentMethod,
      delivery_fee: params.deliveryFee || 0,
      subtotal: params.subtotal,
      discount: params.discount,
      total: params.total,
      delivery_address: params.deliveryAddress?.address || null,
      delivery_neighborhood: params.deliveryAddress?.neighborhood || null,
      delivery_city: params.deliveryAddress?.city || null,
      delivery_zip: params.deliveryAddress?.zip || null,
      delivery_complement: params.deliveryAddress?.complement || null,
      scheduled_for: params.scheduledFor?.toISOString() || null,
      notes: params.notes || null,
      contact_name: params.customer.name,
      contact_phone: phone,
      contact_email: params.customer.email || null,
      source: params.source || 'web',
      utm: params.utm || null,
    })
    .select('id')
    .single();
  if (ordErr || !order) throw new Error(`order: ${ordErr?.message || 'no row'}`);

  // 4) order_items
  const items = params.items.map((it, idx) => {
    const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
    const unit = it.product.base_price + extras;
    return {
      order_id: order.id,
      product_id: it.product.id,
      product_name: it.product.name,
      product_slug: it.product.slug,
      quantity: it.quantity,
      unit_price: unit,
      total_price: unit * it.quantity,
      extras: it.extras || [],
      removed_ingredients: it.removedIngredients || [],
      observations: it.observations || null,
      position: idx,
    };
  });
  if (items.length > 0) {
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(items);
    if (itemsErr) throw new Error(`order_items: ${itemsErr.message}`);
  }

  // 5) atualiza lead_score + total_orders
  await supabaseAdmin
    .from('customers')
    .update({ lead_score: leadScore })
    .eq('id', customer.id);

  return { id: order.id, customerId: customer.id, orderId: order.id };
}

export async function updateOrderStatus(orderId: string, status: typeof ORDER_STATUSES[number]) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : undefined })
    .eq('id', orderId);
  if (error) throw new Error(error.message);
}

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'scheduled',
] as const;
