// lib/storeStatus.ts
// Horário padrão da loja: Ter-Sáb 18:30-23:00, Dom/Seg fechado.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StoreSchedule {
  // mapa de weekday -> { open, close } em minutos desde 00:00
  hours: Partial<Record<Weekday, { open: number; close: number } | null>>;
  timezone: string;
}

export const DEFAULT_SCHEDULE: StoreSchedule = {
  hours: {
    0: null, // domingo fechado
    1: null, // segunda fechado
    2: { open: 18 * 60 + 30, close: 23 * 60 }, // terça
    3: { open: 18 * 60 + 30, close: 23 * 60 }, // quarta
    4: { open: 18 * 60 + 30, close: 23 * 60 }, // quinta
    5: { open: 18 * 60 + 30, close: 23 * 60 }, // sexta
    6: { open: 18 * 60 + 30, close: 23 * 60 }, // sábado
  },
  timezone: 'America/Sao_Paulo',
};

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isOpen(schedule: StoreSchedule = DEFAULT_SCHEDULE, now: Date = new Date()): boolean {
  const day = now.getDay() as Weekday;
  const slot = schedule.hours[day];
  if (!slot) return false;
  const m = minutesOfDay(now);
  return m >= slot.open && m < slot.close;
}

export function nextOpen(schedule: StoreSchedule = DEFAULT_SCHEDULE, now: Date = new Date()): Date | null {
  if (isOpen(schedule, now)) return null;
  // procura nos próximos 7 dias
  for (let d = 0; d < 7; d++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + d);
    const day = candidate.getDay() as Weekday;
    const slot = schedule.hours[day];
    if (!slot) continue;
    candidate.setHours(Math.floor(slot.open / 60), slot.open % 60, 0, 0);
    if (d === 0 && candidate <= now) continue;
    return candidate;
  }
  return null;
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
