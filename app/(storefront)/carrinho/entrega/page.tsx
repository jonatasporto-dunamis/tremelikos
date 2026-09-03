'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/features/cart/StoreContext';
import {
  trackAddShippingInfo,
  trackIdentificationStart,
  getContact,
} from '@/features/analytics/events';
import {
  loadSaved,
  saveCheckout,
  type DeliveryAddress,
  type OrderType,
} from '@/features/checkout/storage';

export default function EntregaPage() {
  const router = useRouter();
  const { store } = useStore();
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState<DeliveryAddress>({
    address: '', neighborhood: '', city: 'Jequié', zip: '', complement: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const startTracked = useRef(false);

  useEffect(() => {
    const c = getContact();
    if (!c?.phone) {
      router.replace('/carrinho/identificacao');
      return;
    }
    const saved = loadSaved();
    if (saved.orderType) setOrderType(saved.orderType);
    if (saved.deliveryAddress) setAddress(saved.deliveryAddress);
  }, [router]);

  useEffect(() => {
    if (!startTracked.current) {
      startTracked.current = true;
      trackIdentificationStart();
    }
  }, []);

  // taxa de entrega fixa por bairro (heurística simples)
  const deliveryFee = (() => {
    if (orderType !== 'delivery') return 0;
    const n = (address.neighborhood || '').toLowerCase();
    if (!n) return 0;
    if (n.includes('jequiezinho') || n.includes('centro')) return 5;
    if (n.includes('km') || n.includes('mandacaru')) return 7;
    return 10; // demais bairros
  })();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (orderType === 'delivery') {
      if (!address.address.trim()) errs.address = 'Endereço é obrigatório';
      if (!address.neighborhood.trim()) errs.neighborhood = 'Bairro é obrigatório';
      if (!address.city.trim()) errs.city = 'Cidade é obrigatória';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    saveCheckout({ orderType, deliveryAddress: address, deliveryFee });
    trackAddShippingInfo(
      [], // items já estão em state.cart
      orderType === 'pickup' ? 'pickup' : `delivery_${address.neighborhood}`,
      orderType
    );
    router.push('/carrinho/pagamento');
  };

  return (
    <div className="container-store py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-contrast mb-2">📦 Entrega</h1>
      <p className="text-sm text-gray-600 mb-4">Como você quer receber seu pedido?</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => setOrderType('pickup')}
          className={`p-4 rounded-xl border-2 text-left min-h-[88px] ${
            orderType === 'pickup' ? 'border-brand bg-brand-soft' : 'border-gray-200 hover:border-gray-300'
          }`}
          aria-pressed={orderType === 'pickup'}
        >
          <div className="text-2xl mb-1" aria-hidden="true">🏪</div>
          <p className="font-semibold text-brand-contrast">Retirada no balcão</p>
          <p className="text-xs text-gray-600">Buscar no restaurante</p>
        </button>
        <button
          type="button"
          onClick={() => setOrderType('delivery')}
          className={`p-4 rounded-xl border-2 text-left min-h-[88px] ${
            orderType === 'delivery' ? 'border-brand bg-brand-soft' : 'border-gray-200 hover:border-gray-300'
          }`}
          aria-pressed={orderType === 'delivery'}
        >
          <div className="text-2xl mb-1" aria-hidden="true">🛵</div>
          <p className="font-semibold text-brand-contrast">Entrega</p>
          <p className="text-xs text-gray-600">Receber em casa</p>
        </button>
      </div>

      {orderType === 'delivery' && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-brand-contrast">Endereço de entrega</h2>
          <Field label="Endereço" required error={errors.address}>
            <input
              type="text"
              value={address.address}
              onChange={(e) => setAddress({ ...address, address: e.target.value })}
              placeholder="Rua, número"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Bairro" required error={errors.neighborhood}>
              <input
                type="text"
                value={address.neighborhood}
                onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                placeholder="Ex: Jequiezinho"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </Field>
            <Field label="CEP">
              <input
                type="text"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                placeholder="00000-000"
                inputMode="numeric"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </Field>
          </div>
          <Field label="Cidade" required error={errors.city}>
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
            />
          </Field>
          <Field label="Complemento">
            <input
              type="text"
              value={address.complement}
              onChange={(e) => setAddress({ ...address, complement: e.target.value })}
              placeholder="Apto, bloco, referência..."
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
            />
          </Field>
          {address.neighborhood && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              💡 Taxa de entrega estimada para <strong>{address.neighborhood}</strong>:{' '}
              <strong>R$ {deliveryFee.toFixed(2).replace('.', ',')}</strong>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => router.push('/carrinho/identificacao')}
          className="sm:w-40 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="flex-1 btn-primary py-3 min-h-[48px]"
        >
          Continuar para pagamento →
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, required, error }: {
  label: string; children: React.ReactNode; required?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
