import { supabaseAdmin } from '@/lib/supabase/server';
import { createCoupon, toggleCouponActive } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminCuponsPage() {
  const { data: coupons } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-4">Cupons</h1>

      <details className="bg-white rounded-xl border border-app-border p-4 mb-4">
        <summary className="font-semibold text-ink cursor-pointer">+ Novo cupom</summary>
        <form action={createCoupon} className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Código</label>
            <input name="code" required className="w-full p-2 border border-app-border rounded-lg text-sm uppercase" placeholder="EX: BEMVINDO10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Tipo</label>
              <select name="type" required className="w-full p-2 border border-app-border rounded-lg text-sm">
                <option value="fixed_percent">% desconto</option>
                <option value="fixed_amount">R$ desconto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Valor</label>
              <input name="value" type="number" step="0.01" required className="w-full p-2 border border-app-border rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Pedido mínimo (R$)</label>
              <input name="minimum_order" type="number" step="0.01" defaultValue="0" className="w-full p-2 border border-app-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Início</label>
              <input name="starts_at" type="datetime-local" className="w-full p-2 border border-app-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Fim</label>
              <input name="ends_at" type="datetime-local" className="w-full p-2 border border-app-border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Máx. usos (vazio = ilimitado)</label>
            <input name="max_uses" type="number" className="w-full p-2 border border-app-border rounded-lg text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked className="accent-brand" /> Ativo
          </label>
          <button type="submit" className="btn-primary text-sm">Criar cupom</button>
        </form>
      </details>

      <div className="space-y-2">
        {coupons?.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-app-border p-3 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-ink font-mono">{c.code}</h3>
              <p className="text-xs text-ink-muted">
                {c.type === 'fixed_percent' ? `${c.value}% off` : `R$ ${c.value} off`}
                {c.minimum_order > 0 && ` · mín R$ ${c.minimum_order.toFixed(2)}`}
                {c.max_uses && ` · ${c.current_uses}/${c.max_uses} usos`}
              </p>
            </div>
            <Toggle
              on={c.active}
              onChange={(v) => toggleCouponActive(c.id, v)}
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