export interface StationItem {
  id: string;
  name: string;
  type: 'METRO' | 'CPTM' | 'TERMINAL_BUS';
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  lines: { code: string; name: string; color: string }[];
  connections?: string[];
  isAccessible?: boolean;
}

export const SP_ALL_STATIONS: StationItem[] = [
  // ================= METRÔ LINHA 1 - AZUL =================
  {
    id: 'metro_tucuruvi',
    name: 'Estação Tucuruvi',
    type: 'METRO',
    address: 'Av. Dr. Antônio Maria Laet, 100',
    neighborhood: 'Tucuruvi, Zona Norte',
    lat: -23.4798,
    lng: -46.6033,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    connections: ['Terminal de Ônibus Tucuruvi (SPTrans/EMTU)'],
    isAccessible: true
  },
  {
    id: 'metro_parada_inglesa',
    name: 'Estação Parada Inglesa',
    type: 'METRO',
    address: 'Av. Luiz Dumont Villares, 2333',
    neighborhood: 'Parada Inglesa, Zona Norte',
    lat: -23.4883,
    lng: -46.6094,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_jardim_sao_paulo',
    name: 'Estação Jardim São Paulo - Ayrton Senna',
    type: 'METRO',
    address: 'Praça San Petro, 10',
    neighborhood: 'Jardim São Paulo, Zona Norte',
    lat: -23.4925,
    lng: -46.6167,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_santana',
    name: 'Estação Santana',
    type: 'METRO',
    address: 'Av. Cruzeiro do Sul, 3173',
    neighborhood: 'Santana, Zona Norte',
    lat: -23.5029,
    lng: -46.6247,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    connections: ['Terminal de Ônibus Santana (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_carandiru',
    name: 'Estação Carandiru',
    type: 'METRO',
    address: 'Av. Cruzeiro do Sul, 2487',
    neighborhood: 'Carandiru, Zona Norte',
    lat: -23.5097,
    lng: -46.6251,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_portuguesa_tiete',
    name: 'Estação Portuguesa-Tietê',
    type: 'METRO',
    address: 'Av. Cruzeiro do Sul, 1777',
    neighborhood: 'Canindé / Santana, Zona Norte',
    lat: -23.5163,
    lng: -46.6253,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    connections: ['Terminal Rodoviário Tietê'],
    isAccessible: true
  },
  {
    id: 'metro_armenia',
    name: 'Estação Armênia',
    type: 'METRO',
    address: 'Praça Armênia, 100',
    neighborhood: 'Bom Retiro, Centro',
    lat: -23.5255,
    lng: -46.6293,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_tiradentes',
    name: 'Estação Tiradentes',
    type: 'METRO',
    address: 'Av. Tiradentes, 551',
    neighborhood: 'Bom Retiro, Centro',
    lat: -23.5309,
    lng: -46.6315,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_luz',
    name: 'Estação Luz',
    type: 'METRO',
    address: 'Praça da Luz, 1',
    neighborhood: 'Luz / Bom Retiro, Centro',
    lat: -23.5365,
    lng: -46.6343,
    lines: [
      { code: 'L1', name: '1-Azul', color: '#003399' },
      { code: 'L4', name: '4-Amarela', color: '#FFF000' },
      { code: 'L7', name: '7-Rubi', color: '#A61327' },
      { code: 'L11', name: '11-Coral', color: '#F04E23' }
    ],
    connections: ['CPTM Linha 7-Rubi', 'CPTM Linha 11-Coral', 'Metrô 4-Amarela'],
    isAccessible: true
  },
  {
    id: 'metro_sao_bento',
    name: 'Estação São Bento',
    type: 'METRO',
    address: 'Largo São Bento, 109',
    neighborhood: 'Centro Histórico',
    lat: -23.5445,
    lng: -46.6341,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_se',
    name: 'Estação Sé',
    type: 'METRO',
    address: 'Praça da Sé, s/n',
    neighborhood: 'Sé, Centro Histórico',
    lat: -23.5503,
    lng: -46.6339,
    lines: [
      { code: 'L1', name: '1-Azul', color: '#003399' },
      { code: 'L3', name: '3-Vermelha', color: '#EE1D23' }
    ],
    connections: ['Metrô Linha 3-Vermelha'],
    isAccessible: true
  },
  {
    id: 'metro_paraíso',
    name: 'Estação Paraíso',
    type: 'METRO',
    address: 'R. Vergueiro, 1456',
    neighborhood: 'Paraíso, Centro-Sul',
    lat: -23.5756,
    lng: -46.6406,
    lines: [
      { code: 'L1', name: '1-Azul', color: '#003399' },
      { code: 'L2', name: '2-Verde', color: '#00823B' }
    ],
    connections: ['Metrô Linha 2-Verde'],
    isAccessible: true
  },
  {
    id: 'metro_ana_rosa',
    name: 'Estação Ana Rosa',
    type: 'METRO',
    address: 'Largo Dona Ana Rosa, 100',
    neighborhood: 'Vila Mariana, Zona Sul',
    lat: -23.5818,
    lng: -46.6384,
    lines: [
      { code: 'L1', name: '1-Azul', color: '#003399' },
      { code: 'L2', name: '2-Verde', color: '#00823B' }
    ],
    connections: ['Metrô Linha 2-Verde', 'Terminal Ana Rosa (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_jabaquara',
    name: 'Estação Jabaquara',
    type: 'METRO',
    address: 'R. dos Jequitibás, 80',
    neighborhood: 'Jabaquara, Zona Sul',
    lat: -23.6465,
    lng: -46.6416,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    connections: ['Terminal Rodoviário Jabaquara', 'Corredor Metropolitano EMTU'],
    isAccessible: true
  },

  // ================= METRÔ LINHA 2 - VERDE =================
  {
    id: 'metro_vila_madalena',
    name: 'Estação Vila Madalena',
    type: 'METRO',
    address: 'Praça Américo Jacomino, 30',
    neighborhood: 'Vila Madalena, Zona Oeste',
    lat: -23.5463,
    lng: -46.6908,
    lines: [{ code: 'L2', name: '2-Verde', color: '#00823B' }],
    connections: ['Terminal Vila Madalena (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_clinicas',
    name: 'Estação Clínicas',
    type: 'METRO',
    address: 'Av. Dr. Arnaldo, 555',
    neighborhood: 'Cerqueira César, Centro',
    lat: -23.5538,
    lng: -46.6710,
    lines: [{ code: 'L2', name: '2-Verde', color: '#00823B' }],
    connections: ['Complexo Hospital das Clínicas (FMUSP)'],
    isAccessible: true
  },
  {
    id: 'metro_consolacao',
    name: 'Estação Consolação',
    type: 'METRO',
    address: 'Av. Paulista, 2163',
    neighborhood: 'Bela Vista / Consolação',
    lat: -23.5583,
    lng: -46.6601,
    lines: [
      { code: 'L2', name: '2-Verde', color: '#00823B' },
      { code: 'L4', name: '4-Amarela', color: '#FFF000' }
    ],
    connections: ['Metrô Linha 4-Amarela (Estação Paulista)'],
    isAccessible: true
  },
  {
    id: 'metro_trianon_masp',
    name: 'Estação Trianon-Masp',
    type: 'METRO',
    address: 'Av. Paulista, 1485',
    neighborhood: 'Bela Vista / Jardim Paulista',
    lat: -23.5634,
    lng: -46.6543,
    lines: [{ code: 'L2', name: '2-Verde', color: '#00823B' }],
    isAccessible: true
  },
  {
    id: 'metro_brigadeiro',
    name: 'Estação Brigadeiro',
    type: 'METRO',
    address: 'Av. Paulista, 447',
    neighborhood: 'Bela Vista / Paraíso',
    lat: -23.5694,
    lng: -46.6475,
    lines: [{ code: 'L2', name: '2-Verde', color: '#00823B' }],
    isAccessible: true
  },
  {
    id: 'metro_tamanduatei',
    name: 'Estação Tamanduateí',
    type: 'METRO',
    address: 'Av. Presidente Wilson, 4841',
    neighborhood: 'Ipiranga, Zona Sul',
    lat: -23.5932,
    lng: -46.5898,
    lines: [
      { code: 'L2', name: '2-Verde', color: '#00823B' },
      { code: 'L10', name: '10-Turquesa', color: '#007C92' }
    ],
    connections: ['CPTM Linha 10-Turquesa'],
    isAccessible: true
  },
  {
    id: 'metro_vila_prudente',
    name: 'Estação Vila Prudente',
    type: 'METRO',
    address: 'Av. Professor Luiz Ignácio de Anhaia Mello, 1359',
    neighborhood: 'Vila Prudente, Zona Leste',
    lat: -23.5857,
    lng: -46.5822,
    lines: [
      { code: 'L2', name: '2-Verde', color: '#00823B' },
      { code: 'L15', name: '15-Prata', color: '#A7A8AA' }
    ],
    connections: ['Monotrilho Linha 15-Prata', 'Terminal Vila Prudente (SPTrans)'],
    isAccessible: true
  },

  // ================= METRÔ LINHA 3 - VERMELHA =================
  {
    id: 'metro_palmeiras_barra_funda',
    name: 'Estação Palmeiras-Barra Funda',
    type: 'METRO',
    address: 'R. Bento Teobaldo Ferraz, 119',
    neighborhood: 'Barra Funda, Zona Oeste',
    lat: -23.5259,
    lng: -46.6669,
    lines: [
      { code: 'L3', name: '3-Vermelha', color: '#EE1D23' },
      { code: 'L7', name: '7-Rubi', color: '#A61327' },
      { code: 'L8', name: '8-Diamante', color: '#97824B' }
    ],
    connections: ['CPTM Linha 7-Rubi', 'ViaMobilidade Linha 8-Diamante', 'Terminal Rodoviário Barra Funda'],
    isAccessible: true
  },
  {
    id: 'metro_republica',
    name: 'Estação República',
    type: 'METRO',
    address: 'Praça da República, 299',
    neighborhood: 'República, Centro',
    lat: -23.5435,
    lng: -46.6428,
    lines: [
      { code: 'L3', name: '3-Vermelha', color: '#EE1D23' },
      { code: 'L4', name: '4-Amarela', color: '#FFF000' }
    ],
    connections: ['Metrô Linha 4-Amarela'],
    isAccessible: true
  },
  {
    id: 'metro_bras',
    name: 'Estação Brás',
    type: 'METRO',
    address: 'Praça Agente Cícero, s/n',
    neighborhood: 'Brás, Centro-Leste',
    lat: -23.5478,
    lng: -46.6165,
    lines: [
      { code: 'L3', name: '3-Vermelha', color: '#EE1D23' },
      { code: 'L10', name: '10-Turquesa', color: '#007C92' },
      { code: 'L11', name: '11-Coral', color: '#F04E23' },
      { code: 'L12', name: '12-Safira', color: '#133965' }
    ],
    connections: ['CPTM Linhas 10, 11 e 12'],
    isAccessible: true
  },
  {
    id: 'metro_tatuape',
    name: 'Estação Tatuapé',
    type: 'METRO',
    address: 'R. Melo Freire, s/n',
    neighborhood: 'Tatuapé, Zona Leste',
    lat: -23.5404,
    lng: -46.5768,
    lines: [
      { code: 'L3', name: '3-Vermelha', color: '#EE1D23' },
      { code: 'L11', name: '11-Coral', color: '#F04E23' },
      { code: 'L12', name: '12-Safira', color: '#133965' }
    ],
    connections: ['CPTM Linhas 11 e 12', 'Shopping Metrô Tatuapé'],
    isAccessible: true
  },
  {
    id: 'metro_itaquera',
    name: 'Estação Corinthians-Itaquera',
    type: 'METRO',
    address: 'Av. Projetada, 1900',
    neighborhood: 'Itaquera, Zona Leste',
    lat: -23.5422,
    lng: -46.4710,
    lines: [
      { code: 'L3', name: '3-Vermelha', color: '#EE1D23' },
      { code: 'L11', name: '11-Coral', color: '#F04E23' }
    ],
    connections: ['CPTM Linha 11-Coral', 'Terminal Urbano Itaquera', 'Neo Química Arena'],
    isAccessible: true
  },

  // ================= METRÔ LINHA 4 - AMARELA (VIAQUATRO) =================
  {
    id: 'metro_paulista',
    name: 'Estação Paulista',
    type: 'METRO',
    address: 'R. da Consolação, 2367',
    neighborhood: 'Consolação / Bela Vista',
    lat: -23.5552,
    lng: -46.6622,
    lines: [
      { code: 'L4', name: '4-Amarela', color: '#FFF000' },
      { code: 'L2', name: '2-Verde', color: '#00823B' }
    ],
    connections: ['Metrô Linha 2-Verde (Estação Consolação)'],
    isAccessible: true
  },
  {
    id: 'metro_faria_lima',
    name: 'Estação Faria Lima',
    type: 'METRO',
    address: 'Av. Brigadeiro Faria Lima, 955',
    neighborhood: 'Pinheiros, Zona Oeste',
    lat: -23.5670,
    lng: -46.6937,
    lines: [{ code: 'L4', name: '4-Amarela', color: '#FFF000' }],
    isAccessible: true
  },
  {
    id: 'metro_pinheiros',
    name: 'Estação Pinheiros',
    type: 'METRO',
    address: 'R. Capri, 145',
    neighborhood: 'Pinheiros, Zona Oeste',
    lat: -23.5663,
    lng: -46.7028,
    lines: [
      { code: 'L4', name: '4-Amarela', color: '#FFF000' },
      { code: 'L9', name: '9-Esmeralda', color: '#009496' }
    ],
    connections: ['ViaMobilidade Linha 9-Esmeralda', 'Terminal Pinheiros (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_morumbi',
    name: 'Estação São Paulo-Morumbi',
    type: 'METRO',
    address: 'Av. Deputado Jacob Salvador Zveibil, 50',
    neighborhood: 'Morumbi / Caxingui, Zona Oeste',
    lat: -23.5866,
    lng: -46.7237,
    lines: [{ code: 'L4', name: '4-Amarela', color: '#FFF000' }],
    connections: ['Terminal Urbano Morumbi (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_vila_sonia',
    name: 'Estação Vila Sônia',
    type: 'METRO',
    address: 'Av. Professor Francisco Morato, 4001',
    neighborhood: 'Vila Sônia, Zona Oeste',
    lat: -23.5931,
    lng: -46.7388,
    lines: [{ code: 'L4', name: '4-Amarela', color: '#FFF000' }],
    connections: ['Terminal Vila Sônia (SPTrans / EMTU)'],
    isAccessible: true
  },

  // ================= METRÔ LINHA 5 - LILÁS (VIAMOBILIDADE) =================
  {
    id: 'metro_santa_cruz',
    name: 'Estação Santa Cruz',
    type: 'METRO',
    address: 'R. Domingos de Morais, 2564',
    neighborhood: 'Vila Mariana, Zona Sul',
    lat: -23.5989,
    lng: -46.6366,
    lines: [
      { code: 'L1', name: '1-Azul', color: '#003399' },
      { code: 'L5', name: '5-Lilás', color: '#784384' }
    ],
    connections: ['Metrô Linha 1-Azul', 'Shopping Metrô Santa Cruz'],
    isAccessible: true
  },
  {
    id: 'metro_chacara_klabin',
    name: 'Estação Chácara Klabin',
    type: 'METRO',
    address: 'R. Vergueiro, 3800',
    neighborhood: 'Vila Mariana / Chácara Klabin',
    lat: -23.5928,
    lng: -46.6297,
    lines: [
      { code: 'L2', name: '2-Verde', color: '#00823B' },
      { code: 'L5', name: '5-Lilás', color: '#784384' }
    ],
    connections: ['Metrô Linha 2-Verde'],
    isAccessible: true
  },
  {
    id: 'metro_santo_amaro',
    name: 'Estação Santo Amaro',
    type: 'METRO',
    address: 'Av. Guido Caloi, 2221',
    neighborhood: 'Santo Amaro, Zona Sul',
    lat: -23.6558,
    lng: -46.7214,
    lines: [
      { code: 'L5', name: '5-Lilás', color: '#784384' },
      { code: 'L9', name: '9-Esmeralda', color: '#009496' }
    ],
    connections: ['ViaMobilidade Linha 9-Esmeralda', 'Terminal Santo Amaro (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_capao_redondo',
    name: 'Estação Capão Redondo',
    type: 'METRO',
    address: 'Estrada de Itapecerica, 3858',
    neighborhood: 'Capão Redondo, Zona Sul',
    lat: -23.6596,
    lng: -46.7694,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#784384' }],
    connections: ['Terminal Urbano Capão Redondo'],
    isAccessible: true
  },

  // ================= TERMINAIS URBANOS DE ÔNIBUS SPTRANS =================
  {
    id: 'terminal_santana',
    name: 'Terminal Santana (SPTrans)',
    type: 'TERMINAL_BUS',
    address: 'R. Ezequiel Freire, s/n (ao lado do Metrô)',
    neighborhood: 'Santana, Zona Norte',
    lat: -23.5035,
    lng: -46.6242,
    lines: [
      { code: '1703-10', name: 'Jd. Fontális', color: '#E30613' },
      { code: '2012-10', name: 'Vila Medeiros', color: '#E30613' },
      { code: '106A-10', name: 'Itaim Bibi', color: '#E30613' },
      { code: '1788-10', name: 'Jd. Campo Limpo', color: '#E30613' }
    ],
    connections: ['Metrô Linha 1-Azul'],
    isAccessible: true
  },
  {
    id: 'terminal_tucuruvi',
    name: 'Terminal Tucuruvi (SPTrans)',
    type: 'TERMINAL_BUS',
    address: 'Av. Dr. Antônio Maria Laet, 100',
    neighborhood: 'Tucuruvi, Zona Norte',
    lat: -23.4802,
    lng: -46.6030,
    lines: [
      { code: '2029-10', name: 'Jd. Fontális', color: '#E30613' },
      { code: '172U-10', name: 'Mooca', color: '#E30613' },
      { code: '1771-10', name: 'Vila Zilda', color: '#E30613' }
    ],
    connections: ['Metrô Linha 1-Azul'],
    isAccessible: true
  },
  {
    id: 'terminal_jd_fontalis',
    name: 'Terminal Jardim Fontális',
    type: 'TERMINAL_BUS',
    address: 'Rua Flor de Maio, 40 / R. Mário Lago',
    neighborhood: 'Jardim Fontális / Tremembé, Zona Norte',
    lat: -23.4326,
    lng: -46.5783,
    lines: [
      { code: '1703-10', name: 'Shop. Center Norte', color: '#E30613' },
      { code: '2029-10', name: 'Metrô Tucuruvi', color: '#E30613' }
    ],
    connections: ['Linhas alimentadoras da Zona Norte'],
    isAccessible: true
  },
  {
    id: 'terminal_parque_dom_pedro',
    name: 'Terminal Parque Dom Pedro II',
    type: 'TERMINAL_BUS',
    address: 'Av. do Exterior, s/n',
    neighborhood: 'Sé / Brás, Centro',
    lat: -23.5467,
    lng: -46.6298,
    lines: [
      { code: 'EXPRESSO', name: 'Expresso Tiradentes', color: '#E30613' },
      { code: 'ZONA_LESTE', name: 'Conexões Zona Leste', color: '#E30613' },
      { code: 'ZONA_SUL', name: 'Conexões Zona Sul', color: '#E30613' }
    ],
    connections: ['Expresso Tiradentes', 'Metrô Linha 3-Vermelha (Pedro II)'],
    isAccessible: true
  },
  {
    id: 'terminal_bandeira',
    name: 'Terminal Bandeira (SPTrans)',
    type: 'TERMINAL_BUS',
    address: 'Praça da Bandeira, s/n',
    neighborhood: 'República / Bela Vista, Centro',
    lat: -23.5501,
    lng: -46.6402,
    lines: [
      { code: 'CORREDOR_9_JULHO', name: 'Corredor 9 de Julho / Santo Amaro', color: '#E30613' }
    ],
    connections: ['Metrô Linha 3-Vermelha (Anhangabaú)'],
    isAccessible: true
  },
  {
    id: 'terminal_pinheiros',
    name: 'Terminal Pinheiros (Victor Civita)',
    type: 'TERMINAL_BUS',
    address: 'R. Gilberto Sabino, 130',
    neighborhood: 'Pinheiros, Zona Oeste',
    lat: -23.5672,
    lng: -46.7022,
    lines: [
      { code: 'L4/L9', name: 'Integração Oeste / Sudoeste', color: '#E30613' }
    ],
    connections: ['Metrô Linha 4-Amarela', 'ViaMobilidade Linha 9-Esmeralda'],
    isAccessible: true
  },
  {
    id: 'terminal_santo_amaro',
    name: 'Terminal Santo Amaro (SPTrans)',
    type: 'TERMINAL_BUS',
    address: 'Av. Padre José Maria, 400',
    neighborhood: 'Santo Amaro, Zona Sul',
    lat: -23.6548,
    lng: -46.7198,
    lines: [
      { code: 'CORREDORES', name: 'Corredor Itapecerica / Santo Amaro', color: '#E30613' }
    ],
    connections: ['Metrô Linha 5-Lilás', 'ViaMobilidade Linha 9-Esmeralda'],
    isAccessible: true
  },
  {
    id: 'terminal_lapa',
    name: 'Terminal Lapa (SPTrans)',
    type: 'TERMINAL_BUS',
    address: 'Praça Miguel Dell\'Erba, 50',
    neighborhood: 'Lapa, Zona Oeste',
    lat: -23.5186,
    lng: -46.7001,
    lines: [
      { code: 'ZONA_OESTE', name: 'Conexões Zona Oeste e Pirituba', color: '#E30613' }
    ],
    connections: ['CPTM Linha 7-Rubi', 'ViaMobilidade Linha 8-Diamante'],
    isAccessible: true
  }
];
