'use client';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
  }
}

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price: number;
  quantity?: number;
  discount?: number;
};

type EventPayload = Record<string, unknown>;

const CONSENT_KEY = 'tremelikos_consent_v2';
const CLICK_IDS_KEY = 'tremelikos_click_ids';
const SESSION_KEY = 'tremelikos_session_id';
const USER_ID_KEY = 'tremelikos_user_id';

function pushToDataLayer(event: string, data: EventPayload = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = uuid();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setUserId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ID_KEY, id);
  setCookie(USER_ID_KEY, id, 365);
  if (typeof window.gtag === 'function') {
    window.gtag('set', 'user_properties', { user_id: id });
  }
}

export type ConsentState = {
  ad_storage: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  timestamp: number;
};

export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CONSENT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ConsentState; } catch { return null; }
}

export function setConsent(state: Omit<ConsentState, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const full: ConsentState = { ...state, timestamp: Date.now() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
  setCookie(CONSENT_KEY, JSON.stringify(full), 365);

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: state.ad_storage,
      analytics_storage: state.analytics_storage,
      ad_user_data: state.ad_user_data,
      ad_personalization: state.ad_personalization,
    });
  }

  if (typeof window.fbq === 'function') {
    if (state.ad_storage === 'granted') {
      window.fbq('consent', 'grant');
    } else {
      window.fbq('consent', 'revoke');
    }
  }

  window.dispatchEvent(new CustomEvent('consent:update', { detail: full }));
}

