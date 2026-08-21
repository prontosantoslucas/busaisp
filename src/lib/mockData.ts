import { SPTransLinha, SPTransParada, SPTransVeiculo, SPTransPrevisaoResponse } from '@/types/sptrans';
import { RailLine, RailsResponse } from '@/types/trilhos';

// Catálogo expandido de Linhas Oficiais da SPTrans
export const MOCK_LINHAS: SPTransLinha[] = [
  // Zona Norte (Sambaíba / Consórcio Transnoroeste)
  {
    cl: 1703,
    lc: false,
    lt: "1703",
    tl: 10,
    sl: 1,
    tp: "JD. HEBRON",
    ts: "SHOPPING CENTER NORTE"
  },
  {
    cl: 1704,
    lc: false,
    lt: "1703",
    tl: 10,
    sl: 2,
    tp: "SHOPPING CENTER NORTE",
    ts: "JD. HEBRON"
  },
  {
    cl: 1721,
    lc: false,
    lt: "172N",
    tl: 10,
    sl: 1,
    tp: "SHOPPING CENTER NORTE",
    ts: "METRO SANTANA"
  },
  {
    cl: 1750,
    lc: false,
    lt: "175T",
    tl: 10,
    sl: 1,
    tp: "METRO SANTANA",
    ts: "METRO JABAQUARA"
  },
  {
    cl: 1060,
    lc: false,
    lt: "106A",
    tl: 10,
    sl: 1,
    tp: "METRO SANTANA",
    ts: "ITAIM BIBI"
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
    cl: 1770,
    lc: false,
    lt: "177H",
    tl: 10,
    sl: 1,
    tp: "METRO SANTANA",
    ts: "CIDADE UNIVERSITARIA (USP)"
  },
  {
    cl: 2104,
    lc: false,
    lt: "2104",
    tl: 10,
    sl: 1,
    tp: "METRO SANTANA",
    ts: "TERM. PQ. D. PEDRO II"
  },

  // Zona Oeste / Centro / Sul
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
    cl: 7001,
    lc: false,
    lt: "856R",
    tl: 10,
    sl: 1,
    tp: "LAPA",
    ts: "SOCORRO"
  },

  // Zona Leste
  {
    cl: 2081,
    lc: false,
    lt: "208V",
    tl: 10,
    sl: 1,
    tp: "TERM. A. E. CARVALHO",
    ts: "TERM. PQ. D. PEDRO II"
  },
  {
    cl: 3301,
    lc: false,
    lt: "3301",
    tl: 10,
    sl: 1,
    tp: "TERM. SAO MATEUS",
    ts: "TERM. PQ. D. PEDRO II"
  }
];

export const MOCK_PARADAS: SPTransParada[] = [
  // Paradas Linha 1703-10
  {
    cp: 340015350,
    np: "PARADA SHOPPING CENTER NORTE",
    ed: "AV. OTTO BAUMGART, 500 - VILA GUILHERME",
    py: -23.5152,
    px: -46.6190
  },
  {
    cp: 340015351,
    np: "PARADA AV. JARDIM JAPÃO, 1200",
    ed: "AV. JARDIM JAPAO, 1200 - JD. BRASIL",
    py: -23.4930,
    px: -46.5920
  },
  {
    cp: 340015352,
    np: "PARADA AV. ROLAND GARROS, 850",
    ed: "AV. ROLAND GARROS, 850 - JD. BRASIL",
    py: -23.4855,
    px: -46.5860
  },
  {
    cp: 340015353,
    np: "TERMINAL JD. HEBRON",
    ed: "R. DAS VERBENAS, 12 - JD. HEBRON",
    py: -23.4760,
    px: -46.5790
  },
  {
    cp: 340015354,
    np: "PARADA AV. CONCEIÇÃO, 2500",
    ed: "AV. CONCEICAO, 2500 - VILA PAIVA",
    py: -23.5040,
    px: -46.6060
  },

  // Paradas Zona Sul / Paulista / Centro
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
  }
];

