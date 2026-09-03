import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PURCHASE_EVENTS = new Set(['purchase', 'whatsapp_order', 'cart_abandon']);

function sha256(input: string): string {
  return createHash('sha256').update(input.trim().toLowerCase()).digest('hex');
}

function extractClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    ''
  );
}

function userAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || '';
}

async function sendToMeta(event: string, payload: any, req: NextRequest) {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return null;
  const { user_id, email, phone, contact, value, currency, items, transaction_id, clickIds, fbp, page_url, event_id: clientEventId } = payload;

  // ============== user_data (Customer Information Parameters) ==============
  const userData: Record<string, unknown> = {};

  // em: trim + lowercase + SHA-256
  const finalEmail = (email || contact?.email || '').toString().trim().toLowerCase();
  if (finalEmail) userData.em = [sha256(finalEmail)];

  // ph: Remove símbolos/letras/leading zeros + DDI + SHA-256
  // Doc: "Phone numbers must include a country code to be used for matching"
  // Doc: "Always include the country code as part of your customers' phone numbers,
  //       even if all of your data is from the same country"
  let phoneDigits = (phone || contact?.phone || '').toString().replace(/\D/g, '');
  if (phoneDigits) {
    phoneDigits = phoneDigits.replace(/^0+/, ''); // remove leading zeros
    // Adiciona DDI 55 (Brasil) se o número tiver 10-11 dígitos (DDD + número)
    if (phoneDigits.length >= 10 && phoneDigits.length <= 11 && !phoneDigits.startsWith('55')) {
      phoneDigits = '55' + phoneDigits;
    }
    userData.ph = [sha256(phoneDigits)];
  }

  // fn/ln: lower + SHA-256
  if (contact?.name) {
    const parts = contact.name.trim().split(/\s+/);
    if (parts[0]) {
      const fn = parts[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
      if (fn) userData.fn = [sha256(fn)];
    }
    if (parts.length > 1) {
      const ln = parts.slice(1).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, '').trim();
      if (ln) userData.ln = [sha256(ln)];
    }
  }

  // ct/st/zp/country podem ser úteis — Tremeliko é de Jequié/BA
  // (não temos do user, mas se a doc diz que ajuda match, vale adicionar)
  // Para e-commerce single-location, podemos usar fixo
  // Vou pular para não inventar dados

  // IP + UA: required for CAPI website events
  userData.client_ip_address = extractClientIp(req);
  userData.client_user_agent = userAgent(req);

  // external_id: hashing recommended
  if (user_id) userData.external_id = [sha256(String(user_id))];

  // fbc: "fb.${subdomain_index}.${creation_time}.${fbclid}"
  const fbclid = clickIds?.fbclid || payload.fbclid;
  if (fbclid) {
    const observedAt = clickIds?.firstObservedAt || Date.now();
    userData.fbc = `fb.1.${observedAt}.${fbclid}`;
  }

  // fbp: lê do cookie _fbp criado pelo Meta Pixel no browser
  // Doc: "The Meta browser ID value is stored in the _fbp browser cookie under your domain"
  // (só envia se o client já tem — não geramos)
  if (fbp) {
    userData.fbp = String(fbp);
  }

  // ============== event_name (mapeamento) ==============
  const eventName =
    event === 'whatsapp_order' ? 'Lead' :
    event === 'purchase' ? 'Purchase' :
    event === 'add_to_cart' ? 'AddToCart' :
    event === 'begin_checkout' ? 'InitiateCheckout' :
    event === 'view_item' ? 'ViewContent' :
    event === 'select_item' ? 'ViewContent' :
    event === 'view_promotion' ? 'ViewContent' :
    event === 'select_promotion' ? 'Lead' :
    event === 'search' ? 'Search' :
    event === 'cart_abandon' ? 'AddToCart' :
    event === 'view_menu' ? 'PageView' :
    null;
  if (!eventName) return null;

  // ============== custom_data ==============
  const customData: Record<string, unknown> = {};
  if (value !== undefined && value !== null) customData.value = value;
  if (currency) customData.currency = currency;

  // contents (formato oficial: array de {id, quantity, item_price?, delivery_category?})
  if (Array.isArray(items) && items.length) {
    customData.contents = items.map((i: any) => ({
      id: i.item_id,
      quantity: i.quantity || 1,
      ...(i.price !== undefined ? { item_price: i.price } : {}),
    }));
    customData.content_ids = items.map((i: any) => i.item_id);
    customData.content_type = 'product';
  }
  if (transaction_id) customData.order_id = transaction_id;

  // ============== event_id (dedup com pixel browser) ==============
  // Doc: "For other events without an intrinsic ID number, a random number
  //       (so long as the same random number is sent between browser and server
  //       events) can be used."
  // Para Purchase, dedupe perfeito: event_id = transaction_id
  // Para outros: o CLIENT envia o event_id (gerado no momento do fbq('track'))
  // para que pixel browser e CAPI usem o mesmo ID.
  let eventId: string;
  if (transaction_id && (event === 'purchase' || event === 'whatsapp_order' || event === 'cart_abandon')) {
    eventId = transaction_id;
  } else if (clientEventId) {
    eventId = String(clientEventId);
  } else if (Array.isArray(items) && items.length) {
    const itemKey = items.map((i: any) => i.item_id).sort().join(',');
    const bucket = Math.floor(Date.now() / 30000);
    eventId = `${event}_${payload.session_id || 'srv'}_${itemKey}_${bucket}`;
  } else {
    const bucket = Math.floor(Date.now() / 30000);
    eventId = `${event}_${payload.session_id || 'srv'}_${bucket}`;
  }

  // ============== LGPD: data_processing_options ==============
  // Se o usuário negou ad_user_data, marcamos limited_data_use
  const dataProcessingOptions = payload.consent?.ad_user_data === 'denied'
    ? { data_processing_options: ['LDU'], data_processing_options_country: 0, data_processing_options_state: 0 }
    : undefined;

  // ============== event_source_url (REQUIRED for CAPI website events) ==============
  // Doc: "The browser URL where the event happened. The URL should match the verified domain."
  // Prioridade: page_url (enviado pelo client) > referer (se for do nosso domínio)
  const VERIFIED_DOMAIN = 'tremelikos.growthpulse.com.br';
  let eventSourceUrl: string | undefined;
  if (page_url) {
    try {
      const u = new URL(page_url);
      if (u.hostname.endsWith('tremelikos.growthpulse.com.br')) {
        eventSourceUrl = u.toString();
      }
    } catch { /* ignore */ }
  }
  if (!eventSourceUrl) {
    const ref = req.headers.get('referer');
    if (ref) {
      try {
        const u = new URL(ref);
        if (u.hostname.endsWith(VERIFIED_DOMAIN)) eventSourceUrl = u.toString();
      } catch { /* ignore */ }
    }
  }
  if (!eventSourceUrl) eventSourceUrl = `https://${VERIFIED_DOMAIN}/`;

  const referrerUrl = req.headers.get('referer') || undefined;

  const eventBody: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_id: eventId,
    event_source_url: eventSourceUrl,
    referrer_url: referrerUrl,
    user_data: userData,
    custom_data: customData,
  };
  if (dataProcessingOptions) Object.assign(eventBody, dataProcessingOptions);

  const body = {
    data: [eventBody],
    access_token: META_CAPI_TOKEN,
  };

  const url = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, error: text };
    }
    return { ok: res.ok, status: res.status, event_id: eventId, event_name: eventName };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function sendToGA4(event: string, payload: any, req: NextRequest) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return null;
  const { client_id, session_id, user_id, value, currency, items, transaction_id, ...rest } = payload;

  const params: Record<string, unknown> = {
    engagement_time_msec: 1,
    session_id: session_id || undefined,
    ...rest,
  };
  if (value !== undefined) params.value = value;
  if (currency) params.currency = currency;
  if (items?.length) params.items = items;
  if (transaction_id) params.transaction_id = transaction_id;

  const body = {
    client_id: client_id || `srv.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`,
    user_id: user_id || undefined,
    timestamp_micros: Date.now() * 1000,
    non_personalized_ads: payload.consent?.ad_storage === 'denied' || undefined,
    events: [{
      name: event,
      params,
    }],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function saveEvent(event: string, payload: any, req: NextRequest) {
  if (!PURCHASE_EVENTS.has(event) && event !== 'lead') return;
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
    await sb.from('analytics_events').insert({
      event_name: event,
      transaction_id: payload.transaction_id || null,
      value: payload.value || null,
      currency: payload.currency || 'BRL',
      items: payload.items || null,
      user_id: payload.user_id || null,
      session_id: payload.session_id || null,
      source: 'server',
      click_ids: payload.clickIds || null,
      utm: {
        source: payload.utm_source,
        medium: payload.utm_medium,
        campaign: payload.utm_campaign,
        term: payload.utm_term,
        content: payload.utm_content,
      },
      ip: extractClientIp(req),
      user_agent: userAgent(req).slice(0, 500),
    });
  } catch { /* não bloqueia o tracking */ }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const { event, payload, consent } = body || {};
  if (!event || typeof event !== 'string') {
    return NextResponse.json({ ok: false, error: 'missing_event' }, { status: 400 });
  }

  // se consentimento explícito foi recusado para analytics, não envia GA4 nem DB
  const analyticsDenied = consent?.analytics_storage === 'denied';
  const adsDenied = consent?.ad_storage === 'denied';

  const results: Record<string, unknown> = {};

  if (!adsDenied) {
    results.meta = await sendToMeta(event, payload, req);
  }
  if (!analyticsDenied) {
    results.ga4 = await sendToGA4(event, payload, req);
    // só persiste purchase/lead para relatório de receita
    if (PURCHASE_EVENTS.has(event)) {
      await saveEvent(event, payload, req);
    }
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    config: {
      meta: !!META_PIXEL_ID,
      ga4: !!GA4_MEASUREMENT_ID,
    },
  });
}