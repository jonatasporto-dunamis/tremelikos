import { NextRequest, NextResponse } from 'next/server';
import { waha } from '@/lib/waha';
import { supabaseAdmin } from '@/lib/supabase/server';

export interface SendWhatsAppRequest {
  phone: string;
  message: string;
  cartId: string;
  storeId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendWhatsAppRequest = await request.json();
    const { phone, message, cartId, storeId } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone and message are required' },
        { status: 400 }
      );
    }

    const result = await waha.sendMessage(phone, message);

    if (result.success) {
      await supabaseAdmin.from('audit_logs').insert({
        store_id: storeId,
        action: 'whatsapp_order_sent',
        entity: 'order',
        entity_id: null,
        payload: { cartId, phone, messageId: result.messageId },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
