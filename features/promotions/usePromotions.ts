'use client';

import { useEffect, useMemo, useState } from 'react';
import { Promotion } from '@/types/database';
import { calculateCartTotal, CartTotal } from '@/features/promotions/promoCalculator';
import { useCart } from '@/features/cart/CartContext';

export interface AppliedCoupon {
  code: string;
  type: 'fixed_percent' | 'fixed_amount';
  value: number;
  minimum_order: number;
}

export function usePromotions() {
  const { state } = useCart();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [productPromoIds, setProductPromoIds] = useState<Map<string, Set<string>>>(new Map());
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [loadingPromos, setLoadingPromos] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/promotions')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPromotions(data.promotions || []);
        const map = new Map<string, Set<string>>();
        for (const [productId, ids] of Object.entries(data.productPromotions || {})) {
          map.set(productId, new Set(ids as string[]));
        }
        setProductPromoIds(map);
        setLoadingPromos(false);
      })
      .catch(() => setLoadingPromos(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const total: CartTotal = useMemo(() => {
    return calculateCartTotal(state.items, promotions, productPromoIds, coupon);
  }, [state.items, promotions, productPromoIds, coupon]);

  const applyCoupon = async (code: string) => {
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCoupon(null);
        setCouponError(data.error || 'Cupom inválido');
        return false;
      }
      setCoupon(data.coupon);
      setCouponError(null);
      return true;
    } catch {
      setCouponError('Erro ao validar cupom');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  return {
    promotions,
    loadingPromos,
    total,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon,
  };
}