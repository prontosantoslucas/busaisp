import { SPTransLinha, SPTransParada, SPTransVeiculo, SPTransPrevisaoResponse } from '@/types/sptrans';
import { RailLine, RailsResponse } from '@/types/trilhos';

export const MOCK_LINHAS: SPTransLinha[] = [
  {
    cl: 1001,
    lc: false,
    lt: "8000",
    tl: 10,
    sl: 1,
    tp: "TERM. LAPA",
    ts: "PCA. RAMOS DE AZEVEDO"
  },
  {
    cl: 1002,
    lc: false,
    lt: "8000",
    tl: 10,
    sl: 2,
    tp: "PCA. RAMOS DE AZEVEDO",
    ts: "TERM. LAPA"
  },
  {
    cl: 2001,
    lc: false,
    lt: "8700",
    tl: 10,
    sl: 1,
    tp: "TERM. CAMPO LIMPO",
    ts: "PCA. RAMOS DE AZEVEDO"
  },
  {
    cl: 2002,
    lc: false,
    lt: "8700",
    tl: 10,
    sl: 2,
    tp: "PCA. RAMOS DE AZEVEDO",
    ts: "TERM. CAMPO LIMPO"
  },
  {
    cl: 3001,
    lc: false,
    lt: "6450",
    tl: 10,
    sl: 1,
    tp: "TERM. CAPELINHA",
    ts: "TERM. BANDEIRA"
  },
  {
    cl: 4001,
    lc: false,
    lt: "702U",
    tl: 10,
    sl: 1,
    tp: "CIDADE UNIVERSITARIA (USP)",
    ts: "TERM. PQ. D. PEDRO II"
  },
  {
    cl: 5001,
    lc: false,
    lt: "917H",
    tl: 10,
    sl: 1,
    tp: "TERM. PIRITUBA",
    ts: "METRO VILA MARIANA"
  },
  {
    cl: 6001,
    lc: false,
    lt: "107T",
    tl: 10,
    sl: 1,
    tp: "METRO TUCURUVI",
    ts: "TERM. PINHEIROS"
  },
  {
    cl: 7001,
    lc: false,
    lt: "856R",
    tl: 10,
    sl: 1,
    tp: "LAPA",
    ts: "SOCORRO"
  }
];

export const MOCK_PARADAS: SPTransParada[] = [
  {
    cp: 340015339,
    np: "PARADA TRIANON MASP (B/C)",
    ed: "AV. PAULISTA, 1578 - BELA VISTA",
    py: -23.5615,
    px: -46.6559
  },
  {
    cp: 340015340,
    np: "PARADA BRIGADEIRO (B/C)",
    ed: "AV. PAULISTA, 664 - BELA VISTA",
    py: -23.5701,
    px: -46.6450
  },
  {
    cp: 340015341,
    np: "PARADA CONSOLAÇÃO (B/C)",
    ed: "AV. PAULISTA, 2181 - CERQUEIRA CESAR",
    py: -23.5574,
    px: -46.6625
  },
  {
    cp: 340015342,
    np: "PARADA FARIA LIMA (C/B)",
    ed: "AV. BRIG. FARIA LIMA, 1800 - PINHEIROS",
    py: -23.5742,
    px: -46.6895
  },
  {
    cp: 340015343,
    np: "TERMINAL BANDEIRA - PLATAFORMA A",
    ed: "PCA DA BANDEIRA, S/N - CENTRO",
    py: -23.5492,
    px: -46.6402
  },
  {
    cp: 340015344,
    np: "PARADA HOSPITAL DAS CLÍNICAS",
    ed: "AV. DR. ARNALDO, 455 - CERQUEIRA CESAR",
    py: -23.5552,
    px: -46.6711
  },
  {
    cp: 340015345,
    np: "PARADA REBOUÇAS / OSCAR FREIRE",
    ed: "AV. REBOUÇAS, 1020 - PINHEIROS",
    py: -23.5638,
    px: -46.6765
  }
];

