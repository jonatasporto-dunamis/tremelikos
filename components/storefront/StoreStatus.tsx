'use client';

import { useStore } from '@/features/cart/StoreContext';

export default function StoreStatus({ className = '' }: { className?: string }) {
  const { isOpen, closingSoon, nextOpenTime } = useStore();

  if (isOpen && closingSoon) {
    return (
      <div className={['flex items-center gap-1.5', className].join(' ')}>
        <span className="inline-block w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
        <span className="text-[11px] font-semibold text-warning uppercase tracking-wide">
          Fechando em breve
        </span>
      </div>
    );
  }

  if (isOpen) {
    return (
      <div className={['flex items-center gap-1.5', className].join(' ')}>
        <span className="relative flex w-2 h-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-block w-2 h-2 rounded-full bg-success" />
        </span>
        <span className="text-[11px] font-semibold text-success uppercase tracking-wide">
          Aberto agora
        </span>
      </div>
    );
  }

  return (
    <div className={['flex items-center gap-1.5', className].join(' ')}>
      <span className="inline-block w-2 h-2 rounded-full bg-danger" aria-hidden="true" />
      <span className="text-[11px] font-semibold text-danger uppercase tracking-wide">
        {nextOpenTime || 'Fechado'}
      </span>
    </div>
  );
}
