'use client';

import { useStore } from '@/features/cart/StoreContext';
import { Icon } from '@/components/ui';

interface HeroProps {
  title?: string;
  subtitle?: string;
  /** 'open' | 'closing' | 'closed' — fornecido pelo caller, já calculado. */
  storeStatus?: 'open' | 'closing' | 'closed';
  /** ISO ou HH:mm opcional — só exibido se for explicitamente confiável. */
  closesAt?: string;
}

export default function Hero({
  title = 'Hambúrguer na brasa, sabor de verdade',
  subtitle = 'Hambúrguer artesanal na brasa em Jequié/BA. Sabor de verdade no balcão ou no seu sofá.',
  storeStatus = 'open',
  closesAt,
}: HeroProps) {
  const { store } = useStore();

  // Configuração visual (cores de status)
  const statusConfig = {
    open: {
      dot: 'bg-success',
      text: closesAt ? `Aberto · fecha às ${closesAt}` : 'Aberto agora',
      label: 'Loja aberta',
    },
    closing: {
      dot: 'bg-warning',
      text: closesAt ? `Fecha às ${closesAt}` : 'Fechando em breve',
      label: 'Fechando em breve',
    },
    closed: {
      dot: 'bg-gray-400',
      text: 'Fechado',
      label: 'Loja fechada',
    },
  }[storeStatus];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#8B3A00] via-[#C45200] to-[#E8750A] text-white"
      aria-label="Apresentação da loja"
    >
      {/* Overlay escuro para legibilidade */}
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />

      {/* Padrão decorativo sutil */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full bg-white/10 blur-xl" />
      </div>

      <div className="container-store py-4 md:py-5 relative">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight mb-1.5 max-w-xl text-balance">
          {title}
        </h1>
        <p className="text-white/90 text-xs sm:text-sm max-w-lg mb-3">
          {subtitle}
        </p>

        <ul className="flex flex-wrap gap-1.5 text-[11px] md:text-xs mb-3">
          <li className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-1 rounded-full">
            <Icon.map size={12} />
            Jequiezinho · Jequié - BA
          </li>
          <li className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-1 rounded-full">
            <Icon.truck size={12} />
            Delivery e retirada
          </li>
          <li className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-1 rounded-full">
            <Icon.card size={12} />
            Pix e cartão
          </li>
        </ul>

        <div
          role="status"
          aria-label={statusConfig.label}
          className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 rounded-full px-3 py-1"
        >
          <span
            className={`w-2 h-2 rounded-full ${statusConfig.dot} ${
              storeStatus === 'open' ? 'animate-pulse' : ''
            }`}
            aria-hidden="true"
          />
          <span className="text-xs font-semibold">{statusConfig.text}</span>
        </div>
      </div>
    </section>
  );
}
