import { NextRequest, NextResponse } from 'next/server';
import { waha } from '@/lib/waha';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildServerOrder } from '@/features/whatsapp/buildServerOrder';
import { formatWhatsAppMessage, generateShortCartId } from '@/features/whatsapp/formatOrder';
import { createOrFindOrder } from '@/features/orders/createOrder';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { OrderItemInput } from '@/features/orders/canonicalCart';

const WHATSAPP_SEND_LIMIT = { interval: 60_000, maxRequests: 5 };

export interface SendWhatsAppRequest {
  phone: string;
  storeId: string;
  cartId?: string;
  transactionId?: string;
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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`whatsapp:send:${ip}`, WHATSAPP_SEND_LIMIT);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
  }

  try {
    const body: SendWhatsAppRequest = await request.json();
    const {
      phone,
      storeId,
      cartId,
      transactionId,
      customerName,
      contact,
      items,
      couponCode,
      scheduledFor,
      orderType,
      paymentMethod,
      deliveryAddress,
      deliveryFee,
    } = body;

    if (!phone || !storeId || !items?.length) {
      return NextResponse.json(
        { success: false, error: 'phone, storeId and items are required' },
        { status: 400 }
      );
    }

    if (scheduledFor) {
      const d = new Date(scheduledFor);
      if (Number.isNaN(d.getTime()) || d.getTime() < Date.now() - 60_000) {
        return NextResponse.json(
          { success: false, error: 'scheduledFor inválido ou no passado' },
          { status: 400 }
        );
      }
    }

    const canonicalCartId = cartId || generateShortCartId();
    const canonicalTransactionId = transactionId || `wa_${canonicalCartId}`;

    const { order } = await buildServerOrder({
      storeId,
      cartId: canonicalCartId,
      customerName,
      contact,
      items,
      couponCode,
      scheduledFor,
      orderType,
      paymentMethod,
      deliveryAddress,
      deliveryFee,
    });

    const savedOrder = await createOrFindOrder({
      storeId,
      customer: {
        name: contact?.name || customerName || '',
        phone: contact?.phone || phone,
        email: contact?.email,
      },
      items,
      couponCode,
      deliveryAddress: orderType === 'delivery' && deliveryAddress?.address
        ? { address: deliveryAddress.address, neighborhood: deliveryAddress.neighborhood, city: deliveryAddress.city, zip: deliveryAddress.zip, complement: deliveryAddress.complement }
        : undefined,
      paymentMethod: paymentMethod || 'whatsapp',
      orderType: orderType || 'pickup',
      cartId: canonicalCartId,
      transactionId: canonicalTransactionId,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      source: 'web',
    });

    const message = formatWhatsAppMessage({
      ...order,
      deliveryFee: savedOrder.deliveryFee,
      finalTotal: (order.finalTotal || 0) - (order.deliveryFee || 0) + savedOrder.deliveryFee,
    });

    const result = await waha.sendMessage(phone, message);

    if (result.success) {
      await supabaseAdmin.from('audit_logs').insert({
        store_id: storeId,
        action: scheduledFor ? 'whatsapp_order_scheduled' : 'whatsapp_order_sent',
        entity: 'order',
        entity_id: savedOrder.orderId,
        payload: {
          cartId: order.cartId,
          transactionId: canonicalTransactionId,
          phone,
          messageId: result.messageId,
          scheduledFor: scheduledFor || null,
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      orderId: savedOrder.orderId,
      cartId: order.cartId,
      transactionId: canonicalTransactionId,
      finalTotal: (order.finalTotal || 0) - (order.deliveryFee || 0) + savedOrder.deliveryFee,
      deliveryFee: savedOrder.deliveryFee,
      scheduledFor: scheduledFor || null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