export function acceptAll() {
  setConsent({
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
}

export function rejectAll() {
  setConsent({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

export function acceptAnalyticsOnly() {
  setConsent({
    ad_storage: 'denied',
    analytics_storage: 'granted',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

// ============ Click IDs / UTM persistence ============

export type ClickIds = {
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
};

export function captureClickIds() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const fromUrl: ClickIds = {};
  for (const k of ['gclid', 'fbclid', 'msclkid', 'ttclid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
    const v = params.get(k);
    if (v) (fromUrl as Record<string, string>)[k] = v;
  }
  if (Object.keys(fromUrl).length === 0) return;

  const existing = getClickIds() || {};
  const merged: ClickIds = { ...existing, ...fromUrl };
  merged.landing_path = existing.landing_path || window.location.pathname;
  if (document.referrer) merged.referrer = document.referrer;

  localStorage.setItem(CLICK_IDS_KEY, JSON.stringify(merged));
  setCookie(CLICK_IDS_KEY, JSON.stringify(merged), 30);

  if (typeof window.gtag === 'function') {
    window.gtag('set', 'url_params', fromUrl);
  }
  if (typeof window.fbq === 'function' && (fromUrl.fbclid || fromUrl.utm_source)) {
    window.fbq('trackCustom', 'utm_captured', fromUrl);
  }
}

export function getClickIds(): ClickIds | null {
  if (typeof window === 'undefined') return null;
  const cookie = getCookie(CLICK_IDS_KEY);
  if (cookie) {
    try { return JSON.parse(cookie) as ClickIds; } catch { /* fallthrough */ }
  }
  const ls = localStorage.getItem(CLICK_IDS_KEY);
  if (ls) {
    try { return JSON.parse(ls) as ClickIds; } catch { return null; }
  }
  return null;
}

function enrichPayload(data: EventPayload = {}): EventPayload {
  const ids = getClickIds();
  return {
    session_id: getSessionId(),
    user_id: getUserId() || undefined,
    timestamp: new Date().toISOString(),
    ...(ids ? {
      utm_source: ids.utm_source,
      utm_medium: ids.utm_medium,
      utm_campaign: ids.utm_campaign,
      utm_term: ids.utm_term,
      utm_content: ids.utm_content,
      gclid: ids.gclid,
      fbclid: ids.fbclid,
    } : {}),
    ...data,
  };
}

// ============ Server-side relay (CAPI + GA4 MP) ============

async function sendToServer(event: string, payload: EventPayload) {
  if (typeof window === 'undefined') return;
  const consent = getConsent();
  if (consent && consent.analytics_storage === 'denied') return;
  try {
    const body = JSON.stringify({
      event,
      payload: enrichPayload(payload),
      consent,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/events', body);
    } else {
      fetch('/api/analytics/events', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  } catch { /* silent */ }
}

// ============ Events ============

export function trackViewMenu(menuId = 'tremelikos-burguer') {
  pushToDataLayer('view_menu', { menu_id: menuId });
  sendToServer('view_menu', { menu_id: menuId });
}

export function trackViewItemList(list: AnalyticsItem[], listId: string, listName: string) {
  pushToDataLayer('view_item_list', {
    item_list_id: listId,
    item_list_name: listName,
    items: list,
  });
  sendToServer('view_item_list', { item_list_id: listId, item_list_name: listName, items: list });
}

export function trackSelectItem(item: AnalyticsItem, listId?: string) {
  pushToDataLayer('select_item', {
    items: [item],
    item_list_id: listId,
  });
  sendToServer('select_item', { items: [item], item_list_id: listId });
}

export function trackViewItem(item: AnalyticsItem) {
  pushToDataLayer('view_item', {
    currency: 'BRL',
    value: item.price,
    items: [item],
  });
  sendToServer('view_item', { currency: 'BRL', value: item.price, items: [item] });
}

export function trackAddToCart(item: AnalyticsItem) {
  const qty = item.quantity || 1;
  pushToDataLayer('add_to_cart', {
    currency: 'BRL',
    value: item.price * qty,
    items: [item],
  });
  sendToServer('add_to_cart', { currency: 'BRL', value: item.price * qty, items: [item] });
}

export function trackRemoveFromCart(item: AnalyticsItem) {
  pushToDataLayer('remove_from_cart', {
    currency: 'BRL',
    value: item.price,
    items: [item],
  });
  sendToServer('remove_from_cart', { currency: 'BRL', value: item.price, items: [item] });
}

export function trackViewPromotion(promotion: { id: string; name: string; creative?: string }) {
  pushToDataLayer('view_promotion', {
    promotion_id: promotion.id,
    promotion_name: promotion.name,
    creative_name: promotion.creative,
  });
  sendToServer('view_promotion', {
    promotion_id: promotion.id,
    promotion_name: promotion.name,
    creative_name: promotion.creative,
  });
}

export function trackSelectPromotion(promotion: { id: string; name: string; creative?: string }) {
  pushToDataLayer('select_promotion', {
    promotion_id: promotion.id,
    promotion_name: promotion.name,
    creative_name: promotion.creative,
  });
  sendToServer('select_promotion', {
    promotion_id: promotion.id,
    promotion_name: promotion.name,
  });
}

export function trackBeginCheckout(value: number, items: AnalyticsItem[], orderType: 'delivery' | 'pickup') {
  pushToDataLayer('begin_checkout', {
    currency: 'BRL',
    value,
    items,
    order_type: orderType,
  });
  sendToServer('begin_checkout', { currency: 'BRL', value, items, order_type: orderType });
}

export function trackAddPaymentInfo(items: AnalyticsItem[], paymentMethod: string, orderType: 'delivery' | 'pickup') {
  pushToDataLayer('add_payment_info', {
    currency: 'BRL',
    value: items.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
    items,
    payment_type: paymentMethod,
    order_type: orderType,
  });
  sendToServer('add_payment_info', {
    currency: 'BRL',
    value: items.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
    items,
    payment_type: paymentMethod,
    order_type: orderType,
  });
}

export function trackAddShippingInfo(items: AnalyticsItem[], shippingTier: string, orderType: 'delivery' | 'pickup') {
  pushToDataLayer('add_shipping_info', {
    currency: 'BRL',
    value: items.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
    items,
    shipping_tier: shippingTier,
    order_type: orderType,
  });
  sendToServer('add_shipping_info', {
    currency: 'BRL',
    value: items.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
    items,
    shipping_tier: shippingTier,
    order_type: orderType,
  });
}

export type PurchaseData = {
  transaction_id: string;
  value: number;
  items: AnalyticsItem[];
  order_type: 'delivery' | 'pickup';
  payment_method?: string;
  coupon?: string;
  discount?: number;
  shipping?: number;
};

export function trackPurchase(data: PurchaseData) {
  const payload = {
    transaction_id: data.transaction_id,
    currency: 'BRL',
    value: data.value,
    items: data.items,
    order_type: data.order_type,
    payment_type: data.payment_method,
    coupon: data.coupon,
    discount: data.discount,
    shipping: data.shipping,
  };
  pushToDataLayer('purchase', payload);
  sendToServer('purchase', payload);
  // dispara também como Lead (whatsapp_order) para Meta otimizar campanhas
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      value: data.value,
      currency: 'BRL',
      content_ids: data.items.map((i) => i.item_id),
      content_type: 'product',
    });
  }
}

export function trackWhatsAppOrder(value: number, cartId: string) {
  pushToDataLayer('whatsapp_order', {
    currency: 'BRL',
    value,
    cart_id: cartId,
    transaction_id: cartId,
  });
  sendToServer('whatsapp_order', { currency: 'BRL', value, cart_id: cartId });
}

export function trackCouponApply(coupon: string, discount: number) {
  pushToDataLayer('coupon_apply', { coupon, currency: 'BRL', discount });
  sendToServer('coupon_apply', { coupon, currency: 'BRL', discount });
}

export function trackCouponRemove(coupon: string) {
  pushToDataLayer('coupon_remove', { coupon });
  sendToServer('coupon_remove', { coupon });
}

export function trackSearch(term: string, resultsCount?: number) {
  pushToDataLayer('search', { search_term: term, results_count: resultsCount });
  sendToServer('search', { search_term: term, results_count: resultsCount });
}

export function trackShare(method: 'whatsapp' | 'facebook' | 'instagram' | 'copy' | 'native', contentType: 'product' | 'menu' | 'promotion', itemId?: string) {
  pushToDataLayer('share', { method, content_type: contentType, item_id: itemId });
  sendToServer('share', { method, content_type: contentType, item_id: itemId });
}

export function trackContactClick(method: 'whatsapp' | 'phone' | 'instagram' | 'facebook') {
  pushToDataLayer('contact_click', { method });
  sendToServer('contact_click', { method });
}

export function trackStoreStatus(isOpen: boolean) {
  pushToDataLayer('store_status', { is_open: isOpen });
  sendToServer('store_status', { is_open: isOpen });
}

// ============ SPA PageView ============

export function trackPageView(path: string, title?: string) {
  pushToDataLayer('page_view', { page_path: path, page_title: title });
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}