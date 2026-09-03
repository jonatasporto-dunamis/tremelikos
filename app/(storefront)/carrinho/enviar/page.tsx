'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { usePromotions } from '@/features/promotions/usePromotions';
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

export default function EnviarPage() {
  const router = useRouter();
  const { state, itemCount } = useCart();
  const { store, isClosed, nextOpenAt } = useStore();
  const { total } = usePromotions();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const beginTracked = useRef<string | null>(null);

  useEffect(() => {
    if (state.items.length === 0) {
      router.replace('/carrinho');
      return;
    }
    const contact = getContact();
    if (!contact?.phone) {
      router.replace('/carrinho/identificacao');
      return;
    }
    if (beginTracked.current) return;
    const items = state.items.map((it) => {
      const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
      return {
        item_id: it.product.id,
        item_name: it.product.name,
        price: it.product.base_price + extras,
        quantity: it.quantity,
      };
    });
    trackBeginCheckout(total.finalTotal, items, 'pickup');
    beginTracked.current = `${items.length}-${total.finalTotal}`;
  }, [state.items, total.finalTotal, router]);

  const minimumOrder = store?.minimum_order || 15.0;
  const remainingForMinimum = minimumOrder - total.finalTotal;
  const isBelowMinimum = itemCount > 0 && total.finalTotal < minimumOrder;

  const handleSendWhatsApp = async (scheduledFor: Date | null) => {
    setSending(true);
    setError(null);
    try {
      const cartId = generateShortCartId();
      const contact = getContact();
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
        finalTotal: total.finalTotal,
        contact: contact || undefined,
        scheduledFor: scheduledFor || undefined,
      });

      const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';
      if (scheduledFor) trackScheduledOrder(scheduledFor.toISOString());

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message,
          cartId,
          storeId: store?.id,
          scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setSent(true);
        const items = state.items.map((it) => {
          const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
          return {
            item_id: it.product.id,
            item_name: it.product.name,
            price: it.product.base_price + extras,
            quantity: it.quantity,
          };
        });
        trackPurchase({
          transaction_id: cartId,
          value: total.finalTotal,
          items,
          order_type: 'pickup',
          payment_method: 'whatsapp',
          coupon: total.couponCode || undefined,
          discount: total.totalDiscount + total.couponDiscount,
        });
        trackWhatsAppOrder(total.finalTotal, cartId);
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
      finalTotal: total.finalTotal,
      contact: contact || undefined,
      scheduledFor: scheduledFor || undefined,
    });
    if (scheduledFor) trackScheduledOrder(scheduledFor.toISOString());

    const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const formatScheduled = (d: Date) =>
    d.toLocaleString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (state.items.length === 0) return null;

  return (
    <div>
      <CheckoutProgress current={4} />
      <div className="container-store py-4 max-w-2xl mx-auto space-y-4">
        {isClosed && nextOpenAt && (
          <div role="status" className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            📅 <strong>Pedido agendado</strong> para {formatScheduled(nextOpenAt)}.
            <br />
            <span className="text-xs text-amber-800">
              Te avisamos no WhatsApp assim que a loja abrir.
            </span>
          </div>
        )}

        {sent && (
          <div role="status" className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            ✅ Pedido enviado para o WhatsApp! Aguardamos a confirmação.
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
              const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
              return (
                <li key={it.id} className="flex justify-between gap-2">
                  <span className="truncate">{it.quantity}× {it.product.name}</span>
                  <span className="font-medium">{formatMoney((it.product.base_price + extras) * it.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-gray-100 pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
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
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span className="text-brand">{formatMoney(total.finalTotal)}</span>
            </div>
            {isBelowMinimum && (
              <div className="mt-2 text-xs text-amber-700">
                Falta <strong>{formatMoney(remainingForMinimum)}</strong> para o pedido mínimo ({formatMoney(minimumOrder)}).
              </div>
            )}
          </div>
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
                : '📤 Enviar pedido via WhatsApp'
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
            href="/carrinho/identificacao"
            className="block w-full text-center py-3 text-brand-text hover:underline min-h-[48px]"
          >
            ← Editar dados
          </Link>
        </div>
      </div>
    </div>
  );
}
