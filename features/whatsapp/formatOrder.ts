import { CartItem } from '@/features/cart/CartContext';
import { Store } from '@/types/database';
import { formatMoney } from '@/lib/money';

export interface WhatsAppOrder {
  cartId: string;
  store: Store;
  items: CartItem[];
  subtotal: number;
  minimumOrder: number;
  customerName?: string;
}

function generateCartId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function formatWhatsAppMessage(order: WhatsAppOrder): string {
  const { cartId, store, items, subtotal, minimumOrder } = order;
  const isBelowMinimum = subtotal < minimumOrder;
  const remaining = minimumOrder - subtotal;

  const itemsList = items
    .map((item) => {
      const itemTotal = item.product.base_price * item.quantity;
      let line = `• ${item.quantity}x ${item.product.name}\n  └ ${formatMoney(itemTotal)}`;

      if (item.extras && item.extras.length > 0) {
        const extrasTotal = item.extras.reduce((sum, e) => sum + e.price, 0);
        line += `\n  + ${item.extras.map((e) => `${e.name} (+${formatMoney(e.price)})`).join(', ')}`;
      }

      if (item.removedIngredients && item.removedIngredients.length > 0) {
        line += `\n  - Sem: ${item.removedIngredients.join(', ')}`;
      }

      if (item.observations) {
        line += `\n  📝 ${item.observations}`;
      }

      return line;
    })
    .join('\n\n');

  const totalExtras = items.reduce((sum, item) => {
    return sum + (item.extras?.reduce((s, e) => s + e.price, 0) || 0) * item.quantity;
  }, 0);

  const grandTotal = subtotal + totalExtras;

  let message = `━━━━━━━━━━━━━━━━━━━━
🍔 *${store.name || "Tremeliko's Burguer"}*
━━━━━━━━━━━━━━━━━━━━

📋 *PEDIDO #${cartId}*

${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ${formatMoney(subtotal)}
${totalExtras > 0 ? `🧀 *Adicionais:* ${formatMoney(totalExtras)}\n` : ''}💵 *Total Estimado:* ${formatMoney(grandTotal)}
${isBelowMinimum ? `\n⚠️ *Pedido mínimo:* ${formatMoney(minimumOrder)}\n*Faltam:* ${formatMoney(remaining)}\n` : ''}
━━━━━━━━━━━━━━━━━━━━

📍 *Entrega ou retirada?*
🏠 *Endereço completo:*
💳 *Forma de pagamento:* (Pix/Cartão)
📝 *Observações gerais:*

Aguardo confirmação. Obrigado! 🙏`;

  return message;
}

export function generateShortCartId(): string {
  return generateCartId();
}
