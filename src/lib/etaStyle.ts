// Regra única de cor para badges de "tempo até a chegada do ônibus" em toda a aplicação:
// cinza = sem previsão real-time disponível; verde = chegada iminente; laranja = vai demorar.
// Não existe uma cor "vermelha" para desvio de rota porque ainda não detectamos desvio
// (exigiria comparar o GPS ao vivo do veículo com o trajeto planejado) — não inventar esse dado.
export type EtaTier = 'none' | 'soon' | 'wait';

export const ETA_SOON_THRESHOLD_MIN = 5;

export function getEtaTier(etaMinutes: number | null | undefined): EtaTier {
  if (etaMinutes === null || etaMinutes === undefined || etaMinutes < 0) return 'none';
  if (etaMinutes <= ETA_SOON_THRESHOLD_MIN) return 'soon';
  return 'wait';
}

export function getEtaColorTokens(etaMinutes: number | null | undefined): {
  color: string;
  background: string;
  border: string;
} {
  const tier = getEtaTier(etaMinutes);
  switch (tier) {
    case 'soon':
      return { color: 'var(--bus-emerald)', background: 'var(--bus-emerald-soft)', border: 'var(--bus-emerald)' };
    case 'wait':
      return { color: 'var(--bus-live)', background: 'var(--bus-live-soft)', border: 'var(--bus-live)' };
    case 'none':
    default:
      return { color: 'var(--bus-text-muted)', background: 'var(--bus-surface-elevated)', border: 'var(--bus-border)' };
  }
}
