'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSection, reorderSections, softDeleteSection } from '../actions';

export interface AdminSectionRow {
  id: string;
  name: string;
  position: number;
  active: boolean;
  productCount: number;
}

interface Props {
  sections: AdminSectionRow[];
}

export default function SectionsList({ sections: initial }: Props) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 2500);
  };

  // 11.4.1 — drag-and-drop
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setSections((prev) => {
      const fromIdx = prev.findIndex((s) => s.id === draggingId);
      const toIdx = prev.findIndex((s) => s.id === overId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next.map((s, i) => ({ ...s, position: i + 1 }));
    });
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    startTransition(async () => {
      try {
        await reorderSections(sections.map((s) => s.id));
        showFeedback('success', 'Ordem atualizada');
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro');
      }
    });
  };

  // 11.4.2 — mover com botões (acessível)
  const moveBy = async (id: string, delta: number) => {
    const idx = sections.findIndex((s) => s.id === id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    const updated = next.map((s, i) => ({ ...s, position: i + 1 }));
    setSections(updated);
    try {
      await reorderSections(updated.map((s) => s.id));
      showFeedback('success', 'Ordem atualizada');
      router.refresh();
    } catch (e: any) {
      showFeedback('error', e?.message || 'Erro');
    }
  };

  // 11.4.4 — edição inline
  const startEdit = (s: AdminSectionRow) => {
    setEditingId(s.id);
    setEditingName(s.name);
  };
  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    const fd = new FormData();
    fd.set('id', id);
    fd.set('name', editingName.trim());
    const current = sections.find((s) => s.id === id);
    if (current) {
      fd.set('position', String(current.position));
      fd.set('active', current.active ? 'on' : '');
    }
    startTransition(async () => {
      try {
        await updateSection(fd);
        setSections((prev) => prev.map((s) => s.id === id ? { ...s, name: editingName.trim() } : s));
        setEditingId(null);
        showFeedback('success', 'Nome atualizado');
        router.refresh();
      } catch (e: any) {
        showFeedback('error', e?.message || 'Erro');
      }
    });
  };

  // 11.4.5 — confirmação ao desativar seção com produtos
  const handleDelete = (s: AdminSectionRow) => {
    if (s.productCount > 0) {
      setConfirmDeleteId(s.id);
    } else {
      doDelete(s.id);
    }
  };
  const doDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      await softDeleteSection(id);
      showFeedback('success', 'Seção desativada');
      router.refresh();
    } catch (e: any) {
      showFeedback('error', e?.message || 'Erro');
    }
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

      <p className="text-xs text-gray-500 mb-3">
        💡 Arraste para reordenar ou use as setas ⬆⬇. Clique no nome para editar.
      </p>

      <ul className="space-y-2" role="list">
        {sections.map((s, idx) => (
          <li
            key={s.id}
            draggable
            onDragStart={() => handleDragStart(s.id)}
            onDragOver={(e) => handleDragOver(e, s.id)}
            onDragEnd={handleDragEnd}
            className={`bg-white border rounded-xl p-3 flex flex-wrap items-center gap-2 ${
              draggingId === s.id ? 'opacity-50 border-brand' : 'border-gray-200'
            }`}
          >
            <span
              aria-hidden="true"
              className="text-gray-400 cursor-grab select-none"
              title="Arraste para reordenar"
            >
              ⋮⋮
            </span>
            <span className="text-xs text-gray-500 w-8">#{s.position}</span>
            {editingId === s.id ? (
              <div className="flex items-center gap-1 flex-1 min-w-[180px]">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(s.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                  autoFocus
                  aria-label="Editar nome"
                />
                <button
                  type="button"
                  onClick={() => saveEdit(s.id)}
                  className="text-xs text-brand-text hover:underline min-h-[32px]"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-500 hover:underline min-h-[32px]"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startEdit(s)}
                className="font-medium text-gray-900 flex-1 text-left hover:text-brand-text min-h-[32px]"
                title="Clique para editar"
              >
                {s.name}
              </button>
            )}
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {s.productCount} {s.productCount === 1 ? 'produto' : 'produtos'}
            </span>
            {!s.active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">Inativa</span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => moveBy(s.id, -1)}
                disabled={isPending || idx === 0}
                className="w-8 h-8 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"
                aria-label={`Mover ${s.name} para cima`}
              >
                ⬆
              </button>
              <button
                type="button"
                onClick={() => moveBy(s.id, 1)}
                disabled={isPending || idx === sections.length - 1}
                className="w-8 h-8 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"
                aria-label={`Mover ${s.name} para baixo`}
              >
                ⬇
              </button>
              <button
                type="button"
                onClick={() => handleDelete(s)}
                className="text-xs text-red-500 hover:text-red-700 px-2 min-h-[32px]"
                aria-label={`Desativar ${s.name}`}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {confirmDeleteId && (() => {
        const s = sections.find((x) => x.id === confirmDeleteId);
        if (!s) return null;
        return (
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-del-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteId(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl">
              <h2 id="confirm-del-title" className="text-lg font-bold text-brand-contrast mb-2">
                Desativar a seção {s.name}?
              </h2>
              <p className="text-sm text-gray-600 mb-1">
                Esta seção tem <strong>{s.productCount}</strong> produto(s) ativo(s).
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Os produtos <strong>não</strong> serão excluídos, mas deixarão de aparecer no cardápio público.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 min-h-[48px] rounded-lg border border-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => doDelete(s.id)}
                  className="flex-1 py-3 min-h-[48px] rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  Desativar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
