'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Product } from '@/types/database';
import { trackSearch } from '@/features/analytics/events';
import { formatMoney } from '@/lib/money';

interface SearchBarProps {
  products: Product[];
  onSelect?: (product: Product) => void;
  placeholder?: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function SearchBar({
  products,
  onSelect,
  placeholder = 'O que você quer comer hoje? (ex: picanha, coca)',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = useMemo(() => {
    const q = normalize(query);
    if (q.length < 2) return [];
    return products
      .filter((p) => {
        const name = normalize(p.name);
        const desc = normalize(p.description || '');
        const slug = normalize(p.slug);
        return name.includes(q) || desc.includes(q) || slug.includes(q);
      })
      .slice(0, 6);
  }, [query, products]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const t = setTimeout(() => {
        trackSearch(query.trim(), results.length);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [query, results.length]);

  const handleSelect = (p: Product) => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    if (typeof document !== 'undefined') {
      const el = document.getElementById(`product-${p.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-brand');
        setTimeout(() => el.classList.remove('ring-2', 'ring-brand'), 1500);
      }
    }
    onSelect?.(p);
  };

  const clear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="container-store py-3" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Buscar produtos"
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand min-h-[44px]"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        {query.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {open && query.trim().length >= 2 && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-lg max-h-80 overflow-y-auto">
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-50">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </div>
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full text-left px-3 py-2 hover:bg-brand-soft border-b border-gray-50 last:border-b-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-brand-contrast truncate">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-gray-500 truncate">{p.description}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-brand whitespace-nowrap">
                  {formatMoney(p.base_price)}
                </span>
              </button>
            ))}
            {results.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500">
                Nenhum produto encontrado para “{query}”.
                <div className="mt-1 text-xs text-gray-400">Tente “picanha”, “bacon” ou “coca”.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}