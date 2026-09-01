'use client';

import { useState } from 'react';
import { usePromotions } from '@/features/promotions/usePromotions';

export default function CouponInput() {
  const { coupon, couponError, applyCoupon, removeCoupon } = usePromotions();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await applyCoupon(code);
    } finally {
      setBusy(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
        <div>
          <p className="text-sm font-medium text-green-800">
            ✅ Cupom <strong>{coupon.code}</strong> aplicado
          </p>
          <p className="text-xs text-green-700">
            {coupon.type === 'fixed_percent'
              ? `${coupon.value}% de desconto`
              : `R$ ${coupon.value.toFixed(2).replace('.', ',')} de desconto`}
          </p>
        </div>
        <button
          type="button"
          onClick={removeCoupon}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Remover
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <label className="block text-sm font-medium text-brand-contrast mb-2">
        Tem um cupom?
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CUPOM"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          aria-label="Código do cupom"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={busy || !code.trim()}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? 'Validando...' : 'Aplicar'}
        </button>
      </div>
      {couponError && (
        <p className="text-xs text-red-600 mt-2">{couponError}</p>
      )}
    </div>
  );
}