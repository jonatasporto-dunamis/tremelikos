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
  nextOpenAt: Date | null;
  closingSoon: boolean;
  isClosed: boolean;
  manualPause: boolean;
  deliveryFee: number;
  deliveryMinMinutes: number;
  deliveryMaxMinutes: number;
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
  manualPause: false,
  deliveryFee: 0,
  deliveryMinMinutes: 0,
  deliveryMaxMinutes: 0,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    isOpen: boolean;
    nextOpenTime: string | null;
    nextOpenAt: Date | null;
    closingSoon: boolean;
  }>({
    isOpen: false,
    nextOpenTime: null,
    nextOpenAt: null,
    closingSoon: false,
  });
  const [manualPause, setManualPause] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryMinMinutes, setDeliveryMinMinutes] = useState(0);
  const [deliveryMaxMinutes, setDeliveryMaxMinutes] = useState(0);

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
          setManualPause(storeData.manual_pause || false);
          setDeliveryFee(storeData.delivery_fee || 0);
          setDeliveryMinMinutes(storeData.delivery_min_minutes || 0);
          setDeliveryMaxMinutes(storeData.delivery_max_minutes || 0);
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

    async function fetchStatus() {
      try {
        const res = await fetch('/api/store/status');
        if (res.ok) {
          const data = await res.json();
          setStatus({
            isOpen: data.isOpen,
            nextOpenTime: data.nextOpenTime,
            nextOpenAt: data.nextOpenAt ? new Date(data.nextOpenAt) : null,
            closingSoon: data.closingSoon,
          });
          setManualPause(data.manualPause || false);
          setDeliveryFee(data.deliveryFee || 0);
          setDeliveryMinMinutes(data.deliveryMinMinutes || 0);
          setDeliveryMaxMinutes(data.deliveryMaxMinutes || 0);
        }
      } catch {
        // keep previous status on network error
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
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
        isClosed: !status.isOpen || manualPause,
        manualPause,
        deliveryFee,
        deliveryMinMinutes,
        deliveryMaxMinutes,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
