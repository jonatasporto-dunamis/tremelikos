'use client';

import { useStore } from '@/features/cart/StoreContext';
import Badge from '@/components/ui/Badge';

export default function StoreStatus({ className = '' }: { className?: string }) {
  const { isOpen, nextOpenTime } = useStore();

  return (
    <div className={['flex items-center gap-2', className].join(' ')}>
      {isOpen ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <Badge variant="success">Aberto agora</Badge>
        </>
      ) : (
        <>
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          <Badge variant="danger">{nextOpenTime ? `Abre ${nextOpenTime}` : 'Fechado'}</Badge>
        </>
      )}
    </div>
  );
}