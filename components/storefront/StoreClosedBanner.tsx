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
        <div className="container-store py-2 flex items-center gap-2 text-sm text-amber-900">
          <span aria-hidden="true">⏰</span>
          <p>
            <strong>Aberto até 23h.</strong> Garanta seu pedido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="bg-red-50 border-b-2 border-red-300"
    >
      <div className="container-store py-3 space-y-2">
        <div className="flex items-start gap-2 text-sm text-red-900">
          <span aria-hidden="true" className="text-lg leading-none">🔴</span>
          <div className="flex-1">
            <p className="font-semibold">Estamos fechados no momento.</p>
            {nextOpenTime && (
              <p className="text-red-800">{nextOpenTime}</p>
            )}
            {nextOpenAt && (
              <p className="text-xs text-red-700 mt-0.5">
                Próxima abertura: {formatDay(nextOpenAt)} às {formatTime(nextOpenAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-block bg-red-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-red-700 min-h-[40px]"
          >
            📋 Ver cardápio
          </Link>
          <Link
            href="/perfil-da-loja"
            className="inline-block text-sm text-red-800 hover:underline px-3 py-2 min-h-[40px]"
          >
            Ver horários
          </Link>
        </div>
      </div>
    </div>
  );
}
