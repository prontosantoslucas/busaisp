/**
 * Utilitários de Data e Hora com suporte estrito ao fuso horário de São Paulo (America/Sao_Paulo / UTC-3).
 * Garante consistência independente do fuso horário configurado no servidor (ex: UTC em Cloud/Vercel/Docker).
 */

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formata um objeto Date no padrão "HH:mm" utilizando o fuso de São Paulo.
 */
export function formatSaoPauloTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * Retorna as componentes de hora, minuto e dia da semana no fuso de São Paulo.
 */
export function getSaoPauloTime(date: Date = new Date()): {
  hours: number;
  minutes: number;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  isSunday: boolean;
  formatted: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
  const hStr = parts.find((p) => p.type === 'hour')?.value || '0';
  const mStr = parts.find((p) => p.type === 'minute')?.value || '0';

  const hours = parseInt(hStr === '24' ? '0' : hStr, 10);
  const minutes = parseInt(mStr, 10);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  const dayOfWeek = weekdayMap[weekday] ?? date.getDay();
  const isSunday = dayOfWeek === 0;
  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return {
    hours,
    minutes,
    dayOfWeek,
    isSunday,
    formatted
  };
}

/**
 * Calcula a diferença em minutos entre uma previsão no formato "HH:mm" (típico da SPTrans)
 * e o horário base atual no fuso de São Paulo.
 * 
 * Trata:
 * - Virada de meia-noite (ex: consulta às 23:58, previsão às 00:05 -> +7 min)
 * - Veículo quase no ponto / tolerância de atraso leve (ex: -3 min -> 0 min / "Agora")
 * - Descarta horários no passado (> 5 min atrás) ou distantes demais (> 12h)
 */
export function getDiffMinutesFromSaoPaulo(targetHHMM: string, baseDate: Date = new Date()): number | null {
  if (!targetHHMM || typeof targetHHMM !== 'string') return null;

  const parts = targetHHMM.split(':').map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;

  const [targetHours, targetMinutes] = parts;
  const spNow = getSaoPauloTime(baseDate);

  const nowMinutes = spNow.hours * 60 + spNow.minutes;
  const targetTotalMinutes = targetHours * 60 + targetMinutes;

  let diff = targetTotalMinutes - nowMinutes;

  // Virada de meia-noite genuína (consulta de noite e chegada de madrugada)
  if (spNow.hours >= 21 && targetHours <= 4 && diff < 0) {
    diff += 24 * 60;
  }

  // Se a previsão for ligeiramente no passado (-5 a 0 min), o ônibus está passando agora
  if (diff >= -5 && diff < 0) {
    return 0;
  }

  // Descarta dados desatualizados no passado (< -5 min) ou fora da janela operacional (> 12h)
  if (diff < 0 || diff > 720) {
    return null;
  }

  return diff;
}
