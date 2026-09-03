'use client';

import { useStore } from '@/features/cart/StoreContext';
import Badge from '@/components/ui/Badge';

export default function StoreStatus({ className = '' }: { className?: string }) {
  const { isOpen, closingSoon, nextOpenTime } = useStore();

  if (isOpen && closingSoon) {
    return (
      <div className={['flex items-center gap-2', className].join(' ')}>
        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" aria-hidden="true" />
        <Badge variant="warning">Fechando em breve</Badge>
      </div>
    );
  }

  if (isOpen) {
    return (
      <div className={['flex items-center gap-2', className].join(' ')}>
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <Badge variant="success">Aberto agora</Badge>
      </div>
    );
  }

  return (
    <div className={['flex items-center gap-2', className].join(' ')}>
      <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500" aria-hidden="true" />
      <Badge variant="danger">{nextOpenTime || 'Fechado'}</Badge>
    </div>
  );
}
