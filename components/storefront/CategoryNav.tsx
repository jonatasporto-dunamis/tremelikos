'use client';

import { Section } from '@/types/database';

interface CategoryNavProps {
  sections: Section[];
}

export default function CategoryNav({ sections }: CategoryNavProps) {
  const scrollToSection = (slug: string) => {
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-[73px] z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="container-store">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.slug)}
              className="shrink-0 px-4 py-2 text-sm font-medium rounded-full bg-brand-soft text-brand-text hover:bg-brand/10 transition-colors"
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
