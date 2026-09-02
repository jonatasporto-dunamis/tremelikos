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

const PURCHASE_EVENTS = new Set(['purchase', 'whatsapp_order']);

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
  const { user_id, email, phone, value, currency, items, transaction_id, clickIds } = payload;
  const userData: Record<string, string> = {};
  if (email) userData.em = sha256(email);
  if (phone) userData.ph = sha256(phone);
  if (user_id) userData.external_id = sha256(user_id);
  userData.client_ip_address = extractClientIp(req);
  userData.client_user_agent = userAgent(req);
  if (clickIds?.fbclid) userData.fbc = `fb.1.${Date.now()}.${clickIds.fbclid}`;
  if (clickIds?.gclid) userData.fbp = '';

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
    event === 'view_menu' ? 'PageView' :
    null;

  if (!eventName) return null;

  const customData: Record<string, unknown> = {};
  if (value !== undefined) customData.value = value;
  if (currency) customData.currency = currency;
  if (items?.length) {
    customData.content_ids = items.map((i: any) => i.item_id);
    customData.contents = items.map((i: any) => ({
      id: i.item_id,
      quantity: i.quantity || 1,
    }));
    customData.content_type = 'product';
  }
  if (transaction_id) customData.content_name = `order_${transaction_id}`;

  const body = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: transaction_id || `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_data: userData,
      custom_data: customData,
      event_source_url: req.headers.get('referer') || undefined,
    }],
    access_token: META_CAPI_TOKEN,
  };

  const url = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status };
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