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

// Constrói o fbc no formato oficial Meta: fb.<subdomain_index>.<creation_time_ms>.<fbclid>
// subdomain_index = 1 (gerado server-side), conforme documentação:
// "If you're generating this field on a server, and not saving an _fbc cookie, use the value 1."
function buildFbc(fbclid: string, clickIdTime?: number): string {
  if (!fbclid) return '';
  const creationTimeMs = clickIdTime || Date.now();
  return `fb.1.${creationTimeMs}.${fbclid}`;
}

async function sendToMeta(event: string, payload: any, req: NextRequest) {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return null;
  const { user_id, email, phone, contact, value, currency, items, transaction_id, clickIds, fbp, page_url } = payload;

  // ============== user_data (Customer Information Parameters) ==============
  const userData: Record<string, unknown> = {};

  // Email (lowercase, trim) - hashing required
  const finalEmail = (email || contact?.email || '').toString().trim().toLowerCase();
  if (finalEmail) userData.em = [sha256(finalEmail)];

  // Phone (só dígitos, com DDI) - hashing required
  const phoneDigits = (phone || contact?.phone || '').toString().replace(/\D/g, '');
  if (phoneDigits) userData.ph = [sha256(phoneDigits)];

  // Nome/sobrenome se disponível
  if (contact?.name) {
    const parts = contact.name.trim().split(/\s+/);
    if (parts[0]) userData.fn = [sha256(parts[0].toLowerCase())];
    if (parts.length > 1) userData.ln = [sha256(parts.slice(1).join(' ').toLowerCase())];
  }

  // Cidade/Estado/ZIP da loja (público) - default no nível do evento
  userData.client_ip_address = extractClientIp(req);
  userData.client_user_agent = userAgent(req);

  // external_id - hashing recommended
  if (user_id) userData.external_id = [sha256(user_id)];

  // fbc (Click ID) - "fb.${subdomain_index}.${creation_time}.${fbclid}"
  // - subdomain_index = 1 (server-side)
  // - creation_time = UNIX ms quando o fbclid foi observado pela primeira vez
  const fbclid = clickIds?.fbclid || payload.fbclid;
  if (fbclid) {
    // Persistimos o timestamp da primeira observação em localStorage
    // (clickIds.firstObservedAt, em ms) — se não houver, usa Date.now()
    const observedAt = clickIds?.firstObservedAt || Date.now();
    userData.fbc = buildFbc(fbclid, observedAt);
  }

  // fbp (Browser ID) - "fb.${subdomain_index}.${creation_time}.${randomnumber}"
  // - Se o client enviou um fbp (cookie _fbp do Meta Pixel OU nosso ensureFbp()),
  //   use-o — garante match entre browser pixel e server CAPI.
  // - Se não, NÃO gere um novo: o fbc é suficiente para atribuição.
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

  // ============== event_id (dedup) ==============
  // Para Purchase, event_id = transaction_id (dedup 100%)
  // Para outros, hash determinística(session_id + event + item_id + floor(t/30s))
  let eventId: string;
  if (transaction_id && (event === 'purchase' || event === 'whatsapp_order' || event === 'cart_abandon')) {
    eventId = transaction_id;
  } else if (Array.isArray(items) && items.length) {
    const itemKey = items.map((i: any) => i.item_id).sort().join(',');
    const bucket = Math.floor(Date.now() / 30000); // janela 30s
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

  // ============== payload final ==============
  const eventSourceUrl = page_url || req.headers.get('referer') || undefined;
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