import { CartItem } from '@/features/cart/CartContext';
import { Store } from '@/types/database';
import { formatMoney } from '@/lib/money';

export interface AppliedPromotion {
  productId: string;
  productName: string;
  promotionName: string;
  discount: number;
}

export interface AppliedCouponInfo {
  code: string;
  discount: number;
}

export interface WhatsAppOrder {
  cartId: string;
  store: Store;
  items: CartItem[];
  subtotal: number;
  minimumOrder: number;
  promotions?: AppliedPromotion[];
  coupon?: AppliedCouponInfo | null;
  totalDiscount?: number;
  finalTotal?: number;
  customerName?: string;
}

function generateCartId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function formatWhatsAppMessage(order: WhatsAppOrder): string {
  const {
    cartId, store, items, subtotal, minimumOrder,
    promotions = [], coupon = null,
    totalDiscount = 0, finalTotal,
    customerName,
  } = order;

  const computedFinalTotal = finalTotal ?? Math.max(0, subtotal - totalDiscount);
  const isBelowMinimum = computedFinalTotal < minimumOrder;
  const remaining = minimumOrder - computedFinalTotal;

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

  let message = `━━━━━━━━━━━━━━━━━━━━
🍔 *${store.name || "Tremeliko's Burguer"}*
━━━━━━━━━━━━━━━━━━━━

${customerName ? `👤 *Cliente:* ${customerName}\n` : ''}📋 *PEDIDO #${cartId}*

${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ${formatMoney(subtotal)}`;

  if (totalExtras > 0) {
    message += `\n🧀 *Adicionais:* ${formatMoney(totalExtras)}`;
  }

  if (promotions.length > 0) {
    const promoLines = promotions
      .map((p) => `   • ${p.productName}: ${p.promotionName} (− ${formatMoney(p.discount)})`)
      .join('\n');
    message += `\n🏷️ *Promoções:* − ${formatMoney(promotions.reduce((s, p) => s + p.discount, 0))}\n${promoLines}`;
  }

  if (coupon) {
    message += `\n🎟️ *Cupom:* ${coupon.code} (− ${formatMoney(coupon.discount)})`;
  }

  message += `\n💵 *Total Estimado:* ${formatMoney(computedFinalTotal)}`;

  if (isBelowMinimum) {
    message += `\n\n⚠️ *Pedido mínimo:* ${formatMoney(minimumOrder)}\n*Faltam:* ${formatMoney(remaining)}`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━

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