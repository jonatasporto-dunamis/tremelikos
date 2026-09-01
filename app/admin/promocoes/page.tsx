import { supabaseAdmin } from '@/lib/supabase/server';
import { createPromotion, togglePromotionActive } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminPromocoesPage() {
  const [{ data: promos }, { data: products }] = await Promise.all([
    supabaseAdmin.from('promotions').select('*').order('priority', { ascending: false }),
    supabaseAdmin.from('products').select('id, name').eq('active', true).order('name'),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Promoções</h1>

      <details className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <summary className="font-semibold text-gray-900 cursor-pointer">+ Nova promoção</summary>
        <form action={createPromotion} className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input name="name" required className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select name="type" required className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                <option value="fixed_percent">% desconto</option>
                <option value="fixed_amount">R$ desconto</option>
                <option value="product_price">Preço fixo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input name="value" type="number" step="0.01" required className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
              <input name="starts_at" type="datetime-local" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <input name="ends_at" type="datetime-local" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <input name="priority" type="number" defaultValue={0} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dias da semana (0=dom, vírgula)</label>
            <input name="weekdays" placeholder="Ex: 5,6 ou vazio para todos" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produtos (Ctrl+clique para múltiplos)</label>
            <select name="product_ids" multiple required className="w-full p-2 border border-gray-200 rounded-lg text-sm h-32">
              {products?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked className="accent-brand" /> Ativa
          </label>
          <button type="submit" className="btn-primary text-sm">Criar promoção</button>
        </form>
      </details>

      <div className="space-y-2">
        {promos?.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{p.name}</h3>
              <p className="text-xs text-gray-500">
                {p.type === 'fixed_percent' && `${p.value}% off`}
                {p.type === 'fixed_amount' && `R$ ${p.value} off`}
                {p.type === 'product_price' && `Preço fixo R$ ${p.value}`}
                · prioridade {p.priority}
              </p>
            </div>
            <Toggle
              on={p.active}
              onChange={(v) => togglePromotionActive(p.id, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => Promise<void> }) {
  return (
    <form action={async () => { 'use server'; await onChange(!on); }}>
      <button
        type="submit"
        className={`w-12 h-6 rounded-full transition-colors ${on ? 'bg-green-500' : 'bg-gray-300'}`}
        aria-pressed={on}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </form>
  );
}