// Helper to generate dynamic moving bus positions along real SP coordinates
export function getMockVeiculos(codigoLinha: number): SPTransVeiculo[] {
  const time = Date.now() / 1000;
  // Offset slight movement based on time
  const drift = (Math.sin(time / 20) * 0.003);
  const drift2 = (Math.cos(time / 25) * 0.003);

  const baseCoordinates: Record<number, Array<{ py: number; px: number; prefix: string; accessible: boolean; heading: number }>> = {
    1001: [ // 8000-10 Lapa
      { py: -23.5250 + drift, px: -46.6980 + drift2, prefix: "81023", accessible: true, heading: 110 },
      { py: -23.5380 + drift2, px: -46.6750 + drift, prefix: "81045", accessible: true, heading: 125 },
      { py: -23.5450 + drift, px: -46.6550 + drift2, prefix: "81102", accessible: false, heading: 95 },
      { py: -23.5470 + drift2, px: -46.6380 + drift, prefix: "81210", accessible: true, heading: 85 }
    ],
    2001: [ // 8700-10 Campo Limpo
      { py: -23.5780 + drift, px: -46.6920 + drift2, prefix: "72101", accessible: true, heading: 45 },
      { py: -23.5640 + drift2, px: -46.6770 + drift, prefix: "72144", accessible: true, heading: 50 },
      { py: -23.5560 + drift, px: -46.6610 + drift2, prefix: "72288", accessible: true, heading: 60 },
      { py: -23.5480 + drift2, px: -46.6430 + drift, prefix: "72305", accessible: false, heading: 30 }
    ],
    3001: [ // 6450-10 Capelinha / Bandeira
      { py: -23.6450 + drift, px: -46.7400 + drift2, prefix: "63012", accessible: true, heading: 25 },
      { py: -23.6050 + drift2, px: -46.6950 + drift, prefix: "63155", accessible: true, heading: 35 },
      { py: -23.5680 + drift, px: -46.6500 + drift2, prefix: "63200", accessible: true, heading: 15 },
      { py: -23.5500 + drift2, px: -46.6410 + drift, prefix: "63340", accessible: false, heading: 10 }
    ],
    4001: [ // 702U-10 USP / Pq D Pedro
      { py: -23.5610 + drift, px: -46.7280 + drift2, prefix: "71010", accessible: true, heading: 85 },
      { py: -23.5640 + drift2, px: -46.6850 + drift, prefix: "71025", accessible: true, heading: 75 },
      { py: -23.5590 + drift, px: -46.6630 + drift2, prefix: "71089", accessible: true, heading: 90 },
      { py: -23.5470 + drift2, px: -46.6320 + drift, prefix: "71150", accessible: true, heading: 95 }
    ],
    5001: [ // 917H Pirituba / Vila Mariana
      { py: -23.5615 + drift, px: -46.6559 + drift2, prefix: "91001", accessible: true, heading: 135 },
      { py: -23.5780 + drift2, px: -46.6410 + drift, prefix: "91024", accessible: true, heading: 140 },
      { py: -23.5900 + drift, px: -46.6380 + drift2, prefix: "91090", accessible: false, heading: 155 }
    ]
  };

  const selected = baseCoordinates[codigoLinha] || [
    { py: -23.5615 + drift, px: -46.6559 + drift2, prefix: "55012", accessible: true, heading: 90 },
    { py: -23.5574 + drift2, px: -46.6625 + drift, prefix: "55034", accessible: true, heading: 110 }
  ];

  const now = new Date();
  const timeStr = now.toISOString();

  return selected.map((item, idx) => ({
    p: item.prefix,
    a: item.accessible,
    ta: timeStr,
    py: item.py,
    px: item.px,
    heading: (item.heading + idx * 5) % 360,
    speed: Math.round(18 + Math.random() * 15)
  }));
}

