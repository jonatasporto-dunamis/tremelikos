import type { Store } from '@/types/database';

export interface DeliveryAddress {
  address?: string;
  neighborhood?: string;
  city?: string;
  zip?: string;
  complement?: string;
}

export interface DeliveryFeeResult {
  fee: number;
  minMinutes: number;
  maxMinutes: number;
}

export function calculateServerDeliveryFee({
  store,
  orderType,
  deliveryAddress,
}: {
  store: Store;
  orderType: 'pickup' | 'delivery';
  deliveryAddress?: DeliveryAddress;
}): DeliveryFeeResult {
  if (orderType !== 'delivery') {
    return { fee: 0, minMinutes: store.delivery_min_minutes || 0, maxMinutes: store.delivery_max_minutes || 0 };
  }

  const base = Number(store.delivery_fee || 0);
  const minMinutes = Number(store.delivery_min_minutes || 0);
  const maxMinutes = Number(store.delivery_max_minutes || 0);

  const areas = (store.delivery_areas as Array<{ neighborhood?: string; zip?: string; fee?: number }> | null) || [];

  if (areas.length > 0 && deliveryAddress) {
    const neighborhood = (deliveryAddress.neighborhood || '').toLowerCase();
    const zip = (deliveryAddress.zip || '').replace(/\D/g, '');
    const matched = areas.find((area) => {
      const areaNeighborhood = (area.neighborhood || '').toLowerCase();
      const areaZip = (area.zip || '').replace(/\D/g, '');
      if (!areaNeighborhood && !areaZip) return false;
      if (areaNeighborhood && neighborhood && neighborhood.includes(areaNeighborhood)) return true;
      if (areaZip && zip && zip.startsWith(areaZip)) return true;
      return false;
    });
    if (matched && typeof matched.fee === 'number') {
      return { fee: matched.fee, minMinutes, maxMinutes };
    }
  }

  const n = (deliveryAddress?.neighborhood || '').toLowerCase();
  if (!n) return { fee: base, minMinutes, maxMinutes };
  if (n.includes('jequiezinho') || n.includes('centro')) return { fee: base + 0, minMinutes, maxMinutes };
  if (n.includes('km') || n.includes('mandacaru')) return { fee: base + 2, minMinutes, maxMinutes };
  return { fee: base + 5, minMinutes, maxMinutes };
}
