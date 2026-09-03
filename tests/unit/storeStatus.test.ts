import { describe, it, expect } from 'vitest';
import { isOpen, nextOpen, formatScheduleLabel, DEFAULT_SCHEDULE } from '@/lib/storeStatus';

// Helper: cria Date no horário LOCAL (sem depender de timezone)
const at = (y: number, m: number, d: number, hh: number, mm = 0) => new Date(y, m - 1, d, hh, mm, 0);

describe('isOpen', () => {
  it('terça 19:00 → aberto', () => {
    // 2026-09-01 é terça-feira
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 19, 0))).toBe(true);
  });

  it('terça 16:00 → fechado (antes de abrir)', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 16, 0))).toBe(false);
  });

  it('domingo → fechado', () => {
    // 2026-09-06 é domingo
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 6, 19, 0))).toBe(false);
  });

  it('segunda → fechado', () => {
    // 2026-09-07 é segunda
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 7, 19, 0))).toBe(false);
  });

  it('limite exato: 18:30 → aberto', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 18, 30))).toBe(true);
  });

  it('exato: 23:00 → fechado (limite superior exclusivo)', () => {
    expect(isOpen(DEFAULT_SCHEDULE, at(2026, 9, 1, 23, 0))).toBe(false);
  });

  it('sábado 20:00 → aberto', () => {
    // 2026-09-05 é sábado
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
    expect(next!.getDay()).toBe(2); // terça
    expect(next!.getHours()).toBe(18);
    expect(next!.getMinutes()).toBe(30);
  });

  it('segunda 20:00 (fechado): pula para terça 18:30', () => {
    const next = nextOpen(DEFAULT_SCHEDULE, at(2026, 9, 7, 20, 0));
    expect(next!.getDay()).toBe(2);
  });

  it('sábado após 23:00: pula para terça (não abre domingo)', () => {
    const next = nextOpen(DEFAULT_SCHEDULE, at(2026, 9, 5, 23, 30));
    expect(next!.getDay()).toBe(2);
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
