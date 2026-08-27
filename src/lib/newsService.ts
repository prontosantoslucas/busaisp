import { UnifiedNewsItem } from '@/components/News/TransitNewsPanel';
import { getLiveTrafficIncidents } from '@/lib/trafficService';
import { getRailsStatus } from '@/lib/trilhos';

interface CachedNews {
  items: UnifiedNewsItem[];
  expiresAt: number;
}

let memoryNewsCache: CachedNews | null = null;

// Guias e regras permanentes da SPTrans e Prefeitura de SP (marcadas honestamente como Guias e Informativos)
export const PERMANENT_MOBILITY_GUIDES: UnifiedNewsItem[] = [
  {
    id: 'guide-tarifa-zero',
    sourceType: 'INFORMATIVOS',
    title: 'Domingão Tarifa Zero: Ônibus da SPTrans são 100% gratuitos',
    subtitle: 'Regra permanente aos domingos e feriados em toda a capital',
    description:
      'A gratuidade no transporte coletivo municipal por ônibus em São Paulo funciona todos os domingos e feriados oficiais da 0h às 23h59. Não é debitada tarifa no validador.',
    fullContent:
      'O programa Domingão Tarifa Zero garante acesso livre a todas as linhas municipais operadas pela SPTrans em São Paulo.\n\n• Horário: De 0h00 até 23h59 aos domingos e feriados.\n• Validação: Aproxime seu Bilhete Único ativo na catraca (saldo não é debitado) ou solicite liberação ao motorista/cobrador.\n• Abrangência: Todos os ônibus convencionais, articulados e micro-ônibus.',
    timestamp: 'Regra Permanente',
    badge: {
      label: 'TARIFA ZERO',
      bg: 'rgba(16, 185, 129, 0.22)',
      text: '#34D399',
      border: 'rgba(16, 185, 129, 0.5)'
    },
    source: 'Prefeitura de São Paulo / SPTrans',
    categoryTag: 'Benefícios & Tarifas'
  },
  {
    id: 'guide-bilhete-unico',
    sourceType: 'INFORMATIVOS',
    title: 'Regras do Bilhete Único: Até 4 embarques em ônibus no período de 3 horas',
    subtitle: 'Integração temporal no transporte público municipal',
    description:
      'O Bilhete Único Comum permite a utilização de até 4 ônibus da SPTrans no intervalo de 3 horas pagando uma única tarifa de R$ 4,40. A integração com trilhos tem desconto especial.',
    fullContent:
      'Com o Bilhete Único você economiza em todas as suas viagens na cidade de São Paulo:\n\n• Integração Ônibus + Ônibus: Até 4 embarques em linhas diferentes da SPTrans no período de 3 horas.\n• Integração Ônibus + Metrô/CPTM: Tarifa integrada especial no período de 3 horas.\n• Recarga: Disponível pelo aplicativo oficial, terminais nas estações e pontos credenciados.',
    timestamp: 'Regra Permanente',
    badge: {
      label: 'BILHETE ÚNICO',
      bg: 'rgba(99, 102, 241, 0.22)',
      text: '#A5B4FC',
      border: 'rgba(99, 102, 241, 0.5)'
    },
    source: 'SPTrans Oficial',
    categoryTag: 'Regras de Uso'
  },
  {
    id: 'guide-paulista-aberta',
    sourceType: 'INFORMATIVOS',
    title: 'Avenida Paulista Aberta: Linhas de ônibus com desvios operacionais',
    subtitle: 'Domingos e feriados das 9h às 16h',
    description:
      'Durante o programa Ruas Abertas, as linhas municipais que cruzam a Av. Paulista são desviadas pela Alameda Santos e Rua São Carlos do Pinhal.',
    fullContent:
      'O tráfego de veículos e ônibus permanece interditado na Avenida Paulista entre a Praça Oswaldo Cruz e a Rua da Consolação aos domingos das 9h às 16h.\n\n• Desvio Sentido Paraíso/Centro: Coletivos trafegam pela Alameda Santos.\n• Desvio Sentido Rebouças/Consolação: Coletivos seguem pela Rua São Carlos do Pinhal e Alameda Jaú.\n• Dica: Utilize as estações da Linha 2-Verde do Metrô para travessia rápida.',
    timestamp: 'Regra Permanente',
    badge: {
      label: 'DESVIOS PROGRAMADOS',
      bg: 'var(--bus-violet-soft)',
      text: 'var(--bus-violet)',
      border: 'var(--bus-border-highlight)'
    },
    source: 'CET / SPTrans',
    categoryTag: 'Desvios de Itinerário'
  }
];

