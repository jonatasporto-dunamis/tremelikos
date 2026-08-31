import { supabaseAdmin } from '@/lib/supabase/server';
import { Promotion } from '@/types/database';

export const revalidate = 0;

async function getPromotions(): Promise<Promotion[]> {
  const { data } = await supabaseAdmin
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

function formatPromotionType(type: string): string {
  switch (type) {
    case 'fixed_percent':
      return 'Desconto %';
    case 'fixed_amount':
      return 'Desconto R$';
    case 'product_price':
      return 'Preço fixo';
    default:
      return type;
  }
}

function formatWeekdays(weekdays: number[]): string {
  if (weekdays.length === 0) return 'Todos os dias';
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return weekdays.map((d) => names[d]).join(', ');
}

export default async function AdminPromotionsPage() {
  const promotions = await getPromotions();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Promoções</h1>
            <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              ← Voltar ao painel
            </a>
          </div>
          <button className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover">
            + Nova Promoção
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {promotions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <span className="text-4xl">🏷️</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Nenhuma promoção criada
            </h3>
            <p className="text-gray-500 mt-2">
              Crie promoções para atrair mais clientes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{promo.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatPromotionType(promo.type)} • Valor: {' '}
                    {promo.type === 'fixed_percent'
                      ? `${promo.value}%`
                      : `R$ ${promo.value.toFixed(2).replace('.', ',')}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatWeekdays(promo.weekdays)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {promo.active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Ativa
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Inativa
                    </span>
                  )}
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
