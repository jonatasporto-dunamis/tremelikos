'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/features/cart/StoreContext';
import { trackStoreClosedSession } from '@/features/analytics/events';

function formatTime(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleDateString('pt-BR', { weekday: 'long' });
}

export default function StoreClosedBanner() {
  const { store, loading, isOpen, isClosed, nextOpenAt, nextOpenTime, closingSoon, manualPause } = useStore();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isClosed && nextOpenAt && trackedRef.current !== nextOpenAt.toISOString()) {
      trackedRef.current = nextOpenAt.toISOString();
      trackStoreClosedSession(nextOpenAt.toISOString());
    }
  }, [isClosed, nextOpenAt]);

  if (loading || !store) return null;

  const closed = isClosed || manualPause;

  if (!closed && !closingSoon) return null;

  if (isOpen && closingSoon) {
    return (
      <div
        role="status"
        className="bg-amber-50 border-b border-amber-200"
      >
        <div className="container-store py-1.5 flex items-center gap-2 text-xs text-amber-900">
          <span aria-hidden="true">⏰</span>
          <p className="font-medium">
            <strong>Aberto até 23h.</strong> Aproveite!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="bg-red-50 border-b border-red-200"
    >
      <div className="container-store py-1.5">
        <div className="flex items-center gap-2 text-xs text-red-800">
          <span aria-hidden="true" className="text-base leading-none">🔴</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">Fechado</span>
            {nextOpenTime && (
              <span className="ml-1.5 text-red-700">{nextOpenTime}</span>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center bg-red-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-700 min-h-[44px]"
            >
              📋 Cardápio
            </Link>
            <Link
              href="/perfil-da-loja"
              className="inline-flex items-center text-xs text-red-700 hover:bg-red-100 px-2.5 py-1.5 rounded-lg min-h-[44px]"
            >
              Horários
            </Link>
          </div>
        </div>
        {nextOpenAt && (
          <p className="mt-0.5 text-[11px] text-red-600 pl-6">
            Abre {formatDay(nextOpenAt)} às {formatTime(nextOpenAt)}
          </p>
        )}
      </div>
    </div>
  );
}
