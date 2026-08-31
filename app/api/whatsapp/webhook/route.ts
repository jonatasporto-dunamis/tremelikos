import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface WahaWebhookEvent {
  event: string;
  session: string;
  payload: {
    id?: string;
    from?: string;
    to?: string;
    body?: string;
    type?: string;
    timestamp?: number;
    ack?: number;
    metadata?: Record<string, unknown>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: WahaWebhookEvent = await request.json();
    const { event, session, payload } = body;

    switch (event) {
      case 'message':
        await handleIncomingMessage(payload);
        break;
      case 'message.ack':
        await handleMessageAck(payload);
        break;
      case 'session.status':
        await handleSessionStatus(payload);
        break;
      default:
        console.log(`Unhandled WAHA event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleIncomingMessage(payload: WahaWebhookEvent['payload']) {
  if (!payload.body || !payload.from) return;

  const phone = payload.from.replace('@c.us', '');

  await supabaseAdmin.from('audit_logs').insert({
    action: 'whatsapp_message_received',
    entity: 'message',
    entity_id: null,
    payload: {
      phone,
      body: payload.body,
      messageId: payload.id,
      timestamp: payload.timestamp,
    },
  });
}

async function handleMessageAck(payload: WahaWebhookEvent['payload']) {
  if (!payload.id) return;

  await supabaseAdmin.from('audit_logs').insert({
    action: 'whatsapp_message_ack',
    entity: 'message',
    entity_id: null,
    payload: {
      messageId: payload.id,
      ack: payload.ack,
    },
  });
}

async function handleSessionStatus(payload: WahaWebhookEvent['payload']) {
  await supabaseAdmin.from('audit_logs').insert({
    action: 'whatsapp_session_status',
    entity: 'session',
    entity_id: null,
    payload: {
      status: payload.type,
    },
  });
}
