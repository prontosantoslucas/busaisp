import { RailLine, RailOperator, RailStatusType, RailsResponse } from '@/types/trilhos';
import { MOCK_RAIL_LINES, getMockRailsResponse } from '@/lib/mockData';

// Informações canônicas das linhas de SP
const METRO_LINE_METADATA: Record<string, { name: string; colorName: string; hexColor: string; operator: RailOperator }> = {
  "1": { name: "Linha 1 - Azul", colorName: "Azul", hexColor: "#003399", operator: "METRO" },
  "2": { name: "Linha 2 - Verde", colorName: "Verde", hexColor: "#008053", operator: "METRO" },
  "3": { name: "Linha 3 - Vermelha", colorName: "Vermelha", hexColor: "#EE1D23", operator: "METRO" },
  "4": { name: "Linha 4 - Amarela", colorName: "Amarela", hexColor: "#FFF000", operator: "VIAQUATRO" },
  "5": { name: "Linha 5 - Lilás", colorName: "Lilás", hexColor: "#9B388D", operator: "VIAMOBILIDADE" },
  "7": { name: "Linha 7 - Rubi", colorName: "Rubi", hexColor: "#A61358", operator: "CPTM" },
  "8": { name: "Linha 8 - Diamante", colorName: "Diamante", hexColor: "#808080", operator: "VIAMOBILIDADE" },
  "9": { name: "Linha 9 - Esmeralda", colorName: "Esmeralda", hexColor: "#009496", operator: "VIAMOBILIDADE" },
  "10": { name: "Linha 10 - Turquesa", colorName: "Turquesa", hexColor: "#007C8F", operator: "CPTM" },
  "11": { name: "Linha 11 - Coral", colorName: "Coral", hexColor: "#F04E23", operator: "CPTM" },
  "12": { name: "Linha 12 - Safira", colorName: "Safira", hexColor: "#1C357E", operator: "CPTM" },
  "13": { name: "Linha 13 - Jade", colorName: "Jade", hexColor: "#00A859", operator: "CPTM" },
  "15": { name: "Linha 15 - Prata", colorName: "Prata", hexColor: "#A7A8AA", operator: "METRO" }
};

let cachedRails: RailsResponse | null = null;
let railsCacheExpiresAt = 0;

function parseStatusType(rawStatus: string): RailStatusType {
  const norm = (rawStatus || '').toLowerCase().trim();
  if (norm.includes('normal')) return 'NORMAL';
  if (norm.includes('reduzid') || norm.includes('lenta')) return 'VELOCIDADE_REDUZIDA';
  if (norm.includes('parcial') || norm.includes('diferenciad')) return 'OPERACAO_PARCIAL';
  if (norm.includes('paralisad') || norm.includes('interrompid')) return 'PARALISADA';
  if (norm.includes('encerrad')) return 'ENCERRADA';
  return 'NORMAL';
}

/**
 * Busca o status em tempo real de todas as linhas de Metrô e CPTM
 */
export async function getRailsStatus(): Promise<RailsResponse> {
  const now = Date.now();

  // 1. Verificar cache local com TTL de 2 minutos (120s)
  if (cachedRails && now < railsCacheExpiresAt) {
    return cachedRails;
  }

  // 2. Tentar consultar APIs públicas de status
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Tentar API pública open-source de status do Metrô SP
    const res = await fetch('https://www.diretodostrens.com.br/api/status', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lines: RailLine[] = data.map((item: any) => {
          const num = String(item.codigo || item.id || item.line || '').replace(/\D/g, '');
          const meta = METRO_LINE_METADATA[num] || {
            name: item.nome || `Linha ${num}`,
            colorName: item.cor || 'Linha',
            hexColor: '#333333',
            operator: 'METRO' as RailOperator
          };

          const statusType = parseStatusType(item.situacao || item.status || 'Operação Normal');

          return {
            id: num || String(Math.random()),
            number: num,
            name: meta.name,
            colorName: meta.colorName,
            hexColor: meta.hexColor,
            operator: meta.operator,
            status: statusType,
            statusText: item.situacao || 'Operação Normal',
            description: item.descricao || item.mensagem || 'Circulação de trens nos intervalos regulares.',
            updatedAt: item.criado || 'Agora'
          };
        });

        const issues = lines.filter(l => l.status !== 'NORMAL').length;
        const response: RailsResponse = {
          lines: lines.sort((a, b) => Number(a.number || 0) - Number(b.number || 0)),
          summary: {
            total: lines.length,
            normal: lines.length - issues,
            withIssues: issues
          },
          lastChecked: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          source: 'Direto dos Trens / CPTM & Metrô'
        };

        cachedRails = response;
        railsCacheExpiresAt = now + 120 * 1000; // 2 min
        return response;
      }
    }
  } catch (err) {
    // Timeout ou erro de rede — usar mock data
    console.warn('[Trilhos] Falha ao consultar feed remoto de trens, usando dados base:', err);
  }

  // Fallback garantido
  const mock = getMockRailsResponse();
  cachedRails = mock;
  railsCacheExpiresAt = now + 60 * 1000;
  return mock;
}
