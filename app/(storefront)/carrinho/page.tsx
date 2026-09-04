'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { formatMoney } from '@/lib/money';
import { formatWhatsAppMessage, generateShortCartId } from '@/features/whatsapp/formatOrder';
import { usePromotions } from '@/features/promotions/usePromotions';
import CouponInput from '@/components/storefront/CouponInput';
import Link from 'next/link';
import UpsellBanner from '@/components/storefront/UpsellBanner';
import CheckoutProgress from '@/components/storefront/CheckoutProgress';
import {
  trackBeginCheckout,
  trackPurchase,
  trackWhatsAppOrder,
  setContact,
  getContact,
} from '@/features/analytics/events';

export default function CartPage() {
  const router = useRouter();
  const { state, dispatch, subtotal, itemCount } = useCart();
  const { store, isClosed, nextOpenAt } = useStore();
  const { total } = usePromotions();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [editingObsText, setEditingObsText] = useState('');

  const beginTracked = useRef<string | null>(null);

  useEffect(() => {
    if (state.items.length === 0 || beginTracked.current) return;
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
  }, [state.items, total.finalTotal]);

  const minimumOrder = store?.minimum_order || 15.0;
  const remainingForMinimum = minimumOrder - total.finalTotal;
  const isBelowMinimum = total.finalTotal < minimumOrder && itemCount > 0;

  const persistContactFromInputs = (name: string, phone: string, email: string) => {
    setContact({
      name: name.trim() || undefined,
      phone: phone.replace(/\D/g, '') || undefined,
      email: email.trim() || undefined,
    });
  };

  const handleContinue = () => {
    router.push('/carrinho/identificacao');
  };

  const handleSendQuick = async () => {
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
        scheduledFor: isClosed ? nextOpenAt ?? undefined : undefined,
      });

      const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message,
          cartId,
          storeId: store?.id,
          scheduledFor: isClosed && nextOpenAt ? nextOpenAt.toISOString() : null,
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
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const startEditObs = (id: string, current: string) => {
    setEditingObsId(id);
    setEditingObsText(current || '');
  };

  const saveObs = (id: string) => {
    const text = editingObsText.trim();
    dispatch({
      type: 'UPDATE_OBSERVATIONS',
      payload: { id, observations: text || undefined },
    });
    setEditingObsId(null);
    setEditingObsText('');
  };

  if (state.items.length === 0) {
    return (
      <div>
        <CheckoutProgress current={1} />
        <div className="container-store py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4" aria-hidden="true">🛒</div>
            <h2 className="text-xl font-bold text-brand-contrast mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-ink-muted mb-6">
              Adicione itens do cardápio para continuar
            </p>
            <Link href="/" className="btn-primary inline-block">
              Ver cardápio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CheckoutProgress current={1} />
      <div className="container-store py-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-brand-contrast mb-4">
          Seu Pedido ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
        </h1>

        {/* Items */}
        <div className="space-y-3 mb-4">
          {state.items.map((item) => (
            <div key={item.id} className="card p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-brand-contrast">
                    {item.product.name}
                  </h3>
                  <p className="text-brand font-bold">
                    {formatMoney((item.product.base_price + (item.extras?.reduce((s, e) => s + e.price, 0) || 0)) * item.quantity)}
                  </p>
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-xs text-ink-muted mt-1">
                      + {item.extras.map((e) => e.name).join(', ')}
                    </p>
                  )}
                  {item.removedIngredients && item.removedIngredients.length > 0 && (
                    <p className="text-xs text-ink-muted mt-1">
                      − Sem: {item.removedIngredients.join(', ')}
                    </p>
                  )}
                  {editingObsId === item.id ? (
                    <div className="mt-2 space-y-1">
                      <label htmlFor={`obs-${item.id}`} className="sr-only">Observações do item</label>
                      <textarea
                        id={`obs-${item.id}`}
                        value={editingObsText}
                        onChange={(e) => setEditingObsText(e.target.value)}
                        rows={2}
                        placeholder="Ex: sem cebola, ponto da carne..."
                        className="w-full p-2 border border-gray-200 rounded text-sm resize-none min-h-[40px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveObs(item.id)}
                          className="text-xs font-semibold text-brand-text hover:underline min-h-[32px]"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingObsId(null)}
                          className="text-xs text-ink-muted hover:underline min-h-[32px]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditObs(item.id, item.observations || '')}
                      className="mt-1 text-xs text-brand-text hover:underline text-left min-h-[32px]"
                    >
                      {item.observations ? `📝 ${item.observations} (editar)` : '+ Adicionar observação'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'UPDATE_QUANTITY',
                        payload: { id: item.id, quantity: Math.max(0, item.quantity - 1) },
                      })
                    }
                    aria-label={`Diminuir quantidade de ${item.product.name}`}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <span aria-live="polite" className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'UPDATE_QUANTITY',
                        payload: { id: item.id, quantity: item.quantity + 1 },
                      })
                    }
                    aria-label={`Aumentar quantidade de ${item.product.name}`}
                    className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover"
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
                  className="text-xs text-red-500 hover:text-red-700 min-h-[32px]"
                  aria-label={`Remover ${item.product.name}`}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="mb-4">
          <CouponInput />
        </div>

        {/* Upsell */}
        <div className="mb-4">
          <UpsellBanner />
        </div>

        {/* Summary */}
        <div className="card p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-ink-muted">Subtotal</span>
            <span className={total.totalDiscount > 0 ? 'text-sm text-ink-muted line-through' : 'text-lg font-bold text-brand-contrast'}>
              {formatMoney(total.subtotal)}
            </span>
          </div>
          {total.totalDiscount > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-green-700">🏷️ Promoções</span>
              <span className="text-sm font-medium text-green-700">
                − {formatMoney(total.totalDiscount)}
              </span>
            </div>
          )}
          {total.couponDiscount > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-green-700">🎟️ Cupom</span>
              <span className="text-sm font-medium text-green-700">
                − {formatMoney(total.couponDiscount)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mb-2 pt-2 border-t border-gray-100">
            <span className="text-ink font-medium">Total</span>
            <span className="text-lg font-bold text-brand">
              {formatMoney(total.finalTotal)}
            </span>
          </div>
          {isBelowMinimum && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <p className="text-sm text-amber-800">
                💡 Faltam <strong>{formatMoney(remainingForMinimum)}</strong> para atingir o pedido mínimo ({formatMoney(minimumOrder)}). Que tal adicionar uma bebida ou acompanhamento?
              </p>
            </div>
          )}
          <p className="text-xs text-ink-muted mt-2">
            * Taxa de entrega e forma de pagamento serão informadas no WhatsApp
          </p>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isBelowMinimum}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
          >
            Continuar pedido →
          </button>

          <button
            type="button"
            onClick={handleSendQuick}
            disabled={sending || isBelowMinimum}
            className="w-full py-3 min-h-[48px] text-brand-text hover:underline disabled:opacity-50"
          >
            {sending ? 'Enviando...' : sent ? '✅ Pedido enviado!' : 'Enviar agora via WhatsApp (sem salvar contato)'}
          </button>

          <div className="flex gap-2 pt-1">
            <Link
              href="/"
              className="flex-1 py-3 min-h-[48px] text-center text-brand-text hover:underline"
            >
              ← Continuar comprando
            </Link>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-red-500 hover:text-red-700 px-2 min-h-[32px]"
            >
              Esvaziar carrinho
            </button>
          </div>
        </div>

        {showClearConfirm && (
          <div role="dialog" aria-modal="true" aria-labelledby="clear-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowClearConfirm(false)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl">
              <h2 id="clear-title" className="text-lg font-bold text-brand-contrast mb-2">Esvaziar o carrinho?</h2>
              <p className="text-sm text-ink-muted mb-4">
                Todos os {itemCount} {itemCount === 1 ? 'item' : 'itens'} serão removidos. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => { dispatch({ type: 'CLEAR_CART' }); setShowClearConfirm(false); }}
                  className="flex-1 py-3 min-h-[48px] rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  Sim, esvaziar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
