'use client';

import { useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import { trackViewPromotion, trackSelectPromotion } from '@/features/analytics/events';

export interface PromotionBannerItem {
  id: string;
  name: string;
  type: 'fixed_percent' | 'fixed_amount' | 'product_price';
  value: number;
  ends_at?: string | null;
}

interface PromoBannerProps {
  promotions: PromotionBannerItem[];
}

function formatEndsAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatDiscount(p: PromotionBannerItem): string {
  if (p.type === 'fixed_percent') return `${p.value}% OFF`;
  if (p.type === 'fixed_amount') return `R$ ${p.value.toFixed(2).replace('.', ',')} OFF`;
  return 'Oferta';
}

export default function PromoBanner({ promotions }: PromoBannerProps) {
  useEffect(() => {
    if (!promotions?.length) return;
    promotions.slice(0, 3).forEach((p) => {
      trackViewPromotion({ id: p.id, name: p.name, creative: 'home_banner' });
    });
  }, [promotions]);

  if (!promotions || promotions.length === 0) return null;

  const handleClick = (p: PromotionBannerItem) => {
    trackSelectPromotion({ id: p.id, name: p.name, creative: 'home_banner' });
  };

  return (
    <section className="container-store py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {promotions.slice(0, 3).map((p) => {
          const ends = formatEndsAt(p.ends_at);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleClick(p)}
              className="shrink-0 w-64 bg-gradient-to-br from-brand to-brand-active text-white rounded-xl p-3 shadow-sm text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="default" className="bg-white text-brand-contrast">
                  {formatDiscount(p)}
                </Badge>
                {ends && <span className="text-xs text-white/80">até {ends}</span>}
              </div>
              <h3 className="font-bold text-sm leading-snug">{p.name}</h3>
            </button>
          );
        })}
      </div>
    </section>
  );
}