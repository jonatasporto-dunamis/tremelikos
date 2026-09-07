import type { Store, BusinessHour, StoreOverride } from '@/types/database';

export interface ServerStoreStatusResult {
  isOpen: boolean;
  nextOpenTime: string | null;
  nextOpenAt: Date | null;
  closingSoon: boolean;
}

export interface ServerStoreStatusInput {
  store: Store;
  businessHours: BusinessHour[];
  overrides: StoreOverride[];
  now?: Date;
}

function minutesOfDay(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value || '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value || '0');
  return hh * 60 + mm;
}

function dayOfWeek(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const dow = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() || '';
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  return map[dow] ?? date.getDay();
}

function dateString(d: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = Number(parts.find((p) => p.type === 'year')?.value || '0');
  const m = Number(parts.find((p) => p.type === 'month')?.value || '1');
  const day = Number(parts.find((p) => p.type === 'day')?.value || '1');
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildOpenAt(now: Date, dayOffset: number, openMinutes: number, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === 'year')?.value || '0');
  const month = Number(parts.find((p) => p.type === 'month')?.value || '1');
  const day = Number(parts.find((p) => p.type === 'day')?.value || '1');

  const utcStr = now.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const tzStr = now.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parse = (s: string) => {
    const [mdY, time] = s.split(', ');
    const [mo, dy, yr] = mdY.split('/');
    const [hh, mm, ss] = time.split(':').map(Number);
    return Date.UTC(Number(yr), Number(mo) - 1, Number(dy), hh, mm, ss);
  };
  const offset = (parse(tzStr) - parse(utcStr)) / 60000;
  const openHour = Math.floor(openMinutes / 60) - offset / 60;
  const openMinute = openMinutes % 60;
  return new Date(Date.UTC(year, month - 1, day + dayOffset, openHour, openMinute, 0));
}

export function computeServerStoreStatus(input: ServerStoreStatusInput): ServerStoreStatusResult {
  const now = input.now || new Date();
  const timezone = input.store.timezone || 'America/Sao_Paulo';

  if (!input.store.active) {
    return { isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false };
  }

  if (input.store.manual_pause) {
    return { isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false };
  }

  const today = dateString(now, timezone);
  const day = dayOfWeek(now, timezone);
  const currentMinutes = minutesOfDay(now, timezone);

  const todayOverride = input.overrides.find((o) => o.date === today);

  if (todayOverride) {
    if (todayOverride.status === 'closed') {
      return { isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false };
    }
    if (todayOverride.status === 'open' && todayOverride.opens_at && todayOverride.closes_at) {
      const [oh, om] = todayOverride.opens_at.split(':').map(Number);
      const [ch, cm] = todayOverride.closes_at.split(':').map(Number);
      const openMinutes = oh * 60 + om;
      const closeMinutes = ch * 60 + cm;
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        const minutesLeft = closeMinutes - currentMinutes;
        return {
          isOpen: true,
          nextOpenTime: null,
          nextOpenAt: null,
          closingSoon: minutesLeft <= 60,
        };
      }
      if (currentMinutes < openMinutes) {
        return {
          isOpen: false,
          nextOpenTime: `Abre hoje às ${todayOverride.opens_at.slice(0, 5)}`,
          nextOpenAt: buildOpenAt(now, 0, openMinutes, timezone),
          closingSoon: false,
        };
      }
    }
  }

  const hoursByDay = new Map((input.businessHours || []).map((h) => [h.weekday, h]));
  const todayHours = hoursByDay.get(day);

  if (todayHours?.closed) {
    return { isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false };
  }

  if (todayHours?.opens_at && todayHours?.closes_at) {
    const [oh, om] = todayHours.opens_at.split(':').map(Number);
    const [ch, cm] = todayHours.closes_at.split(':').map(Number);
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const minutesLeft = closeMinutes - currentMinutes;
      return {
        isOpen: true,
        nextOpenTime: null,
        nextOpenAt: null,
        closingSoon: minutesLeft <= 60,
      };
    }
    if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        nextOpenTime: `Abre hoje às ${todayHours.opens_at.slice(0, 5)}`,
        nextOpenAt: buildOpenAt(now, 0, openMinutes, timezone),
        closingSoon: false,
      };
    }
  }

  for (let i = 1; i <= 7; i++) {
    const nextDay = (day + i) % 7;
    const nextHours = hoursByDay.get(nextDay);
    if (nextHours?.closed) continue;
    if (nextHours?.opens_at) {
      const [oh, om] = nextHours.opens_at.split(':').map(Number);
      const openMinutes = oh * 60 + om;
      const dayName = i === 1 ? 'amanhã' : getDayName(nextDay);
      return {
        isOpen: false,
        nextOpenTime: i === 1 ? `Abre amanhã às ${nextHours.opens_at.slice(0, 5)}` : `Abre ${dayName} às ${nextHours.opens_at.slice(0, 5)}`,
        nextOpenAt: buildOpenAt(now, i, openMinutes, timezone),
        closingSoon: false,
      };
    }
  }

  return { isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false };
}

function getDayName(day: number): string {
  const names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return names[day] || '';
}
