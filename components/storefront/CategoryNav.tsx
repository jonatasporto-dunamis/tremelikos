'use client';

import { useEffect, useRef, useState } from 'react';
import { Section } from '@/types/database';

interface CategoryNavProps {
  sections: Section[];
}

export default function CategoryNav({ sections }: CategoryNavProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const scrollToSection = (slug: string) => {
    const element = document.getElementById(slug);
    if (element) {
      const offset = 140; // sticky header + nav
      const y = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // IntersectionObserver: detecta seção visível
  useEffect(() => {
    if (typeof window === 'undefined' || sections.length === 0) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible.set(e.target.id, e.intersectionRatio);
          } else {
            visible.delete(e.target.id);
          }
        }
        if (visible.size > 0) {
          // pega a seção com maior ratio visível
          const sorted = Array.from(visible.entries()).sort((a, b) => b[1] - a[1]);
          const topId = sorted[0]?.[0];
          if (topId) {
            const sec = sections.find((s) => s.slug === topId);
            if (sec) setActiveId(sec.id);
          }
        }
      },
      { rootMargin: '-180px 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  // rolar item ativo para área visível
  useEffect(() => {
    const btn = navRefs.current[activeId];
    if (btn && containerRef.current) {
      const c = containerRef.current;
      const cR = c.getBoundingClientRect();
      const bR = btn.getBoundingClientRect();
      if (bR.left < cR.left || bR.right > cR.right) {
        c.scrollTo({
          left: btn.offsetLeft - c.clientWidth / 2 + btn.clientWidth / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [activeId]);

  if (sections.length === 0) return null;

  return (
    <nav
      className="sticky top-[73px] z-40 bg-white border-b border-gray-100 shadow-sm"
      aria-label="Categorias"
    >
      <div className="container-store relative">
        {/* gradientes de overflow */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" aria-hidden="true" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" aria-hidden="true" />

        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-3 px-1"
          role="tablist"
        >
          {sections.map((section) => {
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                ref={(el) => { navRefs.current[section.id] = el; }}
                onClick={() => scrollToSection(section.slug)}
                role="tab"
                aria-selected={isActive}
                aria-controls={section.slug}
                className={`shrink-0 px-4 min-h-[40px] text-sm font-semibold rounded-full transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'bg-brand-soft text-brand-text hover:bg-brand/10'
                }`}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}