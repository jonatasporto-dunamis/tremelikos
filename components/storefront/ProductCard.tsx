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

  const coverImage = useMemo(() => {
    const imgs = (product as any).images as ProductImage[] | undefined;
    if (!imgs || imgs.length === 0) return null;
    const cover = imgs.find((i) => i.is_cover) || imgs[0];
    if (!cover) return null;
    if (cover.path.startsWith('http')) return cover.path;
    // Supabase Storage path → URL pública via /api/image?path=
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

  const handleQuickAdd = async (e: React.MouseEvent) => {
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

  const handleCloseConfirmation = () => {
    setConfirmation(null);
  };

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

  const isUnavailable = !product.available;

  return (
    <>
      <article
        id={`product-${product.id}`}
        className={`card flex flex-row gap-3 p-3 hover:shadow-md transition-shadow relative ${
          isUnavailable ? 'opacity-60' : 'cursor-pointer'
        }`}
        onClick={isUnavailable ? undefined : handleOpen}
        aria-label={`${product.name} por ${formatMoney(displayPrice)}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-brand-contrast leading-tight line-clamp-2">
              {product.name}
            </h3>
            {bestSellerRank && bestSellerRank <= 3 && (
              <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide rounded-full">
                🔥 Mais pedido
              </span>
            )}
            {product.badge && !bestSellerRank && (
              <span className="shrink-0 px-2 py-0.5 bg-brand-soft text-brand-badge text-xs font-medium rounded-full">
                {product.badge}
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatMoney(pricing.originalPrice)}
                </span>
              )}
              <span className={`text-lg font-bold ${hasDiscount ? 'text-green-700' : 'text-brand'}`}>
                {formatMoney(displayPrice)}
              </span>
              {hasDiscount && pricing.promotionName && (
                <span className="text-[10px] uppercase tracking-wide text-green-700 font-semibold">
                  🏷️ {pricing.promotionName} · economize {formatMoney(pricing.discount)}
                </span>
              )}
              {isUnavailable && (
                <span className="text-[10px] uppercase tracking-wide text-red-700 font-semibold">
                  Indisponível hoje
                </span>
              )}
            </div>
            <button
              onClick={handleQuickAdd}
              disabled={isUnavailable}
              className="btn-primary px-3 py-2 text-sm font-semibold min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label={hasOptions ? `Escolher opções de ${product.name}` : `Adicionar ${product.name} ao pedido`}
            >
              {hasOptions ? 'Escolher' : `Adicionar • ${formatMoney(displayPrice)}`}
            </button>
          </div>
        </div>

        <div className="relative shrink-0 w-24 h-24 rounded-lg bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="text-3xl" aria-hidden="true">🍔</span>
          )}
          <button
            onClick={handleShare}
            aria-label={`Compartilhar ${product.name}`}
            className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-white/90 backdrop-blur text-gray-700 hover:bg-white flex items-center justify-center shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </article>

      {shareToast && (
        <div role="status" aria-live="polite" className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {shareToast}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={product.name}>
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="relative w-full h-40 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
              {coverImage ? (
                <Image src={coverImage} alt={product.name} fill sizes="(max-width: 640px) 100vw, 448px" className="object-cover" />
              ) : (
                <span className="text-5xl" aria-hidden="true">🍔</span>
              )}
              <button
                onClick={() => setShowModal(false)}
                aria-label="Fechar"
                className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 text-gray-700 hover:bg-white flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold text-brand-contrast">{product.name}</h2>
              {product.description && (
                <p className="mt-1 text-sm text-gray-600">{product.description}</p>
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