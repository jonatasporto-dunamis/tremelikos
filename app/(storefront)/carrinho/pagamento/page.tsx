'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { usePromotions } from '@/features/promotions/usePromotions';
import { formatMoney } from '@/lib/money';
import CheckoutProgress from '@/components/storefront/CheckoutProgress';
import { trackAddPaymentInfo, getContact } from '@/features/analytics/events';
import { loadSaved, saveCheckout, type DeliveryAddress, type PaymentMethod } from '@/features/checkout/storage';

type Method = 'pix' | 'cash' | 'card' | 'whatsapp';

const METHODS: Array<{ value: Method; icon: string; title: string; desc: string; disabled?: boolean }> = [
  { value: 'pix', icon: '💠', title: 'PIX', desc: 'Aprovação imediata · QR Code ou copia/cola' },
  { value: 'cash', icon: '💵', title: 'Dinheiro na entrega/retirada', desc: 'Pagamento em espécie · troco para o entregador' },
  { value: 'card', icon: '💳', title: 'Cartão (maquininha)', desc: 'Crédito ou débito na entrega/retirada' },
  { value: 'whatsapp', icon: '💬', title: 'Combinar no WhatsApp', desc: 'Decidir forma de pagamento com o restaurante' },
];

export default function PagamentoPage() {
  const router = useRouter();
  const { state, subtotal, itemCount } = useCart();
  const { store, isClosed, nextOpenAt } = useStore();
  const { total } = usePromotions();
  const [method, setMethod] = useState<Method>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startTracked = useRef(false);

  useEffect(() => {
    const c = getContact();
    if (!c?.phone) { router.replace('/carrinho/identificacao'); return; }
    const saved = loadSaved();
    if (!saved.orderType) { router.replace('/carrinho/entrega'); return; }
    setOrderType(saved.orderType);
    setDeliveryAddress(saved.deliveryAddress || null);
    setDeliveryFee(saved.deliveryFee || 0);
    if (saved.paymentMethod) setMethod(saved.paymentMethod);
  }, [router]);

  useEffect(() => {
    if (!startTracked.current) {
      startTracked.current = true;
      // tracking só do início da etapa; o evento add_payment_info vai no continue
    }
  }, []);

  const minimumOrder = store?.minimum_order || 15.0;
  const finalWithFee = total.finalTotal + deliveryFee;
  const isBelowMinimum = finalWithFee < minimumOrder && itemCount > 0;

  const handleContinue = () => {
    if (isBelowMinimum) return;
    saveCheckout({ paymentMethod: method });
    const items = state.items.map((it) => {
      const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
      return {
        item_id: it.product.id,
        item_name: it.product.name,
        price: it.product.base_price + extras,
        quantity: it.quantity,
      };
    });
    trackAddPaymentInfo(items, method, orderType);
    router.push('/carrinho/enviar');
  };

  if (state.items.length === 0) {
    return (
      <div>
        <CheckoutProgress current={3} />
        <div className="container-store py-8 text-center">
          <p className="text-gray-600">Seu carrinho está vazio.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CheckoutProgress current={3} />
      <div className="container-store py-4 max-w-2xl mx-auto space-y-4">
        {isClosed && nextOpenAt && (
          <div role="status" className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            📅 Pedido agendado para {nextOpenAt.toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.
          </div>
        )}

        <div>
          <h1 className="text-lg font-bold text-brand-contrast mb-3">💳 Forma de pagamento</h1>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                disabled={m.disabled}
                className={`w-full p-3 rounded-xl border-2 text-left flex items-start gap-3 min-h-[64px] ${
                  method === m.value
                    ? 'border-brand bg-brand-soft'
                    : 'border-gray-200 hover:border-gray-300'
                } ${m.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-pressed={method === m.value}
              >
                <span className="text-2xl shrink-0" aria-hidden="true">{m.icon}</span>
                <div>
                  <p className="font-semibold text-brand-contrast">{m.title}</p>
                  <p className="text-xs text-gray-600">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {method === 'cash' && (
          <div className="card p-4 space-y-2">
            <h2 className="font-semibold text-brand-contrast">Precisa de troco?</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={needsChange}
                onChange={(e) => setNeedsChange(e.target.checked)}
                className="accent-brand w-4 h-4"
              />
              Sim, troco para:
            </label>
            {needsChange && (
              <div>
                <label htmlFor="changeFor" className="block text-sm text-gray-700 mb-1">Troco para R$</label>
                <input
                  id="changeFor"
                  type="number"
                  step="0.01"
                  min={finalWithFee}
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  placeholder={finalWithFee.toFixed(2)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Resumo */}
        <div className="card p-4">
          <h2 className="font-semibold text-brand-contrast mb-2 text-sm">📋 Resumo</h2>
          <div className="text-sm space-y-1">
            <Row label="Subtotal" value={formatMoney(total.subtotal)} />
            {total.totalDiscount > 0 && (
              <Row label="🏷️ Promoções" value={`− ${formatMoney(total.totalDiscount)}`} tone="success" />
            )}
            {total.couponDiscount > 0 && (
              <Row label="🎟️ Cupom" value={`− ${formatMoney(total.couponDiscount)}`} tone="success" />
            )}
            {orderType === 'delivery' && deliveryFee > 0 && (
              <Row label="🛵 Entrega" value={formatMoney(deliveryFee)} />
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2 mt-1 text-base font-bold">
              <span>Total</span>
              <span className="text-brand">{formatMoney(finalWithFee)}</span>
            </div>
          </div>
          {isBelowMinimum && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
              ⚠️ Pedido mínimo: {formatMoney(minimumOrder)}. Faltam {formatMoney(minimumOrder - finalWithFee)}.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/carrinho/entrega')}
            className="sm:w-40 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={isBelowMinimum || submitting}
            className="flex-1 btn-primary py-3 min-h-[48px] disabled:opacity-50"
          >
            Revisar pedido →
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className={`flex justify-between ${tone === 'success' ? 'text-green-700' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
