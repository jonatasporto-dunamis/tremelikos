'use client';

import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/features/cart/StoreContext';
import { formatMoney } from '@/lib/money';
import { formatWhatsAppMessage, generateShortCartId } from '@/features/whatsapp/formatOrder';
import Link from 'next/link';
import { useState } from 'react';

export default function CartPage() {
  const { state, dispatch, subtotal, itemCount } = useCart();
  const { store } = useStore();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minimumOrder = store?.minimum_order || 15.0;
  const remainingForMinimum = minimumOrder - subtotal;
  const isBelowMinimum = subtotal < minimumOrder && itemCount > 0;

  const handleSendWhatsApp = async () => {
    setSending(true);
    setError(null);

    try {
      const cartId = generateShortCartId();
      const message = formatWhatsAppMessage({
        cartId,
        store: store!,
        items: state.items,
        subtotal,
        minimumOrder,
      });

      const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message,
          cartId,
          storeId: store?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      } else {
        setError(result.error || 'Erro ao enviar mensagem');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenWhatsAppWeb = () => {
    const cartId = generateShortCartId();
    const message = formatWhatsAppMessage({
      cartId,
      store: store!,
      items: state.items,
      subtotal,
      minimumOrder,
    });

    const phone = store?.whatsapp?.replace(/\D/g, '') || '5573991542371';
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  if (state.items.length === 0) {
    return (
      <div className="container-store py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-brand-contrast mb-2">
            Seu carrinho está vazio
          </h2>
          <p className="text-gray-600 mb-6">
            Adicione itens do cardápio para continuar
          </p>
          <Link href="/" className="btn-primary inline-block">
            Ver cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store py-4">
      <h1 className="text-xl font-bold text-brand-contrast mb-4">
        Seu Pedido ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
      </h1>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {state.items.map((item) => (
          <div key={item.id} className="card p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-brand-contrast">
                  {item.product.name}
                </h3>
                <p className="text-brand font-bold">
                  {formatMoney(item.product.base_price * item.quantity)}
                </p>
                {item.extras && item.extras.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    + {item.extras.map((e) => e.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_QUANTITY',
                      payload: {
                        id: item.id,
                        quantity: Math.max(0, item.quantity - 1),
                      },
                    })
                  }
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_QUANTITY',
                      payload: { id: item.id, quantity: item.quantity + 1 },
                    })
                  }
                  className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover"
                >
                  +
                </button>
              </div>
            </div>
            {item.quantity > 0 && (
              <button
                onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-lg font-bold text-brand-contrast">
            {formatMoney(subtotal)}
          </span>
        </div>
        {isBelowMinimum && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
            <p className="text-sm text-yellow-800">
              ⚠️ Pedido mínimo: {formatMoney(minimumOrder)}. Falta{' '}
              <strong>{formatMoney(remainingForMinimum)}</strong>
            </p>
          </div>
        )}
        <p className="text-xs text-gray-500">
          * Taxa de entrega e forma de pagamento serão informadas no WhatsApp
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleSendWhatsApp}
          disabled={sending || isBelowMinimum}
          className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {sending ? (
            'Enviando...'
          ) : sent ? (
            '✅ Pedido enviado!'
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar pedido via WhatsApp
            </>
          )}
        </button>

        <button
          onClick={handleOpenWhatsAppWeb}
          disabled={isBelowMinimum}
          className="w-full btn-secondary py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Abrir WhatsApp Web (alternativo)
        </button>

        <Link
          href="/"
          className="w-full py-3 text-center text-brand-text block hover:underline"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
