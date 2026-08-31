'use client';

import { useStore } from '@/features/cart/StoreContext';

export default function Footer() {
  const { store } = useStore();

  return (
    <footer className="bg-brand-contrast text-white py-8">
      <div className="container-store">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-2">{store?.name || "Tremeliko's Burguer"}</h3>
            <p className="text-sm text-white/80">
              Hambúrguer na brasa, sabor de verdade.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Endereço</h4>
            <p className="text-sm text-white/80">
              {store?.address || 'Rua Gonçalves da Costa, 3'}
              <br />
              {store?.city || 'Jequié'} - {store?.state || 'BA'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Horário</h4>
            <p className="text-sm text-white/80">
              Terça a Sábado
              <br />
              18:30 às 23:00
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm text-white/60">
          <p>© {new Date().getFullYear()} Tremeliko's Burguer. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
