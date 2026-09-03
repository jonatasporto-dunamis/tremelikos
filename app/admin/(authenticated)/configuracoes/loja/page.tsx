import { supabaseAdmin } from '@/lib/supabase/server';
import { updateStore, updateBusinessHours, createStoreOverride, deleteStoreOverride } from '../../actions';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default async function AdminConfiguracoesPage() {
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('slug', 'tremelikos-burguer')
    .single();

  if (!store) return <p>Loja não encontrada.</p>;

  const [{ data: hours }, { data: overrides }] = await Promise.all([
    supabaseAdmin
      .from('business_hours')
      .select('*')
      .eq('store_id', store.id)
      .order('weekday'),
    supabaseAdmin
      .from('store_overrides')
      .select('*')
      .eq('store_id', store.id)
      .order('date', { ascending: true }),
  ]);

  const hoursByDay = new Map((hours || []).map((h: any) => [h.weekday, h]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Loja</h1>

      <form action={updateStore} className="bg-white rounded-xl border border-gray-100 p-4 mb-6 max-w-2xl space-y-3">
        <input type="hidden" name="id" value={store.id} />
        <h2 className="font-semibold text-gray-900">Dados da loja</h2>
        <Field label="Nome" name="name" defaultValue={store.name} required />
        <Field label="Descrição" name="description" defaultValue={store.description || ''} />
        <Field label="Telefone" name="phone" defaultValue={store.phone || ''} />
        <Field label="WhatsApp" name="whatsapp" defaultValue={store.whatsapp || ''} />
        <Field label="Endereço" name="address" defaultValue={store.address || ''} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Cidade" name="city" defaultValue={store.city} />
          <Field label="UF" name="state" defaultValue={store.state} />
          <Field label="CEP" name="zip_code" defaultValue={store.zip_code || ''} />
        </div>
        <Field
          label="Pedido mínimo (R$)"
          name="minimum_order"
          type="number"
          step="0.01"
          defaultValue={String(store.minimum_order)}
        />
        <button type="submit" className="btn-primary text-sm">Salvar dados</button>
      </form>

      <form
        action={async (fd) => {
          'use server';
          const entries = DAY_NAMES.map((_, i) => ({
            weekday: i,
            opens_at: fd.get(`opens_${i}`) ? String(fd.get(`opens_${i}`)) : null,
            closes_at: fd.get(`closes_${i}`) ? String(fd.get(`closes_${i}`)) : null,
            closed: fd.get(`closed_${i}`) === 'on',
          }));
          await updateBusinessHours(entries);
        }}
        className="bg-white rounded-xl border border-gray-100 p-4 mb-6 max-w-2xl"
      >
        <h2 className="font-semibold text-gray-900 mb-3">Horários de funcionamento</h2>
        <div className="space-y-2">
          {DAY_NAMES.map((day, i) => {
            const h: any = hoursByDay.get(i);
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm">
                <span className="col-span-3 text-gray-700">{day}</span>
                <label className="col-span-2 flex items-center gap-1">
                  <input
                    type="checkbox"
                    name={`closed_${i}`}
                    defaultChecked={h?.closed}
                    className="accent-brand"
                  />
                  Fechado
                </label>
                <input
                  type="time"
                  name={`opens_${i}`}
                  defaultValue={h?.opens_at?.slice(0, 5) || '18:30'}
                  className="col-span-3 p-1 border border-gray-200 rounded"
                />
                <input
                  type="time"
                  name={`closes_${i}`}
                  defaultValue={h?.closes_at?.slice(0, 5) || '23:00'}
                  className="col-span-3 p-1 border border-gray-200 rounded"
                />
              </div>
            );
          })}
        </div>
        <button type="submit" className="btn-primary text-sm mt-3">Salvar horários</button>
      </form>

      {/* 11.6.2 — Exceções e feriados */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 max-w-2xl">
        <h2 className="font-semibold text-gray-900 mb-1">Exceções e feriados</h2>
        <p className="text-xs text-gray-500 mb-3">
          Forçar abertura/fechamento em datas específicas (feriados, eventos).
        </p>
        <form action={createStoreOverride} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3 text-sm">
          <input type="date" name="date" min={today} required className="p-2 border border-gray-200 rounded" />
          <select name="status" className="p-2 border border-gray-200 rounded bg-white">
            <option value="closed">Fechado</option>
            <option value="open">Aberto</option>
          </select>
          <input type="time" name="opens_at" placeholder="Abre" className="p-2 border border-gray-200 rounded" />
          <input type="time" name="closes_at" placeholder="Fecha" className="p-2 border border-gray-200 rounded" />
          <input type="text" name="reason" placeholder="Motivo (opcional)" className="p-2 border border-gray-200 rounded sm:col-span-1" />
          <button type="submit" className="btn-primary text-sm sm:col-span-5">+ Adicionar exceção</button>
        </form>
        {(overrides || []).length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma exceção cadastrada.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(overrides || []).map((o: any) => (
              <li key={o.id} className="py-2 flex items-center gap-2 text-sm flex-wrap">
                <span className="font-mono text-xs">{o.date}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${o.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                  {o.status === 'open' ? 'Aberto' : 'Fechado'}
                </span>
                {o.opens_at && <span className="text-xs text-gray-600">{o.opens_at.slice(0, 5)} – {o.closes_at?.slice(0, 5)}</span>}
                {o.reason && <span className="text-xs text-gray-500 italic">{o.reason}</span>}
                <form action={async () => { 'use server'; await deleteStoreOverride(o.id); }} className="ml-auto">
                  <button type="submit" className="text-xs text-red-500 hover:text-red-700" aria-label="Remover exceção">
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, name, defaultValue, type = 'text', required, step }: {
  label: string; name: string; defaultValue?: string; type?: string; required?: boolean; step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
      />
    </div>
  );
}