'use client';

import { useStore } from '@/features/cart/StoreContext';
import { trackContactClick } from '@/features/analytics/events';

interface HeroProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  storeStatus?: 'open' | 'closing' | 'closed';
  closesAt?: string;
}

export default function Hero({
  title = 'Hambúrguer na brasa, sabor de verdade',
  subtitle = 'Seu hambúrguer artesanal na brasa em Jequié',
  badge = '🔥 Picanha 180g · Na brasa · Pão de 23cm',
  storeStatus = 'open',
  closesAt,
}: HeroProps) {
  const { store } = useStore();
  const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';

  const statusConfig = {
    open: {
      bg: 'bg-green-50 border-green-200',
      dot: 'bg-green-600',
      text: closesAt ? `Aberto · fecha às ${closesAt}` : 'Aberto agora',
      label: 'Loja aberta',
    },
    closing: {
      bg: 'bg-amber-50 border-amber-200',
      dot: 'bg-amber-500',
      text: `Fechando em breve · ${closesAt || '23h00'}`,
      label: 'Fechando em breve',
    },
    closed: {
      bg: 'bg-red-50 border-red-200',
      dot: 'bg-red-600',
      text: 'Fechado · abre hoje às 18h30',
      label: 'Loja fechada',
    },
  }[storeStatus];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-hover text-white">
      <div className="container-store py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {badge}
            </span>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-2 max-w-xl">
              {title}
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-lg mb-3">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-white/20 px-3 py-1.5 rounded-full">📍 Jequiezinho · Jequié</span>
              <span className="bg-white/20 px-3 py-1.5 rounded-full">🚚 Delivery e retirada</span>
              <span className="bg-white/20 px-3 py-1.5 rounded-full">💳 Pix e cartão</span>
            </div>
          </div>
        </div>

        {/* status operacional em pill branco, alto contraste */}
        <div
          role="status"
          aria-label={statusConfig.label}
          className={`mt-5 inline-flex items-center gap-2 ${statusConfig.bg} border rounded-full pl-2 pr-4 py-1.5`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} ${storeStatus === 'open' ? 'animate-pulse' : ''}`} aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-900">{statusConfig.text}</span>
        </div>
      </div>
    </section>
  );
}