export function getMockVeiculos(codigoLinha: number): SPTransVeiculo[] {
  const time = Date.now() / 1000;
  const drift = (Math.sin(time / 12) * 0.002);
  const drift2 = (Math.cos(time / 15) * 0.002);

  const baseCoordinates: Record<number, Array<{ py: number; px: number; prefix: string; accessible: boolean; heading: number }>> = {
    1703: [ // 1703-10 Jd. Hebron ➡️ Shopping Center Norte
      { py: -23.5140 + drift, px: -46.6185 + drift2, prefix: "21045", accessible: true, heading: 195 },
      { py: -23.5020 + drift2, px: -46.6050 + drift, prefix: "21102", accessible: true, heading: 210 },
      { py: -23.4910 + drift, px: -46.5910 + drift2, prefix: "21230", accessible: true, heading: 200 },
      { py: -23.4790 + drift2, px: -46.5810 + drift, prefix: "21340", accessible: false, heading: 185 }
    ],
    1704: [ // 1703-10 Shopping Center Norte ➡️ Jd. Hebron
      { py: -23.4810 + drift, px: -46.5820 + drift2, prefix: "21401", accessible: true, heading: 25 },
      { py: -23.4950 + drift2, px: -46.5970 + drift, prefix: "21488", accessible: true, heading: 30 },
      { py: -23.5100 + drift, px: -46.6150 + drift2, prefix: "21550", accessible: true, heading: 15 }
    ],
    1721: [ // 172N Center Norte / Santana
      { py: -23.5080 + drift, px: -46.6210 + drift2, prefix: "22010", accessible: true, heading: 270 },
      { py: -23.5020 + drift2, px: -46.6260 + drift, prefix: "22045", accessible: true, heading: 280 }
    ],
    1001: [
      { py: -23.5250 + drift, px: -46.6980 + drift2, prefix: "81023", accessible: true, heading: 110 },
      { py: -23.5380 + drift2, px: -46.6750 + drift, prefix: "81045", accessible: true, heading: 125 }
    ]
  };

  const selected = baseCoordinates[codigoLinha] || baseCoordinates[1703];
  const now = new Date();
  const timeStr = now.toISOString();

  return selected.map((item, idx) => ({
    p: item.prefix,
    a: item.accessible,
    ta: timeStr,
    py: item.py,
    px: item.px,
    heading: (item.heading + idx * 5) % 360,
    speed: Math.round(22 + Math.random() * 10)
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
          cl: 1703,
          c: "1703-10",
          sl: 1,
          lt0: "SHOPPING CENTER NORTE",
          lt1: "JD. HEBRON",
          qv: 3,
          vs: [
            {
              p: "21045",
              t: addMinutes(4),
              a: true,
              ta: hrStr,
              py: parada.py + 0.003,
              px: parada.px - 0.004
            },
            {
              p: "21102",
              t: addMinutes(12),
              a: true,
              ta: hrStr,
              py: parada.py + 0.009,
              px: parada.px - 0.012
            },
            {
              p: "21230",
              t: addMinutes(24),
              a: true,
              ta: hrStr,
              py: parada.py + 0.018,
              px: parada.px - 0.024
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
    status: "NORMAL",
    statusText: "Operação Normal",
    description: "Circulação regular entre Barra Funda e Itaquera.",
    updatedAt: "Agora"
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
    description: "Trens sem condutor operando normalmente.",
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
    description: "Serviço 710 operando normalmente.",
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
    description: "Circulação normal entre Osasco e Mendes-Vila Natal.",
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
    description: "Serviço 710 operando normalmente.",
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
    description: "Expresso Leste operando normalmente.",
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
    description: "Monotrilho operando normalmente.",
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
    source: "CCM SP / Metrô e CPTM"
  };
}
