'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { bulkUpdateProducts, type BulkUpdatePayload } from '../../actions';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { formatMoney } from '@/lib/money';

interface ProductRow {
  id: string;
  name: string;
  base_price: number;
  available: boolean;
  active: boolean;
  featured: boolean;
  badge: string | null;
  slug: string;
  sku: string | null;
  sections: Array<{ id: string; name: string; slug: string }>;
}

interface SectionOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  products: ProductRow[];
  sections: SectionOption[];
}

type BulkAction = 'section' | 'price' | 'availability';

export default function BulkEditor({ products, sections }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable' | 'inactive'>('all');
  const [openAction, setOpenAction] = useState<BulkAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filter === 'available' && !p.available) return false;
      if (filter === 'unavailable' && (p.available || !p.active)) return false;
      if (filter === 'inactive' && p.active) return false;
      return true;
    });
  }, [products, search, filter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((p) => next.delete(p.id));
      } else {
        filtered.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const submit = (payload: Omit<BulkUpdatePayload, 'productIds'>) => {
    if (selected.size === 0) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await bulkUpdateProducts({ ...payload, productIds: Array.from(selected) });
        const summary = `${res.updated} produto(s) atualizado(s)${res.sectionsUpdated ? ` · ${res.sectionsUpdated} vínculo(s) de seção` : ''}${res.errors.length ? ` · ${res.errors.length} erro(s)` : ''}`;
        if (res.errors.length > 0 && res.updated === 0) {
          setFeedback({ type: 'error', text: `Falha: ${res.errors[0]}` });
        } else {
          setFeedback({ type: 'success', text: summary });
          setOpenAction(null);
          clearSelection();
          router.refresh();
        }
      } catch (e: any) {
        setFeedback({ type: 'error', text: e?.message || 'Erro inesperado' });
      }
    });
  };

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
          aria-label="Buscar produto"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos</option>
          <option value="available">Disponíveis</option>
          <option value="unavailable">Indisponíveis</option>
          <option value="inactive">Inativos</option>
        </select>
        <span className="text-xs text-gray-500">
          {filtered.length} de {products.length} produtos
        </span>
      </div>

      {/* Barra de ação flutuante */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Ações em massa"
          className="sticky top-0 z-20 bg-brand text-white rounded-xl shadow-lg p-3 mb-3 flex flex-wrap gap-2 items-center"
        >
          <span className="font-semibold text-sm">
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setOpenAction('section')}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium min-h-[40px]"
          >
            📂 Mover seção
          </button>
          <button
            type="button"
            onClick={() => setOpenAction('price')}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium min-h-[40px]"
          >
            💰 Reajustar preço
          </button>
          <button
            type="button"
            onClick={() => setOpenAction('availability')}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium min-h-[40px]"
          >
            🔌 Disponibilidade
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm min-h-[40px]"
            aria-label="Limpar seleção"
          >
            ✕
          </button>
        </div>
      )}

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mb-3 p-3 rounded-lg text-sm ${
            feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  ref={(el) => {
                    if (el) el.indeterminate = !allFilteredSelected && selected.size > 0 && filtered.some((p) => selected.has(p.id));
                  }}
                  aria-label="Selecionar todos os produtos filtrados"
                />
              </th>
              <th className="text-left p-3 font-medium text-gray-700">Produto</th>
              <th className="text-left p-3 font-medium text-gray-700">Seções</th>
              <th className="text-right p-3 font-medium text-gray-700">Preço</th>
              <th className="text-center p-3 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const isSelected = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-brand-soft' : ''}`}
                  onClick={() => toggleOne(p.id)}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Selecionar ${p.name}`}
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.badge && <div className="text-xs text-gray-500">{p.badge}</div>}
                    {p.sku && <div className="text-[10px] text-gray-400">SKU: {p.sku}</div>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {p.sections.length === 0 && <span className="text-xs text-gray-400">—</span>}
                      {p.sections.map((s) => (
                        <span
                          key={s.id}
                          className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold text-gray-900">
                    {formatMoney(p.base_price)}
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        !p.active
                          ? 'bg-gray-200 text-gray-600'
                          : p.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {!p.active ? 'Inativo' : p.available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openAction === 'section' && (
        <SectionDialog
          sections={sections}
          onClose={() => setOpenAction(null)}
          onApply={(ids, mode) =>
            submit({ setSectionIds: ids, sectionMode: mode })
          }
          isPending={isPending}
        />
      )}
      {openAction === 'price' && (
        <PriceDialog
          onClose={() => setOpenAction(null)}
          onApply={(payload) => submit(payload)}
          isPending={isPending}
        />
      )}
      {openAction === 'availability' && (
        <AvailabilityDialog
          onClose={() => setOpenAction(null)}
          onApply={(setAvailable) => submit({ setAvailable })}
          isPending={isPending}
        />
      )}
    </div>
  );
}

function SectionDialog({
  sections,
  onClose,
  onApply,
  isPending,
}: {
  sections: SectionOption[];
  onClose: () => void;
  onApply: (ids: string[], mode: 'replace' | 'add' | 'remove') => void;
  isPending: boolean;
}) {
  const [mode, setMode] = useState<'replace' | 'add' | 'remove'>('replace');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const ref = useFocusTrap({ active: true, onClose, initialFocus: 'title' });

  const toggle = (id: string) => {
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-section-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-gray-100">
          <h2 id="bulk-section-title" data-modal-title className="text-lg font-bold text-gray-900">
            📂 Mover para seção
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Modo</legend>
            <div className="space-y-1">
              {[
                { v: 'replace', label: 'Substituir (apaga as seções atuais)' },
                { v: 'add', label: 'Adicionar (mantém as atuais)' },
                { v: 'remove', label: 'Remover (tira das seções escolhidas)' },
              ].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 cursor-pointer min-h-[36px]">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === opt.v}
                    onChange={() => setMode(opt.v as any)}
                    className="accent-brand"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Seções</legend>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {sections.length === 0 && <p className="text-sm text-gray-500">Nenhuma seção ativa.</p>}
              {sections.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer p-1 min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={picked.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="accent-brand w-4 h-4"
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={picked.size === 0 || isPending}
            onClick={() => onApply(Array.from(picked), mode)}
            className="flex-1 btn-primary py-3 min-h-[48px] disabled:opacity-50"
          >
            {isPending ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceDialog({
  onClose,
  onApply,
  isPending,
}: {
  onClose: () => void;
  onApply: (payload: { setPrice: number | null; priceAdjustPercent: number | null; priceAdjustFixed: number | null; roundPrice: boolean }) => void;
  isPending: boolean;
}) {
  const [mode, setMode] = useState<'set' | 'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [round, setRound] = useState(true);
  const ref = useFocusTrap({ active: true, onClose, initialFocus: 'title' });

  const apply = () => {
    const v = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(v)) return;
    onApply({
      setPrice: mode === 'set' ? v : null,
      priceAdjustPercent: mode === 'percent' ? v : null,
      priceAdjustFixed: mode === 'fixed' ? v : null,
      roundPrice: round,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-price-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-gray-100">
          <h2 id="bulk-price-title" data-modal-title className="text-lg font-bold text-gray-900">
            💰 Reajustar preço
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Tipo de ajuste</legend>
            <div className="space-y-1">
              {[
                { v: 'percent', label: 'Percentual (%)', placeholder: 'Ex.: 10 para +10%, -5 para -5%' },
                { v: 'fixed', label: 'Valor fixo (R$)', placeholder: 'Ex.: 1.50 (soma) ou -1.50 (desconta)' },
                { v: 'set', label: 'Definir preço exato (R$)', placeholder: 'Ex.: 19.90' },
              ].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 cursor-pointer min-h-[36px]">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === opt.v}
                    onChange={() => setMode(opt.v as any)}
                    className="accent-brand"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="price-value" className="block text-sm font-medium text-gray-700 mb-1">
              Valor
            </label>
            <input
              id="price-value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                mode === 'percent' ? '10' : mode === 'fixed' ? '1.50' : '19.90'
              }
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm min-h-[48px]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={round}
              onChange={(e) => setRound(e.target.checked)}
              className="accent-brand w-4 h-4"
            />
            <span className="text-sm">Arredondar para preço &ldquo;bonito&rdquo; (R$ X,00 / R$ X,50 / R$ X,90)</span>
          </label>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            ⚠️ As alterações são registradas na auditoria e o cardápio público será atualizado.
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!value || isPending}
            onClick={apply}
            className="flex-1 btn-primary py-3 min-h-[48px] disabled:opacity-50"
          >
            {isPending ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailabilityDialog({
  onClose,
  onApply,
  isPending,
}: {
  onClose: () => void;
  onApply: (setAvailable: boolean) => void;
  isPending: boolean;
}) {
  const ref = useFocusTrap({ active: true, onClose, initialFocus: 'title' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-avail-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-4 border-b border-gray-100">
          <h2 id="bulk-avail-title" data-modal-title className="text-lg font-bold text-gray-900">
            🔌 Disponibilidade
          </h2>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-gray-600">O que deseja fazer com os produtos selecionados?</p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onApply(true)}
            className="w-full p-3 min-h-[48px] bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-800 font-semibold text-left"
          >
            ✅ Marcar como disponível
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onApply(false)}
            className="w-full p-3 min-h-[48px] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-800 font-semibold text-left"
          >
            🚫 Marcar como indisponível (esgotado)
          </button>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
