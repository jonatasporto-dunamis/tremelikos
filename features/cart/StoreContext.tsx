'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Store, Section, Product } from '@/types/database';
import { supabase } from '@/lib/supabase/client';
import { computeStoreStatus, type StoreStatusResult } from '@/features/storeStatus/storeStatus';

interface StoreContextType {
  store: Store | null;
  sections: Section[];
  loading: boolean;
  isOpen: boolean;
  nextOpenTime: string | null;
  nextOpenAt: Date | null;
  closingSoon: boolean;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StoreStatusResult>({
    isOpen: false,
    nextOpenTime: null,
    nextOpenAt: null,
    closingSoon: false,
  });

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
      setStatus(computeStoreStatus());
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
        isOpen: status.isOpen,
        nextOpenTime: status.nextOpenTime,
        nextOpenAt: status.nextOpenAt,
        closingSoon: status.closingSoon,
        isClosed: !status.isOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
