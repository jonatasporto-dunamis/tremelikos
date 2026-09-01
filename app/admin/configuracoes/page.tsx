import { supabaseAdmin } from '@/lib/supabase/server';
import { updateStore, updateBusinessHours } from '../actions';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default async function AdminConfiguracoesPage() {
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('slug', 'tremelikos-burguer')
    .single();

  if (!store) return <p>Loja não encontrada.</p>;

  const { data: hours } = await supabaseAdmin
    .from('business_hours')
    .select('*')
    .eq('store_id', store.id)
    .order('weekday');

  const hoursByDay = new Map((hours || []).map((h: any) => [h.weekday, h]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Configurações</h1>

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
        className="bg-white rounded-xl border border-gray-100 p-4 max-w-2xl"
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