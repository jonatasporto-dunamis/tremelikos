'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { usePromotions } from '@/features/promotions/usePromotions';
import { formatMoney } from '@/lib/money';
import CheckoutProgress from '@/components/storefront/CheckoutProgress';
import {
  trackIdentificationStart,
  trackIdentificationComplete,
  setContact,
  getContact,
} from '@/features/analytics/events';

function maskPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isPhoneValid(digits: string): boolean {
  return digits.length === 10 || digits.length === 11;
}

const STORAGE_KEY = 'tremelikos:returning';

interface Returning {
  phone: string;
  name?: string;
  email?: string;
  lastOrderAt: string;
  count: number;
}

function getReturningByPhone(digits: string): Returning | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all: Record<string, Returning> = JSON.parse(raw);
    return all[digits] || null;
  } catch {
    return null;
  }
}

function saveReturning(data: Returning) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const all: Record<string, Returning> = raw ? JSON.parse(raw) : {};
    all[data.phone] = data;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export default function IdentificacaoPage() {
  const router = useRouter();
  const { state, subtotal, itemCount } = useCart();
  const { total } = usePromotions();
  const { isClosed, nextOpenAt } = useStore();
  const phoneRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTracked = useRef(false);
  const [returningInfo, setReturningInfo] = useState<Returning | null>(null);

  useEffect(() => {
    phoneRef.current?.focus();
    if (!startTracked.current) {
      startTracked.current = true;
      trackIdentificationStart();
    }
  }, []);

  // se voltar com contato em memória, preenche (não conta como "returning" ainda)
  useEffect(() => {
    const c = getContact();
    if (c) {
      if (c.phone) setPhone(maskPhoneBR(c.phone));
      if (c.name) setName(c.name);
      if (c.email) setEmail(c.email);
    }
  }, []);

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = isPhoneValid(phoneDigits);
  const nameOk = name.trim().length >= 2;
  const canContinue = phoneOk && nameOk && acceptPrivacy;

  const handlePhoneBlur = () => {
    if (!phoneOk) return;
    const found = getReturningByPhone(phoneDigits);
    if (found) {
      setReturningInfo(found);
      if (found.name && !name) setName(found.name);
      if (found.email && !email) setEmail(found.email);
    } else {
      setReturningInfo(null);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    setSubmitting(true);
    setContact({
      name: name.trim(),
      phone: phoneDigits,
      email: email.trim() || undefined,
    });
    const existing = getReturningByPhone(phoneDigits);
    saveReturning({
      phone: phoneDigits,
      name: name.trim(),
      email: email.trim() || undefined,
      lastOrderAt: new Date().toISOString(),
      count: (existing?.count || 0) + 1,
    });
    trackIdentificationComplete(existing ? 'returning' : 'whatsapp_first');
    router.push('/carrinho/enviar');
  };

  if (state.items.length === 0) {
    return (
      <div className="container-store py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-brand-contrast mb-2">Seu carrinho está vazio</h2>
          <Link href="/" className="btn-primary inline-block">Ver cardápio</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CheckoutProgress current={2} />

      <div className="container-store py-4 space-y-4 max-w-2xl mx-auto">
        {isClosed && nextOpenAt && (
          <div role="status" className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            📅 Loja fechada agora. Seu pedido será agendado para{' '}
            <strong>
              {nextOpenAt.toLocaleDateString('pt-BR', { weekday: 'long' })} às {nextOpenAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </strong>
            .
          </div>
        )}

        <div className="card p-4">
          <h1 className="text-lg font-bold text-brand-contrast mb-1">📞 Seus dados</h1>
          <p className="text-sm text-ink-muted mb-4">
            Usamos o WhatsApp só para confirmar seu pedido e combinar entrega/retirada.
          </p>

          {returningInfo && (
            <div
              role="status"
              className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800"
            >
              👋 Olá de novo! Você já pediu {returningInfo.count}× antes por este número.
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleContinue(); }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink mb-1">
                WhatsApp <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                ref={phoneRef}
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
                onBlur={handlePhoneBlur}
                placeholder="(73) 99154-2371"
                inputMode="tel"
                autoComplete="tel"
                required
                aria-required="true"
                aria-invalid={phone.length > 0 && !phoneOk}
                className="w-full p-3 border border-gray-200 rounded-lg text-base min-h-[48px]"
              />
              {phone.length > 0 && !phoneOk && (
                <p role="alert" className="mt-1 text-xs text-red-700">
                  Informe DDD + número (10 ou 11 dígitos).
                </p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
                Como podemos te chamar? <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                disabled={!phoneOk}
                required
                aria-required="true"
                aria-disabled={!phoneOk}
                className="w-full p-3 border border-gray-200 rounded-lg text-base min-h-[48px] disabled:opacity-50"
              />
              {!phoneOk && (
                <p className="mt-1 text-xs text-ink-muted">
                  Preencha o WhatsApp primeiro.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                Email <span className="text-xs text-ink-muted font-normal">(opcional, para receber a confirmação)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={!phoneOk}
                className="w-full p-3 border border-gray-200 rounded-lg text-base min-h-[48px] disabled:opacity-50"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="accent-brand w-4 h-4 mt-0.5 shrink-0"
                required
              />
              <span className="text-xs text-ink-muted">
                Concordo com a <Link href="/politica-de-privacidade" className="underline" target="_blank">política de privacidade</Link> e autorizo o contato via WhatsApp para confirmar este pedido.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link
                href="/carrinho"
                className="sm:w-40 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium hover:bg-gray-50 text-center"
              >
                ← Voltar
              </Link>
              <button
                type="submit"
                disabled={!canContinue || submitting}
                className="flex-1 btn-primary py-3 min-h-[48px] disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Continuar →'}
              </button>
            </div>
          </form>
        </div>

        {/* Resumo sempre visível (9.5.6) */}
        <div className="card p-4">
          <h2 className="font-bold text-brand-contrast mb-2 text-sm">📋 Resumo do pedido</h2>
          <ul className="text-sm text-ink space-y-1 mb-2">
            {state.items.map((it) => {
              const extras = it.extras?.reduce((s, e) => s + e.price, 0) || 0;
              return (
                <li key={it.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {it.quantity}× {it.product.name}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    {formatMoney((it.product.base_price + extras) * it.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-bold text-brand">{formatMoney(total.finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
