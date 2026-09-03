'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/features/cart/CartContext';
import Link from 'next/link';

function OrderOkContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { dispatch } = useCart();
  const orderId = params.get('orderId');
  const cartId = params.get('cartId');
  const [contact, setContact] = useState<{ name?: string; phone?: string } | null>(null);

  useEffect(() => {
    dispatch({ type: 'CLEAR_CART' });
    try {
      const c = window.localStorage.getItem('tremelikos:contact');
      if (c) setContact(JSON.parse(c));
    } catch { /* ignore */ }
    // limpa checkout storage
    try {
      window.localStorage.removeItem('tremelikos:checkout');
    } catch { /* ignore */ }
  }, [dispatch]);

  return (
    <div className="container-store py-8 max-w-md mx-auto text-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand-contrast">Pedido enviado!</h1>
        <p className="mt-2 text-sm text-gray-600">
          Recebemos seu pedido e vamos confirmar pelo WhatsApp em instantes.
        </p>
        {cartId && (
          <p className="mt-1 text-xs text-gray-500">
            <strong>Código:</strong> <span className="font-mono">{cartId}</span>
          </p>
        )}
        {contact?.phone && (
          <p className="mt-1 text-xs text-gray-500">
            Responderemos no WhatsApp <strong>{contact.phone}</strong>.
          </p>
        )}

        <div className="mt-6 space-y-2 text-left">
          <h2 className="text-sm font-semibold text-brand-contrast">Próximos passos</h2>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-4">
            <li>Confirmação do pedido pelo WhatsApp</li>
            <li>Pagamento (se PIX, enviaremos QR Code)</li>
            <li>Preparo e entrega/retirada</li>
          </ol>
        </div>

        <div className="mt-6 space-y-2">
          <Link href="/" className="block w-full btn-primary py-3 min-h-[48px]">
            Voltar ao cardápio
          </Link>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="block w-full text-sm text-brand-text hover:underline py-2"
          >
            Pedir mais
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderOkPage() {
  return (
    <Suspense fallback={<div className="container-store py-8 text-center text-gray-500">Carregando...</div>}>
      <OrderOkContent />
    </Suspense>
  );
}
