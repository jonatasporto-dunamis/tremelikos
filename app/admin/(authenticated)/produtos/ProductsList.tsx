'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  toggleProductAvailable,
  toggleProductFeatured,
  updateProduct,
  bulkUpdateProducts,
} from '../actions';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';

export interface AdminProductRow {
  id: string;
  name: string;
  base_price: number;
  available: boolean;
  active: boolean;
  featured: boolean;
  badge: string | null;
  slug: string;
  sections: Array<{ id: string; name: string }>;
  hasImage: boolean;
  updated_at?: string;
}

interface Props {
  products: AdminProductRow[];
  sections: Array<{ id: string; name: string }>;
}

export default function ProductsList({ products, sections }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable' | 'featured' | 'inactive'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 11.3.2 — debounce 300ms
  useMemo(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filter === 'available' && !p.available) return false;
      if (filter === 'unavailable' && (p.available || !p.active)) return false;
      if (filter === 'featured' && !p.featured) return false;
      if (filter === 'inactive' && p.active) return false;
      if (sectionFilter !== 'all' && !p.sections.some((s) => s.id === sectionFilter)) return false;
      return true;
    });
  }, [products, debouncedSearch, filter, sectionFilter]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleToggleAvailable = (id: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleProductAvailable(id, !current);
        showFeedback('success', current ? 'Produto pausado' : 'Produto reativado');
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro');
      }
    });
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleProductFeatured(id, !current);
        showFeedback('success', current ? 'Destaque removido' : 'Marcado como destaque');
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro');
      }
    });
  };

  const handleDuplicate = (p: AdminProductRow) => {
    // 11.3.5 — ação inline de duplicar
    const fd = new FormData();
    fd.set('name', `${p.name} (cópia)`);
    fd.set('base_price', String(p.base_price));
    fd.set('description', p.badge || '');
    startTransition(async () => {
      try {
        // usa endpoint existente: pega slug pra buscar o novo depois
        // Como não temos createProduct aqui, vamos usar a action createProduct
        const { createProduct } = await import('../actions');
        await createProduct(fd);
        showFeedback('success', 'Produto duplicado — ajuste o nome antes de publicar');
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro ao duplicar');
      }
    });
  };

  const handleStartEditPrice = (p: AdminProductRow) => {
    setEditingPrice(p.id);
    setPriceValue(p.base_price.toFixed(2));
  };

  const handleSavePrice = async (p: AdminProductRow) => {
    const v = parseFloat(priceValue.replace(',', '.'));
    if (Number.isNaN(v) || v < 0) {
      showFeedback('error', 'Preço inválido');
      return;
    }
    const fd = new FormData();
    fd.set('id', p.id);
    fd.set('slug', p.slug);
    fd.set('name', p.name);
    fd.set('base_price', String(v));
    fd.set('description', ''); // mantém
    startTransition(async () => {
      try {
        await updateProduct(fd);
        showFeedback('success', 'Preço atualizado');
        setEditingPrice(null);
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro');
      }
    });
  };

  const handleBulkPause = () => {
    if (!confirm('Pausar todos os produtos filtrados?')) return;
    const ids = filtered.filter((p) => p.available).map((p) => p.id);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkUpdateProducts({ productIds: ids, setAvailable: false });
        showFeedback('success', `${ids.length} produto(s) pausado(s)`);
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro');
      }
    });
  };

  const handleBulkReactivate = () => {
    if (!confirm('Reativar todos os produtos filtrados?')) return;
    const ids = filtered.filter((p) => !p.available).map((p) => p.id);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkUpdateProducts({ productIds: ids, setAvailable: true });
        showFeedback('success', `${ids.length} produto(s) reativado(s)`);
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro');
      }
    });
  };

  return (
    <div>
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-3 p-2 rounded-lg text-sm ${
            feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 11.3.1 — Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex flex-wrap gap-2 items-center">
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
          <option value="all">Todos os status</option>
          <option value="available">Disponíveis</option>
          <option value="unavailable">Indisponíveis</option>
          <option value="featured">Destaques</option>
          <option value="inactive">Inativos</option>
        </select>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          aria-label="Filtrar por seção"
        >
          <option value="all">Todas as seções</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {filtered.length} de {products.length}
        </span>
      </div>

      {/* 11.3.5 — Ações inline em massa */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={handleBulkPause}
          disabled={isPending}
          className="text-xs px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50"
        >
          ⏸ Pausar filtrados
        </button>
        <button
          type="button"
          onClick={handleBulkReactivate}
          disabled={isPending}
          className="text-xs px-3 py-2 bg-green-50 text-green-800 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
        >
          ▶ Reativar filtrados
        </button>
        <Link
          href="/admin/produtos/edicao-em-massa"
          className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          📦 Edição em massa completa
        </Link>
      </div>

      {/* 11.3.3 — Tabela desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700">Produto</th>
              <th className="text-left p-3 font-medium text-gray-700">Seções</th>
              <th className="text-right p-3 font-medium text-gray-700">Preço</th>
              <th className="text-center p-3 font-medium text-gray-700">Disp.</th>
              <th className="text-center p-3 font-medium text-gray-700">Destaque</th>
              <th className="text-right p-3 font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">Nenhum produto encontrado.</td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${p.hasImage ? 'bg-green-500' : 'bg-amber-500'}`}
                      title={p.hasImage ? 'Com imagem' : 'Sem imagem'}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.badge && <p className="text-xs text-gray-500">{p.badge}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {p.sections.length === 0 && <span className="text-xs text-gray-400">—</span>}
                    {p.sections.map((s) => (
                      <span key={s.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right">
                  {editingPrice === p.id ? (
                    <div className="flex gap-1 justify-end">
                      <input
                        type="number"
                        step="0.01"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePrice(p);
                          if (e.key === 'Escape') setEditingPrice(null);
                        }}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-right"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePrice(p)}
                        className="text-xs text-brand-text hover:underline"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPrice(null)}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditPrice(p)}
                      className="font-semibold text-gray-900 hover:text-brand-text"
                      title="Clique para editar"
                    >
                      {formatMoney(p.base_price)}
                    </button>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleAvailable(p.id, p.available)}
                    disabled={isPending}
                    className={`w-10 h-5 rounded-full transition-colors ${p.available ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
                    aria-pressed={p.available}
                    aria-label={p.available ? `Pausar ${p.name}` : `Reativar ${p.name}`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${p.available ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(p.id, p.featured)}
                    disabled={isPending}
                    className={`w-10 h-5 rounded-full transition-colors ${p.featured ? 'bg-yellow-500' : 'bg-gray-300'} disabled:opacity-50`}
                    aria-pressed={p.featured}
                    aria-label={p.featured ? `Remover destaque de ${p.name}` : `Marcar ${p.name} como destaque`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${p.featured ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                </td>
                <td className="p-3 text-right space-x-1">
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
                  >
                    ✏️
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(p)}
                    disabled={isPending}
                    className="text-xs px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-50"
                    title="Duplicar"
                  >
                    📋
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 11.3.4 — Cards compactos no mobile */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            Nenhum produto encontrado.
          </div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {p.sections.map((s) => s.name).join(', ') || 'Sem seção'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                  {p.available ? 'Disponível' : 'Indisponível'}
                </span>
                {p.featured && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">★ Destaque</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-gray-900">{formatMoney(p.base_price)}</span>
              <div className="flex gap-1">
                <Link
                  href={`/admin/produtos/${p.id}`}
                  className="text-xs px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 min-h-[36px]"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => handleToggleAvailable(p.id, p.available)}
                  className={`text-xs px-3 py-2 rounded min-h-[36px] ${p.available ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}
                >
                  {p.available ? 'Pausar' : 'Reativar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
