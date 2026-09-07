'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { usePromotions } from '@/features/promotions/usePromotions';
import { calculateProductPrice } from '@/features/promotions/promoCalculator';
import { formatMoney } from '@/lib/money';
import { formatWhatsAppMessage, generateShortCartId } from '@/features/whatsapp/formatOrder';
import CheckoutProgress from '@/components/storefront/CheckoutProgress';
import {
  trackBeginCheckout,
  trackPurchase,
  trackWhatsAppOrder,
  trackScheduledOrder,
  getContact,
} from '@/features/analytics/events';
import { loadSaved, type DeliveryAddress } from '@/features/checkout/storage';

type Method = 'pix' | 'cash' | 'card' | 'whatsapp';

const METHOD_LABEL: Record<Method, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  card: 'Cartão',
  whatsapp: 'Combinar no WhatsApp',
};

export default function EnviarPage() {
  const router = useRouter();
  const { state, itemCount } = useCart();
  const { store, isClosed, nextOpenAt } = useStore();
  const { total, promotions, productPromoIds } = usePromotions();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(() => {
    const saved = loadSaved();
    return saved.deliveryAddress || null;
  });
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>(() => {
    const saved = loadSaved();
    return saved.orderType || 'pickup';
  });
  const [paymentMethod, setPaymentMethod] = useState<Method>(() => {
    const saved = loadSaved();
    return saved.paymentMethod || 'pix';
  });
  const [deliveryFee, setDeliveryFee] = useState(() => {
    const saved = loadSaved();
    return saved.deliveryFee || 0;
  });
  const beginTracked = useRef<string | null>(null);
  const setMethodState = (m: Method) => setPaymentMethod(m);

  useEffect(() => {
    if (state.items.length === 0) {
      router.replace('/carrinho');
      return;
    }
    if (isClosed) {
      router.replace('/');
      return;
    }
    const contact = getContact();
    if (!contact?.phone) {
      router.replace('/carrinho/identificacao');
      return;
    }
    const saved = loadSaved();
    if (!saved.orderType) {
      router.replace('/carrinho/entrega');
      return;
    }
    if (beginTracked.current) return;
    const items = state.items.map((it) => {
      const promo = calculateProductPrice(
        it.product,
        promotions,
        productPromoIds.get(it.product.id)
      );
      const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
      return {
        item_id: it.product.id,
        item_name: it.product.name,
        price: promo.finalPrice + extras,
        quantity: it.quantity,
      };
    });
    trackBeginCheckout(total.finalTotal, items, orderType);
    beginTracked.current = `${items.length}-${total.finalTotal}`;
  }, [state.items, total.finalTotal, router, orderType, promotions, productPromoIds]);

  const minimumOrder = store?.minimum_order || 15.0;
  const finalWithFee = total.finalTotal + deliveryFee;
  const isBelowMinimum = itemCount > 0 && finalWithFee < minimumOrder;

  const handleSendWhatsApp = async (scheduledFor: Date | null) => {
    setSending(true);
    setError(null);
    try {
      const contact = getContact();
      if (!contact) throw new Error('Contato não identificado');
      const cartId = generateShortCartId();
      const transactionId = `wa_${cartId}`;
      const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';
      if (scheduledFor) trackScheduledOrder(scheduledFor.toISOString());

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          storeId: store?.id,
          cartId,
          transactionId,
          customerName: contact.name,
          contact,
          items: state.items,
          couponCode: total.couponCode,
          scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
          orderType,
          paymentMethod,
          deliveryAddress: orderType === 'delivery' ? (deliveryAddress as DeliveryAddress) : undefined,
          deliveryFee,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setSent(true);
        const items = state.items.map((it) => {
          const promo = calculateProductPrice(
            it.product,
            promotions,
            productPromoIds.get(it.product.id)
          );
          const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
          return {
            item_id: it.product.id,
            item_name: it.product.name,
            price: promo.finalPrice + extras,
            quantity: it.quantity,
          };
        });
        trackPurchase({
          transaction_id: transactionId,
          value: result.finalTotal,
          items,
          order_type: orderType,
          payment_method: paymentMethod,
          coupon: total.couponCode || undefined,
          discount: total.totalDiscount + total.couponDiscount,
        });
        trackWhatsAppOrder(result.finalTotal, result.cartId);
        setTimeout(() => router.push(`/carrinho/enviar/ok?orderId=${result.orderId || ''}&cartId=${result.cartId}`), 1200);
      } else {
        setError(result.error || 'Erro ao enviar mensagem');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenWhatsAppWeb = (scheduledFor: Date | null) => {
    const contact = getContact();
    const cartId = generateShortCartId();
    const message = formatWhatsAppMessage({
      cartId,
      store: store!,
      items: state.items,
      subtotal: total.subtotal,
      minimumOrder,
      promotions: total.appliedPromotions,
      coupon: total.couponCode
        ? { code: total.couponCode, discount: total.couponDiscount }
        : null,
      totalDiscount: total.totalDiscount + total.couponDiscount,
      finalTotal: finalWithFee,
      contact: contact || undefined,
      scheduledFor: scheduledFor || undefined,
      orderType,
      paymentMethod,
      deliveryAddress: deliveryAddress || undefined,
      deliveryFee,
    });
    if (scheduledFor) trackScheduledOrder(scheduledFor.toISOString());

    const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const formatScheduled = (d: Date) =>
    d.toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });

  if (state.items.length === 0) return null;

  return (
    <div>
      <CheckoutProgress current={4} />
      <div className="container-store py-4 max-w-2xl mx-auto space-y-4">
        {isClosed && nextOpenAt && (
          <div role="status" className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            📅 <strong>Pedido agendado</strong> para {formatScheduled(nextOpenAt)}.
          </div>
        )}

        {sent && (
          <div role="status" className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            ✅ Pedido enviado! Redirecionando para confirmação...
          </div>
        )}

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            ❌ {error}
          </div>
        )}

        <div className="card p-4">
          <h1 className="text-lg font-bold text-brand-contrast mb-3">✅ Confirmar e enviar</h1>
          <ul className="text-sm space-y-1 mb-3">
            {state.items.map((it) => {
              const promo = calculateProductPrice(
                it.product,
                promotions,
                productPromoIds.get(it.product.id)
              );
              const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
              return (
                <li key={it.id} className="flex justify-between gap-2">
                  <span className="truncate">{it.quantity}× {it.product.name}</span>
                  <span className="font-medium">{formatMoney((promo.finalPrice + extras) * it.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-gray-100 pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Subtotal</span>
              <span>{formatMoney(total.subtotal)}</span>
            </div>
            {total.totalDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>🏷️ Promoções</span>
                <span>− {formatMoney(total.totalDiscount)}</span>
              </div>
            )}
            {total.couponDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>🎟️ Cupom</span>
                <span>− {formatMoney(total.couponDiscount)}</span>
              </div>
            )}
            {orderType === 'delivery' && deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-muted">🛵 Entrega</span>
                <span>{formatMoney(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span className="text-brand">{formatMoney(finalWithFee)}</span>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-brand-contrast">📋 Detalhes</h2>
          <Detail icon="📞" label="Contato" value={`${getContact()?.name || ''} · ${getContact()?.phone || ''}`} />
          <Detail icon={orderType === 'delivery' ? '🛵' : '🏪'} label="Modalidade" value={orderType === 'delivery' ? 'Entrega' : 'Retirada no balcão'} />
          {orderType === 'delivery' && deliveryAddress && (
            <Detail
              icon="📍"
              label="Endereço"
              value={`${deliveryAddress.address}${deliveryAddress.complement ? `, ${deliveryAddress.complement}` : ''} · ${deliveryAddress.neighborhood} · ${deliveryAddress.city}`}
            />
          )}
          <Detail icon="💳" label="Pagamento" value={METHOD_LABEL[paymentMethod]} />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleSendWhatsApp(isClosed ? nextOpenAt : null)}
            disabled={sending || sent || isBelowMinimum}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px]"
          >
            {sending ? 'Enviando...' : sent ? '✅ Pedido enviado!' : (
              isClosed
                ? `📅 Agendar pedido para ${nextOpenAt ? nextOpenAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'próxima abertura'}`
                : '📤 Enviar pedido pelo WhatsApp'
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenWhatsAppWeb(isClosed ? nextOpenAt : null)}
            disabled={sending || isBelowMinimum}
            className="w-full btn-secondary py-3 min-h-[48px] disabled:opacity-50"
          >
            Abrir WhatsApp Web (alternativo)
          </button>

          <Link
            href="/carrinho/pagamento"
            className="block w-full text-center py-3 text-brand-text hover:underline min-h-[48px]"
          >
            ← Editar pagamento
          </Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span aria-hidden="true">{icon}</span>
      <span className="text-ink-muted shrink-0">{label}:</span>
      <span className="text-ink truncate">{value}</span>
    </div>
  );
}
