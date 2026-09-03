'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Store, Section, Product } from '@/types/database';
import { supabase } from '@/lib/supabase/client';

interface StoreContextType {
  store: Store | null;
  sections: Section[];
  loading: boolean;
  isOpen: boolean;
  /** Próximo horário de abertura em linguagem natural (ex.: "Abre hoje às 18:30") */
  nextOpenTime: string | null;
  /** Próximo ISO datetime de abertura, para agendamento */
  nextOpenAt: Date | null;
  /** true se faltar < 1h para fechar */
  closingSoon: boolean;
  /** true se a loja está fechada agora (alias semântico) */
  isClosed: boolean;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  sections: [],
  loading: true,
  isOpen: false,
  nextOpenTime: null,
  nextOpenAt: null,
  closingSoon: false,
  isClosed: true,
});

function checkStoreStatus(now: Date = new Date()): { isOpen: boolean; nextOpenTime: string | null; nextOpenAt: Date | null; closingSoon: boolean } {
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
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const buildOpenAt = (dayOffset: number, openStr: string): Date => {
    const [h, m] = openStr.split(':').map(Number);
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  // fechado hoje, próximo open é hoje mesmo antes de fechar
  if (todaySchedule) {
    if (currentTime < todaySchedule.open) {
      return {
        isOpen: false,
        nextOpenTime: `Abre hoje às ${todaySchedule.open}`,
        nextOpenAt: buildOpenAt(0, todaySchedule.open),
        closingSoon: false,
      };
    }
    if (currentTime >= todaySchedule.open && currentTime < todaySchedule.close) {
      const [ch, cm] = todaySchedule.close.split(':').map(Number);
      const closeMinutes = ch * 60 + cm;
      const minutesLeft = closeMinutes - currentMinutes;
      return {
        isOpen: true,
        nextOpenTime: null,
        nextOpenAt: null,
        closingSoon: minutesLeft <= 60,
      };
    }
  }

  // procurando o próximo dia aberto
  for (let i = 1; i <= 7; i++) {
    const nextDay = (dayOfWeek + i) % 7;
    const s = schedule[nextDay];
    if (s) {
      const dayName = i === 1 ? 'amanhã' : getDayName(nextDay);
      return {
        isOpen: false,
        nextOpenTime: i === 1 ? `Abre amanhã às ${s.open}` : `Abre ${dayName} às ${s.open}`,
        nextOpenAt: buildOpenAt(i, s.open),
        closingSoon: false,
      };
    }
  }
  return { isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false };
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
  const [nextOpenAt, setNextOpenAt] = useState<Date | null>(null);
  const [closingSoon, setClosingSoon] = useState(false);

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

    const update = () => {
      const s = checkStoreStatus();
      setIsOpen(s.isOpen);
      setNextOpenTime(s.nextOpenTime);
      setNextOpenAt(s.nextOpenAt);
      setClosingSoon(s.closingSoon);
    };
    update();

    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        store,
        sections,
        loading,
        isOpen,
        nextOpenTime,
        nextOpenAt,
        closingSoon,
        isClosed: !isOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
