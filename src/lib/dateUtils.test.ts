import { describe, it, expect } from 'vitest';
import { formatSaoPauloTime, getSaoPauloTime, getDiffMinutesFromSaoPaulo } from './dateUtils';

describe('dateUtils', () => {
  describe('formatSaoPauloTime', () => {
    it('formata corretamente a hora em São Paulo (UTC-3) independente do fuso do servidor', () => {
      // 18:30 UTC = 15:30 em São Paulo (UTC-3)
      const dateUtc = new Date('2026-08-26T18:30:00Z');
      expect(formatSaoPauloTime(dateUtc)).toBe('15:30');
    });

    it('trata virada de dia em relação ao UTC', () => {
      // 01:15 UTC de quinta = 22:15 em São Paulo de quarta
      const dateUtc = new Date('2026-08-27T01:15:00Z');
      expect(formatSaoPauloTime(dateUtc)).toBe('22:15');
    });
  });

  describe('getSaoPauloTime', () => {
    it('extrai horas, minutos e dia da semana no fuso de São Paulo', () => {
      // 2026-08-30T01:00:00Z (Domingo 01:00 UTC) -> Sábado 22:00 em SP
      const satNightUtc = new Date('2026-08-30T01:00:00Z');
      const satResult = getSaoPauloTime(satNightUtc);
      expect(satResult.hours).toBe(22);
      expect(satResult.minutes).toBe(0);
      expect(satResult.dayOfWeek).toBe(6); // Sábado
      expect(satResult.isSunday).toBe(false);

      // 2026-08-30T15:00:00Z (Domingo 15:00 UTC) -> Domingo 12:00 em SP
      const sunNoonUtc = new Date('2026-08-30T15:00:00Z');
      const sunResult = getSaoPauloTime(sunNoonUtc);
      expect(sunResult.hours).toBe(12);
      expect(sunResult.minutes).toBe(0);
      expect(sunResult.dayOfWeek).toBe(0); // Domingo
      expect(sunResult.isSunday).toBe(true);
    });
  });

  describe('getDiffMinutesFromSaoPaulo', () => {
    it('calcula diferença positiva para ônibus chegando no futuro próximo', () => {
      // Base: 15:43 em SP (18:43 UTC)
      const baseDate = new Date('2026-08-26T18:43:00Z');
      expect(getDiffMinutesFromSaoPaulo('15:50', baseDate)).toBe(7);
      expect(getDiffMinutesFromSaoPaulo('16:15', baseDate)).toBe(32);
    });

    it('trata ônibus chegando agora ou atraso de até 5 minutos como 0 min', () => {
      const baseDate = new Date('2026-08-26T18:43:00Z'); // 15:43 SP
      expect(getDiffMinutesFromSaoPaulo('15:43', baseDate)).toBe(0);
      expect(getDiffMinutesFromSaoPaulo('15:41', baseDate)).toBe(0); // -2 min
      expect(getDiffPayloadTolerance('15:38', baseDate)).toBe(0); // -5 min
    });

    it('descarta previsões desatualizadas no passado (> 5 min)', () => {
      const baseDate = new Date('2026-08-26T18:43:00Z'); // 15:43 SP
      expect(getDiffMinutesFromSaoPaulo('15:30', baseDate)).toBeNull(); // -13 min
      expect(getDiffMinutesFromSaoPaulo('12:00', baseDate)).toBeNull();
    });

    it('trata virada de meia-noite corretamente', () => {
      // Base: 23:55 em SP (02:55 UTC)
      const baseDate = new Date('2026-08-27T02:55:00Z');
      expect(getDiffMinutesFromSaoPaulo('00:10', baseDate)).toBe(15);
    });
  });
});

function getDiffPayloadTolerance(time: string, base: Date) {
  return getDiffMinutesFromSaoPaulo(time, base);
}
