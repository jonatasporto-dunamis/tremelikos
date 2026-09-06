import { describe, it, expect } from 'vitest';
import { isOpen, nextOpen, formatScheduleLabel, DEFAULT_SCHEDULE } from '@/lib/storeStatus';

const at = (y: number, m: number, d: number, hh: number, mm = 0) => new Date(Date.UTC(y, m - 1, d, hh + 3, mm, 0));

function spDay(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'long' }).formatToParts(date);
  const dow = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() || '';
  const map: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  return map[dow] ?? date.getDay();
}

function spHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).formatToParts(date);
  return Number(parts.find((p) => p.type === 'hour')?.value || '0');
}

function spMinute(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', minute: '2-digit' }).formatToParts(date);
  return Number(parts.find((p) => p.type === 'minute')?.value || '0');
}

describe('isOpen', () => {
  it('terça 19:00 → aberto', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 19, 0))).toBe(true);
  });

  it('terça 16:00 → fechado (antes de abrir)', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 16, 0))).toBe(false);
  });

  it('domingo → fechado', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 6, 19, 0))).toBe(false);
  });

  it('segunda → fechado', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 7, 19, 0))).toBe(false);
  });

  it('limite exato: 18:30 → aberto', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 18, 30))).toBe(true);
  });

  it('exato: 23:00 → fechado (limite superior exclusivo)', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 23, 0))).toBe(false);
  });

  it('sábado 20:00 → aberto', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 5, 20, 0))).toBe(true);
  });

  it('sexta 23:30 → fechado (após fechamento)', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 4, 23, 30))).toBe(false);
  });
});

describe('nextOpen', () => {
  it('quando aberto retorna null', () => {
    expect(nextOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 19, 0))).toBeNull();
  });

  it('terça antes de abrir: retorna hoje 18:30', () => {
    const next = nextOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 12, 0));
    expect(next).not.toBeNull();
    expect(spDay(next!)).toBe(2);
    expect(spHour(next!)).toBe(18);
    expect(spMinute(next!)).toBe(30);
  });

  it('segunda 20:00 (fechado): pula para terça 18:30', () => {
    const next = nextOpen(DEFAULT_SCHEDULE, at(2026, 9, 7, 20, 0));
    expect(next).not.toBeNull();
    expect(spDay(next!)).toBe(2);
  });

  it('sábado após 23:00: pula para terça (não abre domingo)', () => {
    const next = nextOpen(DEFAULT_SCHEDULE, at(2026, 9, 5, 23, 30));
    expect(next).not.toBeNull();
    expect(spDay(next!)).toBe(2);
  });
});

describe('formatScheduleLabel', () => {
  it('contém dias abertos com horários', () => {
    const label = formatScheduleLabel();
    expect(label).toMatch(/Ter 18:30-23:00/);
    expect(label).toMatch(/Sáb 18:30-23:00/);
    expect(label).not.toMatch(/Dom/);
    expect(label).not.toMatch(/Seg/);
  });
});
