// lib/storeStatus.ts
// Horário padrão da loja: Ter-Sáb 18:30-23:00, Dom/Seg fechado.
// Usa timezone America/Sao_Paulo em todas as consultas.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StoreSchedule {
  hours: Partial<Record<Weekday, { open: number; close: number } | null>>;
  timezone: string;
}

export const DEFAULT_SCHEDULE: StoreSchedule = {
  hours: {
    0: null,
    1: null,
    2: { open: 18 * 60 + 30, close: 23 * 60 },
    3: { open: 18 * 60 + 30, close: 23 * 60 },
    4: { open: 18 * 60 + 30, close: 23 * 60 },
    5: { open: 18 * 60 + 30, close: 23 * 60 },
    6: { open: 18 * 60 + 30, close: 23 * 60 },
  },
  timezone: 'America/Sao_Paulo',
};

function partsValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((p) => p.type === type)?.value || '0';
}

function getOffsetMinutes(date: Date, timezone: string): number {
  const utcStr = date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const tzStr = date.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parse = (s: string) => {
    const [mdY, time] = s.split(', ');
    const [month, day, year] = mdY.split('/');
    const [hh, mm, ss] = time.split(':').map(Number);
    return Date.UTC(Number(year), Number(month) - 1, Number(day), hh, mm, ss);
  };
  return (parse(tzStr) - parse(utcStr)) / 60000;
}

function minutesOfDay(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hh = Number(partsValue(parts, 'hour'));
  const mm = Number(partsValue(parts, 'minute'));
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
  const dow = partsValue(parts, 'weekday').toLowerCase();
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  return map[dow] ?? date.getDay();
}

export function isOpen(schedule: StoreSchedule = DEFAULT_SCHEDULE, now: Date = new Date()): boolean {
  const day = dayOfWeek(now, schedule.timezone) as Weekday;
  const slot = schedule.hours[day];
  if (!slot) return false;
  const m = minutesOfDay(now, schedule.timezone);
  return m >= slot.open && m < slot.close;
}

export function nextOpen(schedule: StoreSchedule = DEFAULT_SCHEDULE, now: Date = new Date()): Date | null {
  if (isOpen(schedule, now)) return null;
  const day = dayOfWeek(now, schedule.timezone);
  for (let d = 0; d < 7; d++) {
    const nextDay = (day + d) % 7 as Weekday;
    const slot = schedule.hours[nextDay];
    if (!slot) continue;
    const m = minutesOfDay(now, schedule.timezone);
    if (d === 0 && m >= slot.open && m < slot.close) return null;
    if (d === 0 && m >= slot.close) continue;
    return buildOpenAt(now, d, slot.open, schedule.timezone);
  }
  return null;
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

  const year = Number(partsValue(parts, 'year'));
  const month = Number(partsValue(parts, 'month'));
  const day = Number(partsValue(parts, 'day'));
  const offset = getOffsetMinutes(now, timezone);
  const openHour = Math.floor(openMinutes / 60) - offset / 60;
  const openMinute = openMinutes % 60;
  return new Date(Date.UTC(year, month - 1, day + dayOffset, openHour, openMinute, 0));
}

export function formatScheduleLabel(schedule: StoreSchedule = DEFAULT_SCHEDULE): string {
  const labels: string[] = [];
  const dayNames: Record<Weekday, string> = {
    0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
  };
  for (let d = 0 as Weekday; d <= 6; d = (d + 1) as Weekday) {
    const slot = schedule.hours[d];
    if (!slot) continue;
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    labels.push(`${dayNames[d]} ${fmt(slot.open)}-${fmt(slot.close)}`);
  }
  return labels.join(', ');
}
