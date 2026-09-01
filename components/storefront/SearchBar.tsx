'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/database';

interface SearchBarProps {
  products: Product[];
  onSelect?: (product: Product) => void;
  placeholder?: string;
}

export default function SearchBar({
  products,
  onSelect,
  placeholder = 'Buscar lanche, bebida...',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = query.trim().length < 2
    ? []
    : products
        .filter((p) => {
          const q = query.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
          );
        })
        .slice(0, 6);

  const handleSelect = (p: Product) => {
    setOpen(false);
    setQuery('');
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

  return (
    <div className="container-store py-3" ref={containerRef}>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Buscar produtos"
          className="w-full pl-10 pr-3 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand min-h-[44px]"
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
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        {open && results.length > 0 && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-lg max-h-80 overflow-y-auto">
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
                  R$ {p.base_price.toFixed(2).replace('.', ',')}
                </span>
              </button>
            ))}
          </div>
        )}

        {open && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-lg px-3 py-3 text-gray-500 text-sm">
            Nenhum produto encontrado.
          </div>
        )}
      </div>
    </div>
  );
}