export function getMockPrevisaoParada(codigoParada: number): SPTransPrevisaoResponse {
  const parada = MOCK_PARADAS.find(p => p.cp === codigoParada) || MOCK_PARADAS[0];
  const now = new Date();
  const hrStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const addMinutes = (mins: number) => {
    const d = new Date(now.getTime() + mins * 60000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return {
    hr: hrStr,
    p: {
      cp: parada.cp,
      np: parada.np,
      py: parada.py,
      px: parada.px,
      l: [
        {
          cl: 1001,
          c: "8000-10",
          sl: 1,
          lt0: "PCA. RAMOS DE AZEVEDO",
          lt1: "TERM. LAPA",
          qv: 2,
          vs: [
            {
              p: "81045",
              t: addMinutes(4),
              a: true,
              ta: hrStr,
              py: parada.py + 0.004,
              px: parada.px - 0.005
            },
            {
              p: "81023",
              t: addMinutes(14),
              a: true,
              ta: hrStr,
              py: parada.py + 0.012,
              px: parada.px - 0.015
            }
          ]
        },
        {
          cl: 2001,
          c: "8700-10",
          sl: 1,
          lt0: "PCA. RAMOS DE AZEVEDO",
          lt1: "TERM. CAMPO LIMPO",
          qv: 2,
          vs: [
            {
              p: "72144",
              t: addMinutes(7),
              a: true,
              ta: hrStr,
              py: parada.py + 0.006,
              px: parada.px - 0.008
            },
            {
              p: "72101",
              t: addMinutes(19),
              a: false,
              ta: hrStr,
              py: parada.py + 0.018,
              px: parada.px - 0.022
            }
          ]
        },
        {
          cl: 5001,
          c: "917H-10",
          sl: 1,
          lt0: "METRO VILA MARIANA",
          lt1: "TERM. PIRITUBA",
          qv: 1,
          vs: [
            {
              p: "91001",
              t: addMinutes(11),
              a: true,
              ta: hrStr,
              py: parada.py - 0.008,
              px: parada.px + 0.010
            }
          ]
        }
      ]
    }
  };
}

export const MOCK_RAIL_LINES: RailLine[] = [
  {
    id: "1",
    number: "1",
    name: "Linha 1 - Azul",
    colorName: "Azul",
    hexColor: "#003399",
    operator: "METRO",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Circulação de trens nos intervalos normais entre Jabaquara e Tucuruvi.",
    updatedAt: "Agora"
  },
  {
    id: "2",
    number: "2",
    name: "Linha 2 - Verde",
    colorName: "Verde",
    hexColor: "#008053",
    operator: "METRO",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Circulação regular entre Vila Madalena e Vila Prudente.",
    updatedAt: "Agora"
  },
  {
    id: "3",
    number: "3",
    name: "Linha 3 - Vermelha",
    colorName: "Vermelha",
    hexColor: "#EE1D23",
    operator: "METRO",
    status: "VELOCIDADE_REDUZIDA",
    statusText: "Velocidade Reduzida",
    description: "Maior tempo de parada nas estações devido a grande fluxo de passageiros.",
    updatedAt: "Há 4 min"
  },
  {
    id: "4",
    number: "4",
    name: "Linha 4 - Amarela",
    colorName: "Amarela",
    hexColor: "#FFF000",
    operator: "VIAQUATRO",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Trens sem condutor operando com intervalo médio de 110 segundos.",
    updatedAt: "Agora"
  },
  {
    id: "5",
    number: "5",
    name: "Linha 5 - Lilás",
    colorName: "Lilás",
    hexColor: "#9B388D",
    operator: "VIAMOBILIDADE",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Operação regular entre Capão Redondo e Chácara Klabin.",
    updatedAt: "Agora"
  },
  {
    id: "7",
    number: "7",
    name: "Linha 7 - Rubi",
    colorName: "Rubi",
    hexColor: "#A61358",
    operator: "CPTM",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Trens circulando com velocidade normal no Serviço 710.",
    updatedAt: "Agora"
  },
  {
    id: "8",
    number: "8",
    name: "Linha 8 - Diamante",
    colorName: "Diamante",
    hexColor: "#808080",
    operator: "VIAMOBILIDADE",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Circulação normal entre Júlio Prestes e Itapevi.",
    updatedAt: "Agora"
  },
  {
    id: "9",
    number: "9",
    name: "Linha 9 - Esmeralda",
    colorName: "Esmeralda",
    hexColor: "#009496",
    operator: "VIAMOBILIDADE",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Circulação regular entre Osasco e Bruno Covas/Mendes-Vila Natal.",
    updatedAt: "Agora"
  },
  {
    id: "10",
    number: "10",
    name: "Linha 10 - Turquesa",
    colorName: "Turquesa",
    hexColor: "#007C8F",
    operator: "CPTM",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Trens operando normalmente no Serviço 710 até Rio Grande da Serra.",
    updatedAt: "Agora"
  },
  {
    id: "11",
    number: "11",
    name: "Linha 11 - Coral",
    colorName: "Coral",
    hexColor: "#F04E23",
    operator: "CPTM",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Expresso Leste operando normalmente entre Luz e Estudantes.",
    updatedAt: "Agora"
  },
  {
    id: "12",
    number: "12",
    name: "Linha 12 - Safira",
    colorName: "Safira",
    hexColor: "#1C357E",
    operator: "CPTM",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Circulação normal entre Brás e Calmon Viana.",
    updatedAt: "Agora"
  },
  {
    id: "13",
    number: "13",
    name: "Linha 13 - Jade",
    colorName: "Jade",
    hexColor: "#00A859",
    operator: "CPTM",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Trens para o Aeroporto de Guarulhos operando pontualmente.",
    updatedAt: "Agora"
  },
  {
    id: "15",
    number: "15",
    name: "Linha 15 - Prata",
    colorName: "Prata",
    hexColor: "#A7A8AA",
    operator: "METRO",
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Monotrilho operando normalmente entre Vila Prudente e Jardim Colonial.",
    updatedAt: "Agora"
  }
];

export function getMockRailsResponse(): RailsResponse {
  const issues = MOCK_RAIL_LINES.filter(l => l.status !== 'NORMAL').length;
  return {
    lines: MOCK_RAIL_LINES,
    summary: {
      total: MOCK_RAIL_LINES.length,
      normal: MOCK_RAIL_LINES.length - issues,
      withIssues: issues
    },
    lastChecked: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    source: "Direto dos Trens / CCM SP"
  };
}
