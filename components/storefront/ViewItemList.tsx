'use client';

import { useEffect, useRef } from 'react';
import { trackViewItemList, type AnalyticsItem } from '@/features/analytics/events';

interface Props {
  listId: string;
  listName: string;
  items: AnalyticsItem[];
  children: React.ReactNode;
}

export default function ViewItemList({ listId, listName, items, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired.current) {
            fired.current = true;
            trackViewItemList(items, listId, listName);
          }
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [listId, listName, items]);

  return <div ref={ref}>{children}</div>;
}