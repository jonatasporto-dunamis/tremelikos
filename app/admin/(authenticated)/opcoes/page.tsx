import { supabaseAdmin } from '@/lib/supabase/server';
import { createOptionGroup, createOption } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminOpcoesPage() {
  const { data: groups } = await supabaseAdmin
    .from('option_groups')
    .select('*, options(*)')
    .order('name');

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-4">Grupos de Opções</h1>

      <details className="bg-white rounded-xl border border-app-border p-4 mb-4">
        <summary className="font-semibold text-ink cursor-pointer">+ Novo grupo</summary>
        <form action={createOptionGroup} className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nome</label>
            <input name="name" required className="w-full p-2 border border-app-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Mínimo</label>
              <input name="min_choices" type="number" defaultValue={0} className="w-full p-2 border border-app-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Máximo</label>
              <input name="max_choices" type="number" defaultValue={1} className="w-full p-2 border border-app-border rounded-lg text-sm" />
            </div>
            <label className="flex items-end gap-2 text-sm pb-2">
              <input type="checkbox" name="required" className="accent-brand" />
              Obrigatório
            </label>
          </div>
          <button type="submit" className="btn-primary text-sm">Criar grupo</button>
        </form>
      </details>

      <div className="space-y-4">
        {groups?.map((g: any) => (
          <div key={g.id} className="bg-white rounded-xl border border-app-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-ink">{g.name}</h3>
              <span className="text-xs text-ink-muted">
                {g.required ? 'Obrigatório' : 'Opcional'} · {g.min_choices}-{g.max_choices} escolhas
              </span>
            </div>
            <ul className="space-y-1 mb-3">
              {g.options?.map((o: any) => (
                <li key={o.id} className="text-sm flex items-center justify-between">
                  <span>{o.name}</span>
                  <span className="text-ink-muted">
                    {o.price_delta > 0 ? `+R$ ${o.price_delta.toFixed(2)}` : 'sem custo'}
                  </span>
                </li>
              ))}
              {(!g.options || g.options.length === 0) && (
                <li className="text-sm text-ink-muted">Nenhuma opção cadastrada.</li>
              )}
            </ul>
            <details>
              <summary className="text-sm text-brand-text cursor-pointer">+ Adicionar opção</summary>
              <form action={createOption} className="mt-2 grid grid-cols-4 gap-2">
                <input type="hidden" name="option_group_id" value={g.id} />
                <input name="name" required placeholder="Nome" className="p-2 border border-app-border rounded text-sm" />
                <input name="price_delta" type="number" step="0.01" defaultValue="0" placeholder="Preço" className="p-2 border border-app-border rounded text-sm" />
                <input name="position" type="number" defaultValue="0" placeholder="Posição" className="p-2 border border-app-border rounded text-sm" />
                <button type="submit" className="btn-primary text-sm">Adicionar</button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}