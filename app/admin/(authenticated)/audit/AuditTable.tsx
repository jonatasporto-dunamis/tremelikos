'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity: string;
  entity_id: string | null;
  actor_id: string | null;
  payload: Record<string, unknown>;
}

interface Props {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  actors: Array<{ id: string; label: string }>;
  entities: string[];
  actions: string[];
}

export default function AuditTable({ logs, total, page, pageSize, actors, entities, actions }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [action, setAction] = useState(params.get('action') || '');
  const [entity, setEntity] = useState(params.get('entity') || '');
  const [actor, setActor] = useState(params.get('actor') || '');
  const [from, setFrom] = useState(params.get('from') || '');
  const [to, setTo] = useState(params.get('to') || '');

  // Atualiza URL quando filtros mudam
  useEffect(() => {
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (entity) q.set('entity', entity);
    if (actor) q.set('actor', actor);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    q.set('page', '1');
    router.replace(`/admin/audit${q.toString() ? `?${q}` : ''}`);
  }, [action, entity, actor, from, to, router]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const exportCsv = () => {
    // Usa URL atual com filtros para o endpoint server-side
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (entity) q.set('entity', entity);
    if (actor) q.set('actor', actor);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    window.open(`/api/admin/audit/export?${q.toString()}`, '_blank');
  };

  const clearFilters = () => {
    setAction('');
    setEntity('');
    setActor('');
    setFrom('');
    setTo('');
  };

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  return (
    <div>
      {/* 11.10.1 — filtros */}
      <div className="bg-white border border-app-border rounded-xl p-3 mb-3 flex flex-wrap gap-2 items-end">
        <div>
          <label htmlFor="filter-action" className="block text-xs text-ink-muted mb-1">Ação</label>
          <select id="filter-action" value={action} onChange={(e) => setAction(e.target.value)} className="px-2 py-2 border border-app-border rounded text-sm bg-white">
            <option value="">Todas</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-entity" className="block text-xs text-ink-muted mb-1">Entidade</label>
          <select id="filter-entity" value={entity} onChange={(e) => setEntity(e.target.value)} className="px-2 py-2 border border-app-border rounded text-sm bg-white">
            <option value="">Todas</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-actor" className="block text-xs text-ink-muted mb-1">Ator</label>
          <select id="filter-actor" value={actor} onChange={(e) => setActor(e.target.value)} className="px-2 py-2 border border-app-border rounded text-sm bg-white">
            <option value="">Todos</option>
            {actors.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-from" className="block text-xs text-ink-muted mb-1">De</label>
          <input id="filter-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-2 border border-app-border rounded text-sm" />
        </div>
        <div>
          <label htmlFor="filter-to" className="block text-xs text-ink-muted mb-1">Até</label>
          <input id="filter-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-2 border border-app-border rounded text-sm" />
        </div>
        <button type="button" onClick={clearFilters} className="text-sm px-3 py-2 border border-app-border rounded hover:bg-app-bg">
          Limpar
        </button>
        <button type="button" onClick={exportCsv} className="ml-auto text-sm px-3 py-2 bg-brand text-white rounded hover:bg-brand-hover">
          ⬇ Exportar CSV
        </button>
      </div>

      <p className="text-xs text-ink-muted mb-2">
        {total} ação(ões) encontrada(s). Página {page} de {totalPages}.
      </p>

      <div className="bg-white border border-app-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-app-bg border-b border-app-border">
            <tr>
              <th className="text-left p-2 font-medium text-ink">Quando</th>
              <th className="text-left p-2 font-medium text-ink">Ação</th>
              <th className="text-left p-2 font-medium text-ink">Entidade</th>
              <th className="text-left p-2 font-medium text-ink">ID</th>
              <th className="text-left p-2 font-medium text-ink">Ator</th>
              <th className="text-left p-2 font-medium text-ink">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-ink-muted">
                  Nenhuma ação encontrada com os filtros atuais.
                </td>
              </tr>
            )}
            {logs.map((l) => {
              const isOpen = expanded.has(l.id);
              return (
                <>
                  <tr key={l.id} className="hover:bg-app-bg">
                    <td className="p-2 text-ink-muted whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2 font-mono text-xs">{l.action}</td>
                    <td className="p-2">{l.entity}</td>
                    <td className="p-2 text-ink-muted text-xs font-mono">{l.entity_id?.slice(0, 8) || '—'}</td>
                    <td className="p-2 text-ink-muted text-xs font-mono">{l.actor_id?.slice(0, 8) || '—'}</td>
                    <td className="p-2">
                      {l.payload && Object.keys(l.payload).length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(expanded);
                            if (next.has(l.id)) next.delete(l.id);
                            else next.add(l.id);
                            setExpanded(next);
                          }}
                          className="text-xs text-brand-text hover:underline"
                        >
                          {isOpen ? '✕' : 'Ver'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && l.payload && Object.keys(l.payload).length > 0 && (
                    <tr key={`${l.id}-d`} className="bg-app-bg">
                      <td colSpan={6} className="p-3">
                        <pre className="text-xs font-mono text-ink whitespace-pre-wrap break-words">
                          {JSON.stringify(l.payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 11.10.3 — paginação server-side */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} action={action} entity={entity} actor={actor} from={from} to={to} />
      )}
    </div>
  );
}

function Pagination({ page, totalPages, action, entity, actor, from, to }: {
  page: number; totalPages: number; action: string; entity: string; actor: string; from: string; to: string;
}) {
  const makeUrl = (p: number) => {
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (entity) q.set('entity', entity);
    if (actor) q.set('actor', actor);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    q.set('page', String(p));
    return `/admin/audit?${q.toString()}`;
  };
  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-1 mt-3">
      {page > 1 && (
        <a href={makeUrl(page - 1)} className="px-3 py-2 border border-app-border rounded text-sm hover:bg-app-bg">← Anterior</a>
      )}
      <span className="px-3 py-2 text-sm text-ink-muted">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <a href={makeUrl(page + 1)} className="px-3 py-2 border border-app-border rounded text-sm hover:bg-app-bg">Próxima →</a>
      )}
    </nav>
  );
}
