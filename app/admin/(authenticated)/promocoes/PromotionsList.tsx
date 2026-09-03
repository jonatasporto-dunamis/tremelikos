'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPromotion, togglePromotionActive } from '../actions';
import { formatMoney } from '@/lib/money';

export interface PromotionRow {
  id: string;
  name: string;
  type: 'fixed_percent' | 'fixed_amount' | 'product_price';
  value: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  weekdays: number[] | null;
  priority: number;
}

interface ProductOption {
  id: string;
  name: string;
  base_price: number;
}

interface Props {
  promotions: PromotionRow[];
  products: ProductOption[];
}

type BadgeState = 'rascunho' | 'agendada' | 'ativa' | 'expirando' | 'expirada' | 'pausada';

function getBadge(p: PromotionRow): { state: BadgeState; label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'default' } {
  if (!p.active) return { state: 'pausada', label: 'Pausada', tone: 'default' };
  const now = Date.now();
  if (p.ends_at && new Date(p.ends_at).getTime() < now) {
    return { state: 'expirada', label: 'Expirada', tone: 'danger' };
  }
  if (p.starts_at && new Date(p.starts_at).getTime() > now) {
    return { state: 'agendada', label: 'Agendada', tone: 'info' };
  }
  if (p.ends_at) {
    const diff = new Date(p.ends_at).getTime() - now;
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return { state: 'expirando', label: 'Expirando', tone: 'warning' };
    }
  }
  return { state: 'ativa', label: 'Ativa', tone: 'success' };
}

function describeType(p: PromotionRow) {
  if (p.type === 'fixed_percent') return `${p.value}% off`;
  if (p.type === 'fixed_amount') return `R$ ${p.value.toFixed(2)} off`;
  return `Preço fixo R$ ${p.value.toFixed(2)}`;
}

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function PromotionsList({ promotions, products }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: '',
    type: 'fixed_percent' as 'fixed_percent' | 'fixed_amount' | 'product_price',
    value: '',
    starts_at: '',
    ends_at: '',
    priority: '0',
    weekdays: '',
    product_ids: [] as string[],
  });

  // 11.5.2 — estimativa de preço
  const previewProducts = products.filter((p) => form.product_ids.includes(p.id));
  const estimatedTotal = previewProducts.reduce((sum, p) => {
    let final = p.base_price;
    if (form.type === 'fixed_percent') final = p.base_price * (1 - Number(form.value || 0) / 100);
    else if (form.type === 'fixed_amount') final = Math.max(0, p.base_price - Number(form.value || 0));
    else if (form.type === 'product_price') final = Number(form.value || 0);
    return sum + Math.max(0, final);
  }, 0);

  // 11.5.1 — validação
  const validate = (): string | null => {
    if (!form.name.trim()) return 'Nome é obrigatório';
    const v = Number(form.value);
    if (!form.value || Number.isNaN(v)) return 'Valor é obrigatório';
    if (v < 0) return 'Valor não pode ser negativo';
    if (form.type === 'fixed_percent' && v > 100) return 'Percentual máximo é 100%';
    if (form.type === 'product_price' && previewProducts.some((p) => v >= p.base_price)) {
      return 'Preço fixo precisa ser menor que o preço base de pelo menos um produto selecionado';
    }
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      return 'Fim precisa ser depois do início';
    }
    if (form.product_ids.length === 0) return 'Selecione pelo menos 1 produto';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    const fd = new FormData();
    fd.set('name', form.name);
    fd.set('type', form.type);
    fd.set('value', form.value);
    if (form.starts_at) fd.set('starts_at', form.starts_at);
    if (form.ends_at) fd.set('ends_at', form.ends_at);
    fd.set('priority', form.priority);
    if (form.weekdays) fd.set('weekdays', form.weekdays);
    for (const id of form.product_ids) fd.append('product_ids', id);
    fd.set('active', 'on');
    startTransition(async () => {
      try {
        await createPromotion(fd);
        setOpen(false);
        setForm({ name: '', type: 'fixed_percent', value: '', starts_at: '', ends_at: '', priority: '0', weekdays: '', product_ids: [] });
        router.refresh();
      } catch (err: any) {
        setError(err?.message || 'Erro');
      }
    });
  };

  const toggleProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(id)
        ? prev.product_ids.filter((x) => x !== id)
        : [...prev.product_ids, id],
    }));
  };

  const handleToggle = (p: PromotionRow) => {
    startTransition(async () => {
      try {
        await togglePromotionActive(p.id, !p.active);
        router.refresh();
      } catch (e: any) {
        setError(e?.message || 'Erro');
      }
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-primary text-sm"
        >
          {open ? 'Cancelar' : '+ Nova promoção'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Nova promoção</h2>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Field label="Nome" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo" required>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                <option value="fixed_percent">% desconto</option>
                <option value="fixed_amount">R$ desconto</option>
                <option value="product_price">Preço fixo</option>
              </select>
            </Field>
            <Field label="Valor" required>
              <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Início">
              <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </Field>
            <Field label="Fim">
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </Field>
            <Field label="Prioridade">
              <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
            </Field>
          </div>
          <Field label="Dias da semana (0=dom, vírgula)">
            <input placeholder="Ex: 5,6 ou vazio para todos" value={form.weekdays} onChange={(e) => setForm({ ...form, weekdays: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </Field>
          <Field label="Produtos">
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.product_ids.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="accent-brand"
                  />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-gray-500">{formatMoney(p.base_price)}</span>
                </label>
              ))}
            </div>
          </Field>

          {previewProducts.length > 0 && Number(form.value) > 0 && (
            <div className="bg-brand-soft border border-brand rounded-lg p-3 text-sm">
              <p className="font-semibold text-brand-text mb-1">💡 Estimativa de preço final</p>
              <ul className="space-y-0.5 text-brand-contrast">
                {previewProducts.map((p) => {
                  let final = p.base_price;
                  if (form.type === 'fixed_percent') final = p.base_price * (1 - Number(form.value) / 100);
                  else if (form.type === 'fixed_amount') final = Math.max(0, p.base_price - Number(form.value));
                  else if (form.type === 'product_price') final = Number(form.value);
                  return (
                    <li key={p.id} className="flex justify-between">
                      <span className="truncate mr-2">{p.name}</span>
                      <span className="font-mono whitespace-nowrap">{formatMoney(p.base_price)} → <strong className="text-brand">{formatMoney(final)}</strong></span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-brand-text mt-2">
                Total estimado: <strong>{formatMoney(estimatedTotal)}</strong>
              </p>
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn-primary text-sm disabled:opacity-50">
            {isPending ? 'Criando...' : 'Criar promoção'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {promotions.length === 0 && (
          <p className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
            Nenhuma promoção cadastrada.
          </p>
        )}
        {promotions.map((p) => {
          const badge = getBadge(p);
          const toneClass =
            badge.tone === 'success' ? 'bg-green-100 text-green-800' :
            badge.tone === 'warning' ? 'bg-amber-100 text-amber-800' :
            badge.tone === 'danger' ? 'bg-red-100 text-red-700' :
            badge.tone === 'info' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-200 text-gray-700';
          return (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-gray-900">{p.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold tracking-wide ${toneClass}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {describeType(p)} · prioridade {p.priority}
                  {p.starts_at && ` · ${formatDate(p.starts_at)} → ${formatDate(p.ends_at)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(p)}
                disabled={isPending}
                className={`w-10 h-5 rounded-full transition-colors ${p.active ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
                aria-pressed={p.active}
                aria-label={p.active ? `Pausar ${p.name}` : `Reativar ${p.name}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${p.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}
