import { SPTransLinha, SPTransParada, SPTransVeiculo, SPTransPrevisaoResponse } from '@/types/sptrans';
import { RailLine, RailsResponse } from '@/types/trilhos';

export const MOCK_LINHAS: SPTransLinha[] = [
  // Linha 1703-10 (Jd. Fontális ↔ Shopping Center Norte)
  {
    cl: 1703,
    lc: false,
    lt: "1703",
    tl: 10,
    sl: 1,
    tp: "JD. FONTALIS",
    ts: "SHOPPING CENTER NORTE"
  },
  {
    cl: 1704,
    lc: false,
    lt: "1703",
    tl: 10,
    sl: 2,
    tp: "SHOPPING CENTER NORTE",
    ts: "JD. FONTALIS"
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
    cl: 2001,
    lc: false,
    lt: "8700",
    tl: 10,
    sl: 1,
    tp: "TERM. CAMPO LIMPO",
    ts: "PCA. RAMOS DE AZEVEDO"
  },
  {
    cl: 3001,
    lc: false,
    lt: "6450",
    tl: 10,
    sl: 1,
    tp: "TERM. CAPELINHA",
    ts: "TERM. BANDEIRA"
  }
];

export const MOCK_PARADAS: SPTransParada[] = [
  // Paradas Oficiais Linha 1703-10
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
    np: "TERMINAL JD. FONTÁLIS",
    ed: "R. USHIKICHI KAMIYA, S/N - JD. FONTALIS",
    py: -23.4680,
    px: -46.5820
  },
  {
    cp: 340015354,
    np: "PARADA AV. CONCEIÇÃO, 2500",
    ed: "AV. CONCEICAO, 2500 - VILA PAIVA",
    py: -23.5040,
    px: -46.6060
  },
  {
    cp: 340015339,
    np: "PARADA TRIANON MASP (B/C)",
    ed: "AV. PAULISTA, 1578 - BELA VISTA",
    py: -23.5615,
    px: -46.6559
  }
];

export function getMockVeiculos(codigoLinha: number): SPTransVeiculo[] {
  const time = Date.now() / 1000;
  const drift = (Math.sin(time / 12) * 0.002);
  const drift2 = (Math.cos(time / 15) * 0.002);

  const isSentidoCenterNorte = codigoLinha === 1703 || codigoLinha === 1;
  const destName = isSentidoCenterNorte ? "SHOPPING CENTER NORTE" : "JD. FONTÁLIS";

  const baseCoordinates: Record<number, Array<{ py: number; px: number; prefix: string; accessible: boolean; heading: number; dest: string }>> = {
    1703: [ // Sentido 1: Indo para SHOPPING CENTER NORTE
      { py: -23.5135 + drift, px: -46.6180 + drift2, prefix: "21045", accessible: true, heading: 195, dest: "SHOPPING CENTER NORTE" },
      { py: -23.5010 + drift2, px: -46.6040 + drift, prefix: "21102", accessible: true, heading: 210, dest: "SHOPPING CENTER NORTE" },
      { py: -23.4890 + drift, px: -46.5900 + drift2, prefix: "21230", accessible: true, heading: 200, dest: "SHOPPING CENTER NORTE" },
      { py: -23.4730 + drift2, px: -46.5830 + drift, prefix: "21340", accessible: false, heading: 185, dest: "SHOPPING CENTER NORTE" }
    ],
    1704: [ // Sentido 2: Indo para JD. FONTÁLIS
      { py: -23.4750 + drift, px: -46.5825 + drift2, prefix: "21401", accessible: true, heading: 25, dest: "JD. FONTÁLIS" },
      { py: -23.4940 + drift2, px: -46.5960 + drift, prefix: "21488", accessible: true, heading: 30, dest: "JD. FONTÁLIS" },
      { py: -23.5090 + drift, px: -46.6140 + drift2, prefix: "21550", accessible: true, heading: 15, dest: "JD. FONTÁLIS" }
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
    speed: Math.round(22 + Math.random() * 10),
    destination: item.dest || destName,
    direction: isSentidoCenterNorte ? 1 : 2
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
          lt1: "JD. FONTÁLIS",
          qv: 3,
          vs: [
            {
              p: "21045",
              t: addMinutes(3),
              a: true,
              ta: hrStr,
              py: parada.py + 0.003,
              px: parada.px - 0.004,
              destination: "SHOPPING CENTER NORTE"
            },
            {
              p: "21102",
              t: addMinutes(11),
              a: true,
              ta: hrStr,
              py: parada.py + 0.009,
              px: parada.px - 0.012,
              destination: "SHOPPING CENTER NORTE"
            },
            {
              p: "21230",
              t: addMinutes(22),
              a: true,
              ta: hrStr,
              py: parada.py + 0.018,
              px: parada.px - 0.024,
              destination: "SHOPPING CENTER NORTE"
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
