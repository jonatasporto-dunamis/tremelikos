'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Store, Section, Product } from '@/types/database';
import { supabase } from '@/lib/supabase/client';

interface StoreContextType {
  store: Store | null;
  sections: Section[];
  loading: boolean;
  isOpen: boolean;
  nextOpenTime: string | null;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  sections: [],
  loading: true,
  isOpen: false,
  nextOpenTime: null,
});

function checkStoreStatus(): { isOpen: boolean; nextOpenTime: string | null } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  const schedule: Record<number, { open: string; close: string } | null> = {
    0: null, // domingo fechado
    1: null, // segunda fechado
    2: { open: '18:30', close: '23:00' },
    3: { open: '18:30', close: '23:00' },
    4: { open: '18:30', close: '23:00' },
    5: { open: '18:30', close: '23:00' },
    6: { open: '18:30', close: '23:00' },
  };

  const todaySchedule = schedule[dayOfWeek];

  if (!todaySchedule) {
    let daysToAdd = 1;
    while (daysToAdd <= 7) {
      const nextDay = (dayOfWeek + daysToAdd) % 7;
      if (schedule[nextDay]) {
        return { isOpen: false, nextOpenTime: `Abre ${getDayName(nextDay)} às ${schedule[nextDay]!.open}` };
      }
      daysToAdd++;
    }
    return { isOpen: false, nextOpenTime: null };
  }

  if (currentTime >= todaySchedule.open && currentTime < todaySchedule.close) {
    return { isOpen: true, nextOpenTime: null };
  }

  if (currentTime < todaySchedule.open) {
    return { isOpen: false, nextOpenTime: `Abre hoje às ${todaySchedule.open}` };
  }

  let daysToAdd = 1;
  while (daysToAdd <= 7) {
    const nextDay = (dayOfWeek + daysToAdd) % 7;
    if (schedule[nextDay]) {
      return { isOpen: false, nextOpenTime: `Abre ${getDayName(nextDay)} às ${schedule[nextDay]!.open}` };
    }
    daysToAdd++;
  }

  return { isOpen: false, nextOpenTime: null };
}

function getDayName(day: number): string {
  const names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return names[day];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [nextOpenTime, setNextOpenTime] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStore() {
      try {
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', 'tremelikos-burguer')
          .single();

        if (storeData) {
          setStore(storeData);
        }

        const { data: sectionsData } = await supabase
          .from('sections')
          .select('*')
          .eq('active', true)
          .order('position');

        if (sectionsData) {
          setSections(sectionsData);
        }
      } catch (error) {
        console.error('Error fetching store:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStore();

    const status = checkStoreStatus();
    setIsOpen(status.isOpen);
    setNextOpenTime(status.nextOpenTime);

    const interval = setInterval(() => {
      const s = checkStoreStatus();
      setIsOpen(s.isOpen);
      setNextOpenTime(s.nextOpenTime);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <StoreContext.Provider value={{ store, sections, loading, isOpen, nextOpenTime }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