/**
 * Busca comunicados oficiais e notícias reais ao vivo no portal da SPTrans
 */
export async function fetchLiveSPTransNews(): Promise<UnifiedNewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('https://www.sptrans.com.br/noticias/', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 1200 } // 20 minutos
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return [];
    }

    const html = await res.text();

    // Extrair links de notícias: <a href="/noticias/slug/">Título</a>
    const newsRegex = /<a\s+href="(\/noticias\/[a-z0-9\-]+\/)"[^>]*>([^<]+)<\/a>/gi;
    const items: UnifiedNewsItem[] = [];
    const seenLinks = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = newsRegex.exec(html)) !== null && items.length < 12) {
      const href = match[1];
      let title = match[2].trim();

      // Limpar entidades HTML
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/\s+/g, ' ');

      if (
        title.length > 15 &&
        !title.toLowerCase().includes('acesso') &&
        !title.toLowerCase().includes('notícias') &&
        !title.toLowerCase().includes('menu') &&
        !seenLinks.has(href)
      ) {
        seenLinks.add(href);

        let categoryTag = 'Operação SPTrans';
        let badgeLabel = 'SPTRANS AO VIVO';
        if (title.toLowerCase().includes('linha') || title.toLowerCase().includes('itinerário')) {
          categoryTag = 'Linhas & Desvios';
          badgeLabel = 'ALTERAÇÃO DE LINHA';
        } else if (title.toLowerCase().includes('jogo') || title.toLowerCase().includes('corrida') || title.toLowerCase().includes('festival') || title.toLowerCase().includes('show')) {
          categoryTag = 'Eventos & Operações';
          badgeLabel = 'EVENTO / ESTÁDIO';
        }

        const fullUrl = `https://www.sptrans.com.br${href}`;

        items.push({
          id: `sptrans-live-${items.length}-${href.replace(/\W/g, '')}`,
          sourceType: 'SPTRANS',
          title,
          subtitle: 'Comunicado Oficial SPTrans',
          description: `Operação e avisos aos usuários do transporte público municipal de São Paulo. Acesse para conferir os detalhes completos da alteração.`,
          fullContent: `${title}\n\n• Fonte Oficial: SPTrans (Secretaria Municipal de Mobilidade e Trânsito de São Paulo)\n• Link do Comunicado na íntegra: ${fullUrl}`,
          timestamp: 'Publicação Oficial',
          badge: {
            label: badgeLabel,
            bg: 'rgba(99, 102, 241, 0.18)',
            text: 'var(--bus-violet)',
            border: 'rgba(99, 102, 241, 0.45)'
          },
          source: 'SPTrans Oficial (sptrans.com.br)',
          categoryTag
        });
      }
    }

    return items;
  } catch (err) {
    console.warn('[newsService] Falha ao extrair notícias da SPTrans:', err);
    return [];
  }
}

/**
 * Retorna o feed completo e unificado de notícias reais da mobilidade de SP
 */
