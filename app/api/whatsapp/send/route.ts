import { NextRequest, NextResponse } from 'next/server';
import { waha } from '@/lib/waha';
import { supabaseAdmin } from '@/lib/supabase/server';

export interface SendWhatsAppRequest {
  phone: string;
  message: string;
  cartId: string;
  storeId: string;
  scheduledFor?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendWhatsAppRequest = await request.json();
    const { phone, message, cartId, storeId, scheduledFor } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone and message are required' },
        { status: 400 }
      );
    }

    // 9.8.3 — validar scheduledFor (não pode ser no passado)
    let scheduledDate: Date | null = null;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'scheduledFor inválido' },
          { status: 400 }
        );
      }
      if (scheduledDate.getTime() < Date.now() - 60_000) {
        return NextResponse.json(
          { success: false, error: 'scheduledFor não pode ser no passado' },
          { status: 400 }
        );
      }
    }

    const result = await waha.sendMessage(phone, message);

    if (result.success) {
      await supabaseAdmin.from('audit_logs').insert({
        store_id: storeId,
        action: scheduledDate ? 'whatsapp_order_scheduled' : 'whatsapp_order_sent',
        entity: 'order',
        entity_id: null,
        payload: {
          cartId,
          phone,
          messageId: result.messageId,
          scheduledFor: scheduledDate ? scheduledDate.toISOString() : null,
        },
      });
    }

    return NextResponse.json({ ...result, scheduledFor: scheduledDate ? scheduledDate.toISOString() : null });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
