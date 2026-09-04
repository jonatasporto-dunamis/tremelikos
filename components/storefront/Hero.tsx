'use client';

import { useStore } from '@/features/cart/StoreContext';
import { Icon } from '@/components/ui';

interface HeroProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  /** 'open' | 'closing' | 'closed' — fornecido pelo caller, já calculado. */
  storeStatus?: 'open' | 'closing' | 'closed';
  /** ISO ou HH:mm opcional — só exibido se for explicitamente confiável. */
  closesAt?: string;
}

export default function Hero({
  title = 'Hambúrguer na brasa, sabor de verdade',
  subtitle = 'Hambúrguer artesanal na brasa em Jequié/BA. Picanha 180g, pão de 23cm e o sabor da casa no balcão ou no seu sofá.',
  badge = '🔥 Picanha 180g · Na brasa · Pão de 23cm',
  storeStatus = 'open',
  closesAt,
}: HeroProps) {
  const { store } = useStore();

  // Configuração visual (cores de status SEM mudar o tipo do card)
  const statusConfig = {
    open: {
      bg: 'bg-success/10 border-success/30',
      dot: 'bg-success',
      text: closesAt ? `Aberto · fecha às ${closesAt}` : 'Aberto agora',
      label: 'Loja aberta',
    },
    closing: {
      bg: 'bg-warning/10 border-warning/30',
      dot: 'bg-warning',
      text: closesAt ? `Fecha às ${closesAt}` : 'Fechando em breve',
      label: 'Fechando em breve',
    },
    closed: {
      bg: 'bg-danger/10 border-danger/30',
      dot: 'bg-danger',
      text: 'Fechado',
      label: 'Loja fechada',
    },
  }[storeStatus];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-hover text-white"
      aria-label="Apresentação da loja"
    >
      {/* decorativo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 bottom-0 w-40 h-40 rounded-full bg-white/10 blur-2xl"
      />

      <div className="container-store py-6 md:py-8 relative">
        <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
          <span aria-hidden="true">🍔</span>
          <span>{badge}</span>
        </span>

        <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-2 max-w-xl text-balance">
          {title}
        </h1>
        <p className="text-white/90 text-sm md:text-base max-w-lg mb-4">
          {subtitle}
        </p>

        <ul className="flex flex-wrap gap-2 text-xs md:text-sm">
          <li className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full">
            <Icon.map size={14} />
            Jequiezinho · Jequié - BA
          </li>
          <li className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full">
            <Icon.truck size={14} />
            Delivery e retirada
          </li>
          <li className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full">
            <Icon.card size={14} />
            Pix e cartão
          </li>
        </ul>

        <div
          role="status"
          aria-label={statusConfig.label}
          className={`mt-5 inline-flex items-center gap-2 ${statusConfig.bg} border rounded-full pl-2 pr-4 py-1.5`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} ${
              storeStatus === 'open' ? 'animate-pulse' : ''
            }`}
            aria-hidden="true"
          />
          <span className="text-xs sm:text-sm font-semibold text-ink">{statusConfig.text}</span>
        </div>
      </div>
    </section>
  );
}
