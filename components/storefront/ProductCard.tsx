'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/database';
import { formatMoney } from '@/lib/money';
import { useCart } from '@/features/cart/CartContext';
import { calculateProductPrice } from '@/features/promotions/promoCalculator';
import { useActivePromotions } from '@/features/promotions/PromotionsContext';
import {
  trackSelectItem,
  trackViewItem,
  trackShare,
} from '@/features/analytics/events';
import { Icon } from '@/components/ui';
import ProductModal, { OptionGroup, type AddedItem } from './ProductModal';
import AddedToCartConfirmation, { type UpsellItem } from './AddedToCartConfirmation';

interface ProductImage {
  path: string;
  alt_text?: string | null;
  is_cover?: boolean;
}

interface ProductCardProps {
  product: Product & { images?: ProductImage[] };
  serverPromotions?: {
    promotions: import('@/types/database').Promotion[];
    productPromotions: Record<string, string[]>;
  };
  bestSellerRank?: number;
  /** Upsell pré-carregado na home (evita request no client) */
  prefetchedUpsell?: UpsellItem | null;
}

export default function ProductCard({ product, serverPromotions, bestSellerRank, prefetchedUpsell }: ProductCardProps) {
  const { addItem } = useCart();
  const ctx = useActivePromotions();
  const promotions = serverPromotions?.promotions ?? ctx.promotions;
  const productPromotions = serverPromotions?.productPromotions ?? ctx.productPromotions;
  const [showModal, setShowModal] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    product: Product;
    quantity: number;
    totalPrice: number;
    upsell: UpsellItem | null;
  } | null>(null);

  const promoIds = useMemo(
    () => new Set(productPromotions[product.id] || []),
    [productPromotions, product.id]
  );
  const pricing = useMemo(
    () => calculateProductPrice(product, promotions, promoIds),
    [product, promotions, promoIds]
  );
  const hasDiscount = pricing.discount > 0;
  const hasOptions = optionGroups.length > 0;
  const displayPrice = hasDiscount ? pricing.finalPrice : product.base_price;
  const isUnavailable = !product.available;

  const coverImage = useMemo(() => {
    const imgs = (product as any).images as ProductImage[] | undefined;
    if (!imgs || imgs.length === 0) return null;
    const cover = imgs.find((i) => i.is_cover) || imgs[0];
    if (!cover) return null;
    if (cover.path.startsWith('http')) return cover.path;
    return `/api/image?path=${encodeURIComponent(cover.path)}`;
  }, [product]);

  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    fetch(`/api/products/${product.id}/option-groups`)
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((data) => {
        if (!cancelled) setOptionGroups(data.groups || []);
      })
      .catch(() => {
        if (!cancelled) setOptionGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showModal, product.id]);

  // Esc fecha o modal + focus trap
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowModal(false);
      }
      if (e.key === 'Tab') {
        const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null;
        if (!dialog) return;
        const focusables = dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // Move foco pro botão de fechar
    const closeBtn = document.querySelector(`[aria-label="Fechar"]`) as HTMLButtonElement | null;
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
    return () => document.removeEventListener('keydown', onKey);
  }, [showModal]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasOptions) {
      handleOpen();
      return;
    }
    addItem({ product, quantity: 1 });
    setConfirmation({
      product,
      quantity: 1,
      totalPrice: displayPrice,
      upsell: prefetchedUpsell || null,
    });
  };

  const handleModalAdded = (item: AddedItem) => {
    setShowModal(false);
    setConfirmation({
      product: item.product,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      upsell: prefetchedUpsell || null,
    });
  };

  const handleCloseConfirmation = () => setConfirmation(null);

  const handleOpen = () => {
    setShowModal(true);
    trackSelectItem(
      {
        item_id: product.id,
        item_name: product.name,
        item_category: (product as any).category?.name,
        price: displayPrice,
      },
      'menu'
    );
    trackViewItem({
      item_id: product.id,
      item_name: product.name,
      item_category: (product as any).category?.name,
      price: displayPrice,
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/produto/${product.slug}`;
    const data = {
      title: `${product.name} · Tremeliko's Burguer`,
      text: `${product.name} por ${formatMoney(displayPrice)}`,
      url,
    };
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(data);
        trackShare('native', 'product', product.id);
        return;
      } catch { /* user cancelou */ }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast('Link copiado!');
        trackShare('copy', 'product', product.id);
        setTimeout(() => setShareToast(null), 1500);
      } catch {
        setShareToast('Não foi possível copiar');
        setTimeout(() => setShareToast(null), 1500);
      }
    }
  };

  return (
    <>
      <article
        id={`product-${product.id}`}
        className={[
          'group card flex flex-row gap-3 p-3 relative',
          'transition-shadow duration-150',
          isUnavailable ? 'opacity-60' : 'cursor-pointer hover:shadow-card-hover',
          'focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2',
        ].join(' ')}
        onClick={isUnavailable ? undefined : handleOpen}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isUnavailable) {
            e.preventDefault();
            handleOpen();
          }
        }}
        role="button"
        tabIndex={isUnavailable ? -1 : 0}
        aria-disabled={isUnavailable}
        aria-label={`${product.name} por ${formatMoney(displayPrice)}${isUnavailable ? ' (indisponível)' : ''}`}
      >
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-ink leading-snug line-clamp-2 text-[15px]">
              {product.name}
            </h3>
            {bestSellerRank && bestSellerRank <= 3 && (
              <span className="shrink-0 pill bg-amber-100 text-amber-800 border border-amber-200">
                <Icon.flame size={12} />
                Mais pedido
              </span>
            )}
            {product.badge && !bestSellerRank && (
              <span className="shrink-0 pill pill-brand">{product.badge}</span>
            )}
          </div>

          {product.description && (
            <p className="mt-1 text-sm text-ink-muted line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-2 flex items-end justify-between gap-2">
            <div className="flex flex-col min-w-0">
              {hasDiscount && (
                <span className="text-xs text-ink-muted line-through tabular-nums">
                  {formatMoney(pricing.originalPrice)}
                </span>
              )}
              <span
                className={[
                  'text-lg font-extrabold tabular-nums',
                  hasDiscount ? 'text-success' : 'text-brand',
                ].join(' ')}
              >
                {formatMoney(displayPrice)}
              </span>
              {hasDiscount && pricing.promotionName && (
                <span className="text-[10px] uppercase tracking-wide text-success font-semibold flex items-center gap-1">
                  <Icon.tag size={10} />
                  {pricing.promotionName} · economize {formatMoney(pricing.discount)}
                </span>
              )}
              {isUnavailable && (
                <span className="text-[10px] uppercase tracking-wide text-danger font-semibold">
                  Indisponível hoje
                </span>
              )}
            </div>

            <button
              onClick={handleQuickAdd}
              type="button"
              disabled={isUnavailable}
              className="btn-primary px-3 py-2 text-sm font-semibold shrink-0"
              aria-label={
                hasOptions
                  ? `Escolher opções de ${product.name}`
                  : `Adicionar ${product.name} ao pedido por ${formatMoney(displayPrice)}`
              }
            >
              {hasOptions ? 'Escolher' : (
                <>
                  <Icon.plus size={16} />
                  <span>Adicionar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative shrink-0 w-24 h-24 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 grid place-items-center">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span
              className="text-3xl text-brand/40"
              aria-hidden="true"
              role="presentation"
            >
              🍔
            </span>
          )}
          <button
            onClick={handleShare}
            type="button"
            aria-label={`Compartilhar ${product.name}`}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-app-surface/90 backdrop-blur text-ink hover:bg-app-surface grid place-items-center shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Icon.share size={14} />
          </button>
        </div>
      </article>

      {shareToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-modal animate-fade-in"
        >
          {shareToast}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
        >
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-app-surface rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-modal animate-slide-up">
            <div className="sticky top-0 z-10 relative w-full h-40 sm:h-44 bg-gradient-to-br from-amber-50 to-orange-100 grid place-items-center">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-cover"
                />
              ) : (
                <span className="text-5xl text-brand/40" aria-hidden="true">🍔</span>
              )}
              <button
                onClick={() => setShowModal(false)}
                type="button"
                aria-label="Fechar"
                className="absolute top-2 right-2 w-10 h-10 rounded-full bg-app-surface/90 text-ink hover:bg-app-surface grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Icon.close size={18} />
              </button>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold text-ink">{product.name}</h2>
              {product.description && (
                <p className="mt-1 text-sm text-ink-muted">{product.description}</p>
              )}
              <div className="mt-4">
                <ProductModal
                  product={product}
                  optionGroups={optionGroups}
                  onClose={() => setShowModal(false)}
                  onAdded={handleModalAdded}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <AddedToCartConfirmation
          open
          productName={confirmation.product.name}
          quantity={confirmation.quantity}
          price={confirmation.totalPrice}
          productImage={coverImage}
          upsell={confirmation.upsell}
          onClose={handleCloseConfirmation}
        />
      )}
    </>
  );
}
