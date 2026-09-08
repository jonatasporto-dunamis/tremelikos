'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/features/cart/StoreContext';
import { trackStoreClosedSession } from '@/features/analytics/events';

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
      <div className="container-store min-h-[44px] flex items-center gap-2 py-0 text-xs text-red-800">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
        <p className="flex-1 min-w-0 truncate">
          <strong>Fechado.</strong>{' '}
          {nextOpenTime || 'Confira os horários de funcionamento'}
        </p>
        <Link
          href="/perfil-da-loja"
          className="inline-flex min-h-[44px] shrink-0 items-center px-2.5 text-xs font-semibold text-red-700 hover:text-red-900"
        >
          Horários
        </Link>
      </div>
    </div>
  );
}
