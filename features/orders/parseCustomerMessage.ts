import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/server';

const CONFIRM_PATTERNS = [
  /\b(confirmo|confirmar|confirmado|pode\s*fazer|pode\s*preparar|aprovado|aprovado!)\b/i,
  /\b(ok|👍|✅)\s*(pode|confirmo|fechado|fechou)/i,
];

const CANCEL_PATTERNS = [
  /\b(cancelar|cancelado|cancela|desistir|não\s*quero)\b/i,
];

export interface ParsedMessage {
  isConfirmation: boolean;
  isCancellation: boolean;
  orderId?: string;
}

/**
 * Tenta extrair orderId de uma mensagem de WhatsApp do cliente.
 * Procura padrões como:
 *  - "PEDIDO #ABC123"
 *  - "order #..."
 *  - número curto após #
 */
export function parseCustomerMessage(body: string): ParsedMessage {
  const isConfirmation = CONFIRM_PATTERNS.some((re) => re.test(body));
  const isCancellation = CANCEL_PATTERNS.some((re) => re.test(body));

  // tenta achar referência ao pedido
  const idMatch = body.match(/#\s*([A-Z0-9]{4,12})/i);
  const orderId = idMatch ? idMatch[1].toUpperCase() : undefined;

  return { isConfirmation, isCancellation, orderId };
}

/**
 * Aplica a confirmação/cancelamento ao(s) pedido(s) do cliente.
 * Se o orderId for identificado, atualiza só esse; senão, atualiza o mais recente do telefone.
 */
export async function applyMessageToOrder(phone: string, parsed: ParsedMessage): Promise<{ updated: number; status: string } | null> {
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return null;
  const phoneWithDDI = digits.length >= 10 && digits.length <= 11 ? `55${digits}` : digits;

  let query = supabaseAdmin
    .from('orders')
    .select('id, status, contact_phone, cart_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (parsed.orderId) {
    query = supabaseAdmin
      .from('orders')
      .select('id, status, contact_phone, cart_id, created_at')
      .or(`cart_id.ilike.%${parsed.orderId}%,id.ilike.%${parsed.orderId}%`)
      .order('created_at', { ascending: false })
      .limit(1);
  }

  const { data: orders } = await query;
  if (!orders || orders.length === 0) return null;

  // filtra por telefone (somente os que pertencem ao cliente)
  const candidates = orders.filter((o) => {
    const cp = (o.contact_phone || '').replace(/\D/g, '');
    return cp.endsWith(phoneWithDDI) || phoneWithDDI.endsWith(cp);
  });
  const target = candidates[0] || orders[0];
  if (!target) return null;

  const newStatus = parsed.isCancellation
    ? 'cancelled'
    : parsed.isConfirmation
      ? 'confirmed'
      : null;
  if (!newStatus) return null;
  if (target.status === newStatus) return { updated: 0, status: newStatus };

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: newStatus,
      confirmed_at: newStatus === 'confirmed' ? new Date().toISOString() : null,
    })
    .eq('id', target.id);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from('audit_logs').insert({
    action: `order_${newStatus}_via_whatsapp`,
    entity: 'order',
    entity_id: target.id,
    payload: { fromPhone: phoneWithDDI, messageMatch: parsed },
  });

  // se confirmou, incrementa total_orders do customer
  if (newStatus === 'confirmed') {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('customer_id')
      .eq('id', target.id)
      .single();
    if (order?.customer_id) {
      await supabaseAdmin.rpc('increment_customer_orders', { customer_id: order.customer_id })
        .then(() => null, () => null); // best-effort
      // fallback: update direto
      const { data: c } = await supabaseAdmin
        .from('customers')
        .select('total_orders')
        .eq('id', order.customer_id)
        .single();
      if (c) {
        await supabaseAdmin
          .from('customers')
          .update({
            total_orders: (c.total_orders || 0) + 1,
            last_order_at: new Date().toISOString(),
            lead_score: Math.min(100, ((c.total_orders || 0) + 1) * 25 + 20),
          })
          .eq('id', order.customer_id);
      }
    }
  }

  return { updated: 1, status: newStatus };
}
