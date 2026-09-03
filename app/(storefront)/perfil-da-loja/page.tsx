import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export const revalidate = 300;

const SCHEDULE: Array<{ day: string; hours: string | null }> = [
  { day: 'Segunda', hours: null },
  { day: 'Terça', hours: '18:30 — 23:00' },
  { day: 'Quarta', hours: '18:30 — 23:00' },
  { day: 'Quinta', hours: '18:30 — 23:00' },
  { day: 'Sexta', hours: '18:30 — 23:00' },
  { day: 'Sábado', hours: '18:30 — 23:00' },
  { day: 'Domingo', hours: null },
];

export default async function StoreProfilePage() {
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', 'tremelikos-burguer')
    .single();

  return (
    <div className="container-store py-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-contrast">Sobre o Tremeliko&apos;s</h1>
        <p className="text-sm text-gray-500">Hamburgueria artesanal na brasa, em Jequié/BA</p>
      </header>

      <div className="space-y-4">
        <section className="card p-4" aria-labelledby="endereco-h">
          <h2 id="endereco-h" className="font-bold text-brand-contrast mb-2">📍 Endereço</h2>
          <p className="text-sm text-gray-700">{store?.address || 'Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA'}</p>
        </section>

        <section className="card p-4" aria-labelledby="horarios-h">
          <h2 id="horarios-h" className="font-bold text-brand-contrast mb-2">🕐 Horários</h2>
          <ul className="text-sm space-y-1">
            {SCHEDULE.map((row) => (
              <li key={row.day} className="flex justify-between">
                <span className="text-gray-700">{row.day}</span>
                <span className={row.hours ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {row.hours || 'Fechado'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4" aria-labelledby="pagamento-h">
          <h2 id="pagamento-h" className="font-bold text-brand-contrast mb-2">💳 Pagamento</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Pix (aprovação imediata)</li>
            <li>• Cartão de crédito (confirmação na entrega)</li>
            <li>• Dinheiro (troco para o entregador)</li>
          </ul>
        </section>

        <section className="card p-4" aria-labelledby="politica-h">
          <h2 id="politica-h" className="font-bold text-brand-contrast mb-2">📜 Política</h2>
          <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4">
            <li>Pedido mínimo: <strong>R$ 15,00</strong></li>
            <li>Entrega ou retirada no balcão</li>
            <li>Tempo médio de preparo: 25 a 40 min após confirmação</li>
            <li>Trocas e cancelamentos só antes do preparo iniciar</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            Veja a <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
          </p>
        </section>

        <section className="card p-4" aria-labelledby="redes-h">
          <h2 id="redes-h" className="font-bold text-brand-contrast mb-2">🌐 Redes sociais</h2>
          <ul className="text-sm space-y-1">
            <li>
              <a
                href="https://wa.me/5573991542371"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-text hover:underline"
              >
                📱 WhatsApp (73) 99154-2371
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/tremelikos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-text hover:underline"
              >
                📷 @tremelikos no Instagram
              </a>
            </li>
          </ul>
        </section>

        <Link
          href="/"
          className="block text-center text-brand-text py-3 hover:underline"
        >
          ← Voltar ao cardápio
        </Link>
      </div>
    </div>
  );
}
