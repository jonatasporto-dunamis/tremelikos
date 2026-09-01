'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ActivePromotion = import('@/types/database').Promotion;

interface PromotionsContextType {
  promotions: ActivePromotion[];
  productPromotions: Record<string, string[]>;
  loading: boolean;
}

const PromotionsContext = createContext<PromotionsContextType>({
  promotions: [],
  productPromotions: {},
  loading: true,
});

export function PromotionsProvider({ children }: { children: ReactNode }) {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [productPromotions, setProductPromotions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/promotions')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPromotions(data.promotions || []);
        setProductPromotions(data.productPromotions || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PromotionsContext.Provider value={{ promotions, productPromotions, loading }}>
      {children}
    </PromotionsContext.Provider>
  );
}

export function useActivePromotions() {
  return useContext(PromotionsContext);
}