export async function getUnifiedLiveNews(): Promise<UnifiedNewsItem[]> {
  const now = Date.now();
  if (memoryNewsCache && now < memoryNewsCache.expiresAt) {
    return memoryNewsCache.items;
  }

  const [sptransNews, trafficData, railsData] = await Promise.all([
    fetchLiveSPTransNews().catch(() => []),
    getLiveTrafficIncidents().catch(() => ({ incidents: [], summary: { total: 0, accidents: 0, police: 0, construction: 0, jams: 0, hazards: 0 }, lastUpdated: '' })),
    getRailsStatus().catch(() => null)
  ]);

  // Converter incidentes de trânsito em UnifiedNewsItem
  const trafficNews: UnifiedNewsItem[] = trafficData.incidents.map((inc) => {
    let badgeLabel = 'Alerta de Trânsito';
    let badgeBg = 'rgba(245, 158, 11, 0.22)';
    let badgeText = '#FBBF24';
    let badgeBorder = 'rgba(245, 158, 11, 0.5)';

    if (inc.type === 'ACCIDENT') {
      badgeLabel = 'Acidente';
      badgeBg = 'rgba(239, 68, 68, 0.22)';
      badgeText = '#F87171';
      badgeBorder = 'rgba(239, 68, 68, 0.5)';
    } else if (inc.type === 'CONSTRUCTION') {
      badgeLabel = 'Obras na Via';
      badgeBg = 'rgba(249, 115, 22, 0.22)';
      badgeText = '#FB923C';
      badgeBorder = 'rgba(249, 115, 22, 0.5)';
    } else if (inc.type === 'JAM') {
      badgeLabel = 'Lentidão Severa';
      badgeBg = 'rgba(234, 179, 8, 0.22)';
      badgeText = '#FACC15';
      badgeBorder = 'rgba(234, 179, 8, 0.5)';
    }

    return {
      id: inc.id,
      sourceType: 'TRANSITO',
      title: inc.street ? `${inc.street}` : inc.title,
      subtitle: inc.street && inc.title !== inc.street ? inc.title : undefined,
      description: inc.description || 'Intercorrência registrada no tráfego da via com impacto no fluxo de ônibus.',
      fullContent: `Ocorrência registrada na via ${inc.street || inc.title}.\n\n• Impacto: ${inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'Grave retenção e bloqueio parcial de faixas.' : 'Lentidão moderada no trecho.'}\n• Atualização: Monitoramento ativo TomTom / CET São Paulo.`,
      timestamp: inc.updatedAt ? `Hoje às ${inc.updatedAt}` : 'Ao vivo',
      badge: {
        label: badgeLabel,
        bg: badgeBg,
        text: badgeText,
        border: badgeBorder
      },
      severity: inc.severity,
      incidentRef: inc,
      source: `CET / ${inc.source}`,
      categoryTag: 'Trânsito & Vias'
    };
  });

  // Converter status de trilhos em UnifiedNewsItem
  const railNews: UnifiedNewsItem[] = (railsData?.lines || []).map((line) => {
    const isNormal = line.status === 'NORMAL';
    return {
      id: `rail-${line.id}`,
      sourceType: 'TRILHOS',
      title: `${line.name}: ${line.statusText || (isNormal ? 'Operação Normal' : 'Atenção Operacional')}`,
      subtitle: `${line.operator === 'METRO' ? 'Metrô SP' : line.operator === 'VIAMOBILIDADE' ? 'ViaMobilidade' : line.operator === 'VIAQUATRO' ? 'ViaQuatro' : 'CPTM'} · Linha ${line.id}`,
      description:
        line.description ||
        (isNormal
          ? 'Trens circulando com intervalos regulares e fluxo desimpedido em todas as estações.'
          : 'Intervenção operacional registrada para controle de fluxo e segurança dos passageiros.'),
      fullContent: `Situação operacional da ${line.name}:\n\n• Status Atual: ${line.statusText}\n• Operadora: ${line.operator}\n• Detalhes: ${line.description || 'Circulação regular em toda a extensão da linha.'}`,
      timestamp: line.updatedAt || 'Em tempo real',
      badge: {
        label: isNormal ? 'NORMAL' : line.statusText.toUpperCase(),
        bg: isNormal ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.22)',
        text: isNormal ? '#34D399' : '#FBBF24',
        border: isNormal ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)'
      },
      railRef: line,
      source: 'Diretoria de Operações Metrô/CPTM',
      categoryTag: 'Metrô & Trilhos'
    };
  });

  const combinedItems = [...trafficNews, ...sptransNews, ...railNews, ...PERMANENT_MOBILITY_GUIDES];

  memoryNewsCache = {
    items: combinedItems,
    expiresAt: now + 10 * 60 * 1000 // 10 min
  };

  return combinedItems;
}
