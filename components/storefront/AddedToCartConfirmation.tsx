'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { formatMoney } from '@/lib/money';
import { trackSelectPromotion, trackAddToCart } from '@/features/analytics/events';
import type { ProductWithImages } from '@/features/catalog/images';
import { Icon } from '@/components/ui';

export interface UpsellItem {
  product: ProductWithImages;
  /** Texto curto da promoção (ex.: "Combo com batata + refri") */
  hook?: string;
}

interface Props {
  open: boolean;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string | null;
  upsell?: UpsellItem | null;
  onClose: () => void;
  onContinueShopping?: () => void;
}

function resolveImage(p: UpsellItem['product']): string | null {
  const imgs = p.images;
  if (!imgs || imgs.length === 0) return null;
  const cover = imgs.find((i) => i.is_cover) || imgs[0];
  if (!cover) return null;
  if (cover.path.startsWith('http')) return cover.path;
  return `/api/image?path=${encodeURIComponent(cover.path)}`;
}

export default function AddedToCartConfirmation({
  open,
  productName,
  quantity,
  price,
  productImage,
  upsell,
  onClose,
  onContinueShopping,
}: Props) {
  const router = useRouter();
  const containerRef = useFocusTrap({
    active: open,
    onClose,
    initialFocus: 'title',
  });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (open) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const handleContinue = () => {
    onContinueShopping?.();
    onClose();
  };

  const handleViewOrder = () => {
    onClose();
    router.push('/carrinho');
  };

  const handleUpsell = () => {
    if (!upsell) return;
    trackSelectPromotion({
      id: upsell.product.id,
      name: upsell.product.name,
      creative: 'cart_confirmation',
    });
    trackAddToCart({
      item_id: upsell.product.id,
      item_name: upsell.product.name,
      item_category: (upsell.product as any).category?.name,
      price: upsell.product.base_price,
      quantity: 1,
    });
    // fecha confirmação e deixa o usuário adicionar via modal
    onClose();
    // rola até o produto (caso esteja visível no cardápio)
    if (typeof document !== 'undefined') {
      const el = document.getElementById(`product-${upsell.product.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-confirm-title"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        className="relative bg-app-surface rounded-xl w-full sm:max-w-md shadow-modal overflow-hidden"
      >
        <div className="bg-success/10 p-5 text-center">
          <div
            className={[
              'mx-auto w-14 h-14 rounded-full bg-success text-white grid place-items-center shadow-card-hover',
              pulse ? 'scale-110' : '',
              'transition-transform',
            ].join(' ')}
            aria-hidden="true"
          >
            <Icon.check size={26} />
          </div>
          <h2
            id="cart-confirm-title"
            data-modal-title
            className="mt-3 text-lg font-bold text-ink"
          >
            Adicionado ao pedido!
          </h2>
          <p className="text-sm text-ink-muted mt-1" aria-live="polite">
            {quantity}× {productName} · {formatMoney(price)}
          </p>
        </div>

        {upsell && (
          <div className="p-4 border-b border-app-border">
            <p className="text-xs uppercase tracking-wide font-semibold text-brand-text mb-2">
              {upsell.hook || 'Complete com'}
            </p>
            <button
              type="button"
              onClick={handleUpsell}
              className="w-full flex items-center gap-3 p-2 rounded-md border border-app-border hover:border-brand hover:bg-brand-soft transition-colors text-left min-h-touch"
            >
              <div className="relative w-12 h-12 rounded-md bg-gradient-to-br from-amber-50 to-orange-100 shrink-0 overflow-hidden">
                {(() => {
                  const src = resolveImage(upsell.product);
                  return src ? (
                    <Image src={src} alt={upsell.product.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl text-brand/40" aria-hidden="true">🥤</span>
                  );
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {upsell.product.name}
                </p>
                <p className="text-xs text-ink-muted">Toque para adicionar</p>
              </div>
              <span className="text-sm font-bold text-brand whitespace-nowrap tabular-nums">
                {formatMoney(upsell.product.base_price)}
              </span>
            </button>
          </div>
        )}

        <div className="p-4 space-y-2">
          <button
            type="button"
            onClick={handleViewOrder}
            className="btn-primary w-full py-3 min-h-touch-lg font-semibold"
          >
            Ver pedido
            <Icon.chevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="btn-ghost w-full py-3 min-h-touch-lg font-medium"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}