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
      { code: 'L7', name: '7-Rubi', color: '#A61358' },
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
    id: 'metro_japao_liberdade',
    name: 'Estação Japão-Liberdade',
    type: 'METRO',
    address: 'Praça da Liberdade, 133',
    neighborhood: 'Liberdade, Centro',
    lat: -23.5551,
    lng: -46.6358,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_sao_joaquim',
    name: 'Estação São Joaquim',
    type: 'METRO',
    address: 'Av. da Liberdade, 1033',
    neighborhood: 'Liberdade / Bela Vista',
    lat: -23.5617,
    lng: -46.6387,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_vergueiro',
    name: 'Estação Vergueiro',
    type: 'METRO',
    address: 'R. Vergueiro, 700',
    neighborhood: 'Aclimação / Paraíso',
    lat: -23.5684,
    lng: -46.6401,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_paraiso',
    name: 'Estação Paraíso',
    type: 'METRO',
    address: 'R. Vergueiro, 1456',
    neighborhood: 'Paraíso, Centro-Sul',
    lat: -23.5756,
    lng: -46.6406,
    lines: [
      { code: 'L1', name: '1-Azul', color: '#003399' },
      { code: 'L2', name: '2-Verde', color: '#008053' }
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
      { code: 'L2', name: '2-Verde', color: '#008053' }
    ],
    connections: ['Metrô Linha 2-Verde', 'Terminal Ana Rosa (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_vila_mariana',
    name: 'Estação Vila Mariana',
    type: 'METRO',
    address: 'Av. Professor Noé Azevedo, 255',
    neighborhood: 'Vila Mariana, Zona Sul',
    lat: -23.5894,
    lng: -46.6346,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    connections: ['Terminal Vila Mariana (SPTrans)'],
    isAccessible: true
  },
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
      { code: 'L5', name: '5-Lilás', color: '#9B388D' }
    ],
    connections: ['Metrô Linha 5-Lilás', 'Shopping Metrô Santa Cruz'],
    isAccessible: true
  },
  {
    id: 'metro_praca_da_arvore',
    name: 'Estação Praça da Árvore',
    type: 'METRO',
    address: 'Praça da Árvore, 39',
    neighborhood: 'Saúde, Zona Sul',
    lat: -23.6105,
    lng: -46.6373,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_saude',
    name: 'Estação Saúde',
    type: 'METRO',
    address: 'Av. Jabaquara, 1634',
    neighborhood: 'Saúde, Zona Sul',
    lat: -23.6186,
    lng: -46.6394,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_sao_judas',
    name: 'Estação São Judas',
    type: 'METRO',
    address: 'Av. Jabaquara, 2438',
    neighborhood: 'Saúde / Planalto Paulista',
    lat: -23.6262,
    lng: -46.6410,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
    isAccessible: true
  },
  {
    id: 'metro_conceicao',
    name: 'Estação Conceição',
    type: 'METRO',
    address: 'Av. do Café, 100',
    neighborhood: 'Jabaquara, Zona Sul',
    lat: -23.6353,
    lng: -46.6412,
    lines: [{ code: 'L1', name: '1-Azul', color: '#003399' }],
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
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
    connections: ['Terminal Vila Madalena (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_sumare',
    name: 'Estação Sumaré',
    type: 'METRO',
    address: 'Av. Dr. Arnaldo, 1470',
    neighborhood: 'Sumaré / Perdizes',
    lat: -23.5504,
    lng: -46.6787,
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
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
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
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
      { code: 'L2', name: '2-Verde', color: '#008053' },
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
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
    connections: ['MASP - Museu de Arte de São Paulo'],
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
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
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
      { code: 'L2', name: '2-Verde', color: '#008053' },
      { code: 'L5', name: '5-Lilás', color: '#9B388D' }
    ],
    connections: ['Metrô Linha 5-Lilás'],
    isAccessible: true
  },
  {
    id: 'metro_santos_imigrantes',
    name: 'Estação Santos-Imigrantes',
    type: 'METRO',
    address: 'R. Eng. Guilherme Winter, 125',
    neighborhood: 'Cursino / Ipiranga',
    lat: -23.5960,
    lng: -46.6204,
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
    isAccessible: true
  },
  {
    id: 'metro_alto_do_ipiranga',
    name: 'Estação Alto do Ipiranga',
    type: 'METRO',
    address: 'Av. Dr. Gentil de Moura, 22',
    neighborhood: 'Ipiranga, Zona Sul',
    lat: -23.6022,
    lng: -46.6125,
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
    isAccessible: true
  },
  {
    id: 'metro_sacoma',
    name: 'Estação Sacomã',
    type: 'METRO',
    address: 'R. Greenfeld, 100',
    neighborhood: 'Ipiranga / Sacomã',
    lat: -23.6015,
    lng: -46.6028,
    lines: [{ code: 'L2', name: '2-Verde', color: '#008053' }],
    connections: ['Terminal Sacomã (Expresso Tiradentes/SPTrans/EMTU)'],
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
      { code: 'L2', name: '2-Verde', color: '#008053' },
      { code: 'L10', name: '10-Turquesa', color: '#007C8F' }
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
      { code: 'L2', name: '2-Verde', color: '#008053' },
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
      { code: 'L7', name: '7-Rubi', color: '#A61358' },
      { code: 'L8', name: '8-Diamante', color: '#808080' }
    ],
    connections: ['CPTM Linha 7-Rubi', 'ViaMobilidade Linha 8-Diamante', 'Terminal Rodoviário Barra Funda', 'Allianz Parque'],
    isAccessible: true
  },
  {
    id: 'metro_marechal_deodoro',
    name: 'Estação Marechal Deodoro',
    type: 'METRO',
    address: 'Praça Mal. Deodoro, 147',
    neighborhood: 'Santa Cecília, Centro',
    lat: -23.5358,
    lng: -46.6560,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    isAccessible: true
  },
  {
    id: 'metro_santa_cecilia',
    name: 'Estação Santa Cecília',
    type: 'METRO',
    address: 'Largo Santa Cecília, s/n',
    neighborhood: 'Santa Cecília, Centro',
    lat: -23.5396,
    lng: -46.6496,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
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
    id: 'metro_anhangabau',
    name: 'Estação Anhangabaú',
    type: 'METRO',
    address: 'R. Formosa, s/n',
    neighborhood: 'Centro Histórico',
    lat: -23.5484,
    lng: -46.6385,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    connections: ['Terminal Bandeira (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_pedro_ii',
    name: 'Estação Pedro II',
    type: 'METRO',
    address: 'R. da Figueira, s/n',
    neighborhood: 'Sé / Brás, Centro',
    lat: -23.5501,
    lng: -46.6267,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    connections: ['Expresso Tiradentes', 'Terminal Parque Dom Pedro II'],
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
      { code: 'L7', name: '7-Rubi', color: '#A61358' },
      { code: 'L10', name: '10-Turquesa', color: '#007C8F' },
      { code: 'L11', name: '11-Coral', color: '#F04E23' },
      { code: 'L12', name: '12-Safira', color: '#1C357E' }
    ],
    connections: ['CPTM Linhas 7, 10, 11 e 12'],
    isAccessible: true
  },
  {
    id: 'metro_bresser_mooca',
    name: 'Estação Bresser-Mooca',
    type: 'METRO',
    address: 'R. Ipanema, 700',
    neighborhood: 'Brás / Mooca',
    lat: -23.5439,
    lng: -46.6062,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    isAccessible: true
  },
  {
    id: 'metro_belem',
    name: 'Estação Belém',
    type: 'METRO',
    address: 'Av. Alcântara Machado, s/n',
    neighborhood: 'Belém, Zona Leste',
    lat: -23.5427,
    lng: -46.5901,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
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
      { code: 'L12', name: '12-Safira', color: '#1C357E' }
    ],
    connections: ['CPTM Linhas 11 e 12', 'Shopping Metrô Tatuapé'],
    isAccessible: true
  },
  {
    id: 'metro_carrao',
    name: 'Estação Carrão-Assaí Atacadista',
    type: 'METRO',
    address: 'Av. Radial Leste, s/n',
    neighborhood: 'Tatuapé / Carrão',
    lat: -23.5379,
    lng: -46.5641,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    connections: ['Terminal Carrão (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_penha',
    name: 'Estação Penha - Besni',
    type: 'METRO',
    address: 'Av. Conde de Frontin, s/n',
    neighborhood: 'Penha, Zona Leste',
    lat: -23.5338,
    lng: -46.5432,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    isAccessible: true
  },
  {
    id: 'metro_vila_matilde',
    name: 'Estação Vila Matilde',
    type: 'METRO',
    address: 'R. Cel. Pedro Dias de Campos, s/n',
    neighborhood: 'Vila Matilde, Zona Leste',
    lat: -23.5321,
    lng: -46.5310,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    isAccessible: true
  },
  {
    id: 'metro_guilhermina_esperanca',
    name: 'Estação Guilhermina-Esperança',
    type: 'METRO',
    address: 'R. Astorga, s/n',
    neighborhood: 'Vila Esperança / Guilhermina',
    lat: -23.5298,
    lng: -46.5164,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    isAccessible: true
  },
  {
    id: 'metro_patriarca',
    name: 'Estação Patriarca-Vila Ré',
    type: 'METRO',
    address: 'Av. Antonio Estevão de Carvalho, s/n',
    neighborhood: 'Vila Ré / Patriarca',
    lat: -23.5312,
    lng: -46.5015,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
    isAccessible: true
  },
  {
    id: 'metro_artur_alvim',
    name: 'Estação Artur Alvim',
    type: 'METRO',
    address: 'R. Dr. Luiz Aires, s/n',
    neighborhood: 'Artur Alvim, Zona Leste',
    lat: -23.5408,
    lng: -46.4845,
    lines: [{ code: 'L3', name: '3-Vermelha', color: '#EE1D23' }],
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
    id: 'metro_higienopolis_mackenzie',
    name: 'Estação Higienópolis-Mackenzie',
    type: 'METRO',
    address: 'R. da Consolação, 1379',
    neighborhood: 'Consolação / Higienópolis',
    lat: -23.5492,
    lng: -46.6525,
    lines: [{ code: 'L4', name: '4-Amarela', color: '#FFF000' }],
    connections: ['Universidade Presbiteriana Mackenzie'],
    isAccessible: true
  },
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
      { code: 'L2', name: '2-Verde', color: '#008053' }
    ],
    connections: ['Metrô Linha 2-Verde (Estação Consolação)'],
    isAccessible: true
  },
  {
    id: 'metro_oscar_freire',
    name: 'Estação Oscar Freire',
    type: 'METRO',
    address: 'Av. Rebouças, 1089',
    neighborhood: 'Jardins / Cerqueira César',
    lat: -23.5601,
    lng: -46.6719,
    lines: [{ code: 'L4', name: '4-Amarela', color: '#FFF000' }],
    isAccessible: true
  },
  {
    id: 'metro_fradique_coutinho',
    name: 'Estação Fradique Coutinho',
    type: 'METRO',
    address: 'R. dos Pinheiros, 623',
    neighborhood: 'Pinheiros, Zona Oeste',
    lat: -23.5662,
    lng: -46.6841,
    lines: [{ code: 'L4', name: '4-Amarela', color: '#FFF000' }],
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
    id: 'metro_butanta',
    name: 'Estação Butantã',
    type: 'METRO',
    address: 'Av. Vital Brasil, 427',
    neighborhood: 'Butantã, Zona Oeste',
    lat: -23.5718,
    lng: -46.7082,
    lines: [{ code: 'L4', name: '4-Amarela', color: '#FFF000' }],
    connections: ['Terminal Butantã (SPTrans / Circular USP)'],
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
    id: 'metro_capao_redondo',
    name: 'Estação Capão Redondo',
    type: 'METRO',
    address: 'Estrada de Itapecerica, 3858',
    neighborhood: 'Capão Redondo, Zona Sul',
    lat: -23.6596,
    lng: -46.7694,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    connections: ['Terminal Urbano Capão Redondo'],
    isAccessible: true
  },
  {
    id: 'metro_campo_limpo',
    name: 'Estação Campo Limpo',
    type: 'METRO',
    address: 'R. Noé de Araújo, s/n',
    neighborhood: 'Campo Limpo, Zona Sul',
    lat: -23.6493,
    lng: -46.7588,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    connections: ['Terminal Campo Limpo (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_vila_das_belezas',
    name: 'Estação Vila das Belezas',
    type: 'METRO',
    address: 'Av. das Belezas, 400',
    neighborhood: 'Vila Andrade / Campo Limpo',
    lat: -23.6406,
    lng: -46.7423,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    isAccessible: true
  },
  {
    id: 'metro_giovanni_gronchi',
    name: 'Estação Giovanni Gronchi',
    type: 'METRO',
    address: 'Av. Giovanni Gronchi, 6800',
    neighborhood: 'Vila Andrade, Zona Sul',
    lat: -23.6439,
    lng: -46.7335,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    connections: ['Terminal João Dias (SPTrans)'],
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
      { code: 'L5', name: '5-Lilás', color: '#9B388D' },
      { code: 'L9', name: '9-Esmeralda', color: '#009496' }
    ],
    connections: ['ViaMobilidade Linha 9-Esmeralda', 'Terminal Santo Amaro (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_largo_treze',
    name: 'Estação Largo Treze',
    type: 'METRO',
    address: 'Av. Padre José Maria, s/n',
    neighborhood: 'Santo Amaro, Zona Sul',
    lat: -23.6534,
    lng: -46.7118,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    connections: ['Terminal Santo Amaro'],
    isAccessible: true
  },
  {
    id: 'metro_adolfo_pinheiro',
    name: 'Estação Adolfo Pinheiro',
    type: 'METRO',
    address: 'Av. Adolfo Pinheiro, 300',
    neighborhood: 'Santo Amaro, Zona Sul',
    lat: -23.6501,
    lng: -46.7042,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    isAccessible: true
  },
  {
    id: 'metro_alto_da_boa_vista',
    name: 'Estação Alto da Boa Vista',
    type: 'METRO',
    address: 'Av. Santo Amaro, 6900',
    neighborhood: 'Santo Amaro / Alto da Boa Vista',
    lat: -23.6418,
    lng: -46.6991,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    isAccessible: true
  },
  {
    id: 'metro_borba_gato',
    name: 'Estação Borba Gato',
    type: 'METRO',
    address: 'Av. Santo Amaro, 5800',
    neighborhood: 'Santo Amaro / Chácara Santo Antônio',
    lat: -23.6337,
    lng: -46.6938,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    isAccessible: true
  },
  {
    id: 'metro_brooklin',
    name: 'Estação Brooklin',
    type: 'METRO',
    address: 'Av. Santo Amaro, 4800',
    neighborhood: 'Brooklin, Zona Sul',
    lat: -23.6261,
    lng: -46.6881,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    isAccessible: true
  },
  {
    id: 'metro_campo_belo',
    name: 'Estação Campo Belo',
    type: 'METRO',
    address: 'Av. Santo Amaro, 3800',
    neighborhood: 'Campo Belo, Zona Sul',
    lat: -23.6189,
    lng: -46.6806,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    isAccessible: true
  },
  {
    id: 'metro_eucaliptos',
    name: 'Estação Eucaliptos',
    type: 'METRO',
    address: 'Av. Ibirapuera, 3144',
    neighborhood: 'Moema / Indianópolis',
    lat: -23.6101,
    lng: -46.6685,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    connections: ['Shopping Ibirapuera'],
    isAccessible: true
  },
  {
    id: 'metro_moema',
    name: 'Estação Moema',
    type: 'METRO',
    address: 'Av. Ibirapuera, 2200',
    neighborhood: 'Moema, Zona Sul',
    lat: -23.6041,
    lng: -46.6612,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    isAccessible: true
  },
  {
    id: 'metro_aacd_servidor',
    name: 'Estação AACD-Servidor',
    type: 'METRO',
    address: 'R. Pedro de Toledo, 1600',
    neighborhood: 'Vila Clementino / Ibirapuera',
    lat: -23.5977,
    lng: -46.6528,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    connections: ['AACD', 'Hospital do Servidor Público Estadual', 'Parque Ibirapuera'],
    isAccessible: true
  },
  {
    id: 'metro_hospital_sao_paulo',
    name: 'Estação Hospital São Paulo',
    type: 'METRO',
    address: 'R. Pedro de Toledo, 800',
    neighborhood: 'Vila Clementino, Zona Sul',
    lat: -23.5982,
    lng: -46.6453,
    lines: [{ code: 'L5', name: '5-Lilás', color: '#9B388D' }],
    connections: ['Hospital São Paulo / UNIFESP'],
    isAccessible: true
  },

  // ================= CPTM LINHA 7 - RUBI =================
  {
    id: 'cptm_francisco_morato',
    name: 'Estação Francisco Morato',
    type: 'CPTM',
    address: 'R. Gerônimo Caetano Garcia, s/n',
    neighborhood: 'Francisco Morato',
    lat: -23.2818,
    lng: -46.7447,
    lines: [{ code: 'L7', name: '7-Rubi', color: '#A61358' }],
    isAccessible: true
  },
  {
    id: 'cptm_franco_da_rocha',
    name: 'Estação Franco da Rocha',
    type: 'CPTM',
    address: 'R. Cavalheiro Ângelo Sestini, s/n',
    neighborhood: 'Franco da Rocha',
    lat: -23.3283,
    lng: -46.7265,
    lines: [{ code: 'L7', name: '7-Rubi', color: '#A61358' }],
    isAccessible: true
  },
  {
    id: 'cptm_caieiras',
    name: 'Estação Caieiras',
    type: 'CPTM',
    address: 'Av. Pauliceia, s/n',
    neighborhood: 'Caieiras',
    lat: -23.3644,
    lng: -46.7412,
    lines: [{ code: 'L7', name: '7-Rubi', color: '#A61358' }],
    isAccessible: true
  },
  {
    id: 'cptm_perus',
    name: 'Estação Perus',
    type: 'CPTM',
    address: 'R. Bernardo José de Lorena, s/n',
    neighborhood: 'Perus, Zona Noroeste',
    lat: -23.4072,
    lng: -46.7523,
    lines: [{ code: 'L7', name: '7-Rubi', color: '#A61358' }],
    isAccessible: true
  },
  {
    id: 'cptm_pirituba',
    name: 'Estação Pirituba',
    type: 'CPTM',
    address: 'R. Dr. Carlos da Silveira, s/n',
    neighborhood: 'Pirituba, Zona Noroeste',
    lat: -23.4862,
    lng: -46.7231,
    lines: [{ code: 'L7', name: '7-Rubi', color: '#A61358' }],
    connections: ['Terminal Pirituba (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'cptm_lapa_7',
    name: 'Estação Lapa (Linha 7)',
    type: 'CPTM',
    address: 'R. William Speers, s/n',
    neighborhood: 'Lapa, Zona Oeste',
    lat: -23.5181,
    lng: -46.7022,
    lines: [{ code: 'L7', name: '7-Rubi', color: '#A61358' }],
    connections: ['Terminal Lapa (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'cptm_agua_branca',
    name: 'Estação Água Branca',
    type: 'CPTM',
    address: 'Av. Santa Marina, 1500',
    neighborhood: 'Água Branca, Zona Oeste',
    lat: -23.5198,
    lng: -46.6853,
    lines: [{ code: 'L7', name: '7-Rubi', color: '#A61358' }],
    isAccessible: true
  },

  // ================= VIAMOBILIDADE LINHA 8 - DIAMANTE =================
  {
    id: 'cptm_itapevi',
    name: 'Estação Itapevi',
    type: 'CPTM',
    address: 'R. Rubens Lopes da Silva, s/n',
    neighborhood: 'Itapevi',
    lat: -23.5482,
    lng: -46.9329,
    lines: [{ code: 'L8', name: '8-Diamante', color: '#808080' }],
    isAccessible: true
  },
  {
    id: 'cptm_barueri',
    name: 'Estação Barueri',
    type: 'CPTM',
    address: 'Praça São João Batista, s/n',
    neighborhood: 'Barueri / Alphaville',
    lat: -23.5097,
    lng: -46.8762,
    lines: [{ code: 'L8', name: '8-Diamante', color: '#808080' }],
    isAccessible: true
  },
  {
    id: 'cptm_carapicuiba',
    name: 'Estação Carapicuíba',
    type: 'CPTM',
    address: 'Av. Diógenes Ribeiro de Lima, s/n',
    neighborhood: 'Carapicuíba',
    lat: -23.5222,
    lng: -46.8375,
    lines: [{ code: 'L8', name: '8-Diamante', color: '#808080' }],
    isAccessible: true
  },
  {
    id: 'cptm_osasco',
    name: 'Estação Osasco',
    type: 'CPTM',
    address: 'Praça Antônio Menck, s/n',
    neighborhood: 'Centro, Osasco',
    lat: -23.5283,
    lng: -46.7761,
    lines: [
      { code: 'L8', name: '8-Diamante', color: '#808080' },
      { code: 'L9', name: '9-Esmeralda', color: '#009496' }
    ],
    connections: ['ViaMobilidade Linha 9-Esmeralda', 'Terminal Urbano Osasco'],
    isAccessible: true
  },
  {
    id: 'cptm_presidente_altino',
    name: 'Estação Presidente Altino',
    type: 'CPTM',
    address: 'R. Erasmo Braga, s/n',
    neighborhood: 'Presidente Altino, Osasco',
    lat: -23.5308,
    lng: -46.7628,
    lines: [
      { code: 'L8', name: '8-Diamante', color: '#808080' },
      { code: 'L9', name: '9-Esmeralda', color: '#009496' }
    ],
    connections: ['ViaMobilidade Linha 9-Esmeralda'],
    isAccessible: true
  },
  {
    id: 'cptm_imperatriz_leopoldina',
    name: 'Estação Imperatriz Leopoldina',
    type: 'CPTM',
    address: 'Av. Imperatriz Leopoldina, s/n',
    neighborhood: 'Vila Leopoldina, Zona Oeste',
    lat: -23.5262,
    lng: -46.7323,
    lines: [{ code: 'L8', name: '8-Diamante', color: '#808080' }],
    isAccessible: true
  },
  {
    id: 'cptm_lapa_8',
    name: 'Estação Lapa (Linha 8)',
    type: 'CPTM',
    address: 'R. Guaicurus, 1438',
    neighborhood: 'Lapa, Zona Oeste',
    lat: -23.5204,
    lng: -46.7029,
    lines: [{ code: 'L8', name: '8-Diamante', color: '#808080' }],
    isAccessible: true
  },
  {
    id: 'cptm_julio_prestes',
    name: 'Estação Júlio Prestes',
    type: 'CPTM',
    address: 'Praça Júlio Prestes, 148',
    neighborhood: 'Campos Elíseos, Centro',
    lat: -23.5350,
    lng: -46.6389,
    lines: [{ code: 'L8', name: '8-Diamante', color: '#808080' }],
    connections: ['Sala São Paulo'],
    isAccessible: true
  },

  // ================= VIAMOBILIDADE LINHA 9 - ESMERALDA =================
  {
    id: 'cptm_ceasa',
    name: 'Estação Ceasa',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, s/n',
    neighborhood: 'Vila Leopoldina / Ceagesp',
    lat: -23.5375,
    lng: -46.7441,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Ceagesp'],
    isAccessible: true
  },
  {
    id: 'cptm_villa_lobos_jaguare',
    name: 'Estação Villa-Lobos - Jaguaré',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 2100',
    neighborhood: 'Jaguaré / Alto de Pinheiros',
    lat: -23.5489,
    lng: -46.7322,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Parque Villa-Lobos'],
    isAccessible: true
  },
  {
    id: 'cptm_cidade_universitaria',
    name: 'Estação Cidade Universitária',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 4500',
    neighborhood: 'Pinheiros / Butantã',
    lat: -23.5591,
    lng: -46.7161,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['USP - Universidade de São Paulo'],
    isAccessible: true
  },
  {
    id: 'cptm_hebraica_reboucas',
    name: 'Estação Hebraica-Rebouças',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 7163',
    neighborhood: 'Pinheiros / Jardim Paulistano',
    lat: -23.5744,
    lng: -46.6975,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Shopping Eldorado', 'Clube Hebraica'],
    isAccessible: true
  },
  {
    id: 'cptm_cidade_jardim',
    name: 'Estação Cidade Jardim',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 8500',
    neighborhood: 'Itaim Bibi / Pinheiros',
    lat: -23.5861,
    lng: -46.6917,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Parque do Povo', 'Shopping Cidade Jardim'],
    isAccessible: true
  },
  {
    id: 'cptm_vila_olimpia',
    name: 'Estação Vila Olímpia',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 10000',
    neighborhood: 'Vila Olímpia / Itaim Bibi',
    lat: -23.5938,
    lng: -46.6922,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Shopping JK Iguatemi', 'Polo Corporativo Faria Lima'],
    isAccessible: true
  },
  {
    id: 'cptm_berrini',
    name: 'Estação Berrini',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 12000',
    neighborhood: 'Brooklin / Itaim Bibi',
    lat: -23.6067,
    lng: -46.6958,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Av. Eng. Luís Carlos Berrini', 'Ponte Estaiada'],
    isAccessible: true
  },
  {
    id: 'cptm_morumbi_9',
    name: 'Estação Morumbi (Linha 9)',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 14000',
    neighborhood: 'Vila Gertrudes / Morumbi',
    lat: -23.6225,
    lng: -46.7022,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Shopping Morumbi', 'Market Place'],
    isAccessible: true
  },
  {
    id: 'cptm_granja_julieta',
    name: 'Estação Granja Julieta',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 15500',
    neighborhood: 'Chácara Santo Antônio',
    lat: -23.6338,
    lng: -46.7088,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    isAccessible: true
  },
  {
    id: 'cptm_socorro',
    name: 'Estação Socorro',
    type: 'CPTM',
    address: 'Av. das Nações Unidas, 20000',
    neighborhood: 'Socorro, Zona Sul',
    lat: -23.6669,
    lng: -46.7110,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    isAccessible: true
  },
  {
    id: 'cptm_jurubatuba',
    name: 'Estação Jurubatuba',
    type: 'CPTM',
    address: 'Av. Octalles Marcondes Ferreira, s/n',
    neighborhood: 'Campo Grande / Jurubatuba',
    lat: -23.6792,
    lng: -46.6975,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Shopping SP Market'],
    isAccessible: true
  },
  {
    id: 'cptm_grajau',
    name: 'Estação Grajaú',
    type: 'CPTM',
    address: 'R. Giovanni Bononcini, s/n',
    neighborhood: 'Grajaú, Extremo Sul',
    lat: -23.7381,
    lng: -46.6931,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    connections: ['Terminal Grajaú (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'cptm_mendes_vila_natal',
    name: 'Estação Mendes-Vila Natal',
    type: 'CPTM',
    address: 'Estrada dos Mendes, s/n',
    neighborhood: 'Vila Natal / Grajaú, Zona Sul',
    lat: -23.7547,
    lng: -46.6897,
    lines: [{ code: 'L9', name: '9-Esmeralda', color: '#009496' }],
    isAccessible: true
  },

  // ================= CPTM LINHA 10 - TURQUESA =================
  {
    id: 'cptm_juventus_mooca',
    name: 'Estação Juventus-Mooca',
    type: 'CPTM',
    address: 'Av. Presidente Wilson, s/n',
    neighborhood: 'Mooca, Zona Leste',
    lat: -23.5642,
    lng: -46.6067,
    lines: [{ code: 'L10', name: '10-Turquesa', color: '#007C8F' }],
    isAccessible: true
  },
  {
    id: 'cptm_ipiranga',
    name: 'Estação Ipiranga',
    type: 'CPTM',
    address: 'Av. Presidente Wilson, 2500',
    neighborhood: 'Ipiranga, Zona Sul',
    lat: -23.5781,
    lng: -46.5992,
    lines: [{ code: 'L10', name: '10-Turquesa', color: '#007C8F' }],
    isAccessible: true
  },
  {
    id: 'cptm_sao_caetano',
    name: 'Estação São Caetano do Sul',
    type: 'CPTM',
    address: 'Praça da Emancipação, s/n',
    neighborhood: 'Centro, São Caetano do Sul',
    lat: -23.6122,
    lng: -46.5681,
    lines: [{ code: 'L10', name: '10-Turquesa', color: '#007C8F' }],
    connections: ['Terminal Urbano São Caetano'],
    isAccessible: true
  },
  {
    id: 'cptm_santo_andre',
    name: 'Estação Prefeito Celso Daniel - Santo André',
    type: 'CPTM',
    address: 'Praça IV Centenário, s/n',
    neighborhood: 'Centro, Santo André',
    lat: -23.6528,
    lng: -46.5312,
    lines: [{ code: 'L10', name: '10-Turquesa', color: '#007C8F' }],
    connections: ['Terminal Leste / Oeste Santo André', 'Corredor EMTU'],
    isAccessible: true
  },
  {
    id: 'cptm_maua',
    name: 'Estação Mauá',
    type: 'CPTM',
    address: 'Praça 21 de Dezembro, s/n',
    neighborhood: 'Centro, Mauá',
    lat: -23.6681,
    lng: -46.4628,
    lines: [{ code: 'L10', name: '10-Turquesa', color: '#007C8F' }],
    connections: ['Terminal Urbano de Mauá'],
    isAccessible: true
  },
  {
    id: 'cptm_rio_grande_da_serra',
    name: 'Estação Rio Grande da Serra',
    type: 'CPTM',
    address: 'Praça da Bíblia, s/n',
    neighborhood: 'Rio Grande da Serra',
    lat: -23.7431,
    lng: -46.3981,
    lines: [{ code: 'L10', name: '10-Turquesa', color: '#007C8F' }],
    isAccessible: true
  },

  // ================= CPTM LINHA 11 - CORAL =================
  {
    id: 'cptm_dom_bosco',
    name: 'Estação Dom Bosco',
    type: 'CPTM',
    address: 'R. São Francisco do Piauí, s/n',
    neighborhood: 'Itaquera, Zona Leste',
    lat: -23.5417,
    lng: -46.4497,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    isAccessible: true
  },
  {
    id: 'cptm_jose_bonifacio',
    name: 'Estação José Bonifácio',
    type: 'CPTM',
    address: 'Av. Nagib Farah Maluf, s/n',
    neighborhood: 'José Bonifácio / Itaquera',
    lat: -23.5398,
    lng: -46.4312,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    isAccessible: true
  },
  {
    id: 'cptm_guaianases',
    name: 'Estação Guaianases',
    type: 'CPTM',
    address: 'R. Salvador Gianetti, s/n',
    neighborhood: 'Guaianases, Zona Leste',
    lat: -23.5428,
    lng: -46.4150,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    connections: ['Terminal Guaianases (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'cptm_ferraz',
    name: 'Estação Ferraz de Vasconcelos',
    type: 'CPTM',
    address: 'Av. Brasil, s/n',
    neighborhood: 'Centro, Ferraz de Vasconcelos',
    lat: -23.5412,
    lng: -46.3683,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    isAccessible: true
  },
  {
    id: 'cptm_poa',
    name: 'Estação Poá',
    type: 'CPTM',
    address: 'Av. Brasil, s/n',
    neighborhood: 'Centro, Poá',
    lat: -23.5317,
    lng: -46.3458,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    isAccessible: true
  },
  {
    id: 'cptm_suzano',
    name: 'Estação Suzano',
    type: 'CPTM',
    address: 'R. Prudente de Moraes, s/n',
    neighborhood: 'Centro, Suzano',
    lat: -23.5361,
    lng: -46.3094,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    connections: ['Terminal Urbano Suzano'],
    isAccessible: true
  },
  {
    id: 'cptm_mogi_das_cruzes',
    name: 'Estação Mogi das Cruzes',
    type: 'CPTM',
    address: 'Praça Sacadura Cabral, s/n',
    neighborhood: 'Centro, Mogi das Cruzes',
    lat: -23.5233,
    lng: -46.1883,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    isAccessible: true
  },
  {
    id: 'cptm_estudantes',
    name: 'Estação Estudantes',
    type: 'CPTM',
    address: 'Av. Dr. Cândido Xavier de Almeida e Souza, s/n',
    neighborhood: 'Mogi das Cruzes / UMC / UBC',
    lat: -23.5186,
    lng: -46.1772,
    lines: [{ code: 'L11', name: '11-Coral', color: '#F04E23' }],
    connections: ['Terminal Estudantes', 'Universidade de Mogi das Cruzes'],
    isAccessible: true
  },

  // ================= CPTM LINHA 12 - SAFIRA =================
  {
    id: 'cptm_eng_goulart',
    name: 'Estação Engenheiro Goulart',
    type: 'CPTM',
    address: 'Av. Dr. Assis Ribeiro, 3500',
    neighborhood: 'Cangaíba / Eng. Goulart',
    lat: -23.4981,
    lng: -46.5204,
    lines: [
      { code: 'L12', name: '12-Safira', color: '#1C357E' },
      { code: 'L13', name: '13-Jade', color: '#00A859' }
    ],
    connections: ['CPTM Linha 13-Jade (Aeroporto Guarulhos)', 'Parque Ecológico Tietê'],
    isAccessible: true
  },
  {
    id: 'cptm_usp_leste',
    name: 'Estação USP Leste',
    type: 'CPTM',
    address: 'R. Arlindo Béttio, 1000',
    neighborhood: 'Ermelino Matarazzo / USP Leste',
    lat: -23.4851,
    lng: -46.5008,
    lines: [{ code: 'L12', name: '12-Safira', color: '#1C357E' }],
    connections: ['Campus EACH - USP Leste'],
    isAccessible: true
  },
  {
    id: 'cptm_sao_miguel_paulista',
    name: 'Estação São Miguel Paulista',
    type: 'CPTM',
    address: 'R. Salvador de Medeiros, s/n',
    neighborhood: 'São Miguel Paulista, Zona Leste',
    lat: -23.4947,
    lng: -46.4428,
    lines: [{ code: 'L12', name: '12-Safira', color: '#1C357E' }],
    connections: ['Terminal São Miguel (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'cptm_itaim_paulista',
    name: 'Estação Itaim Paulista',
    type: 'CPTM',
    address: 'Av. Marechal Tito, 4000',
    neighborhood: 'Itaim Paulista, Zona Leste',
    lat: -23.4967,
    lng: -46.3986,
    lines: [{ code: 'L12', name: '12-Safira', color: '#1C357E' }],
    connections: ['Terminal Itaim Paulista (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'cptm_calmon_viana',
    name: 'Estação Calmon Viana',
    type: 'CPTM',
    address: 'Av. Brasil, s/n',
    neighborhood: 'Poá / Calmon Viana',
    lat: -23.5304,
    lng: -46.3312,
    lines: [
      { code: 'L11', name: '11-Coral', color: '#F04E23' },
      { code: 'L12', name: '12-Safira', color: '#1C357E' }
    ],
    connections: ['CPTM Linha 11-Coral'],
    isAccessible: true
  },

  // ================= CPTM LINHA 13 - JADE =================
  {
    id: 'cptm_guarulhos_cecap',
    name: 'Estação Guarulhos-CECAP',
    type: 'CPTM',
    address: 'Av. Natália Zarif, s/n',
    neighborhood: 'Parque Cecap, Guarulhos',
    lat: -23.4475,
    lng: -46.4958,
    lines: [{ code: 'L13', name: '13-Jade', color: '#00A859' }],
    connections: ['Terminal Rodoviário de Guarulhos', 'Corredor Metropolitano EMTU'],
    isAccessible: true
  },
  {
    id: 'cptm_aeroporto_guarulhos',
    name: 'Estação Aeroporto-Guarulhos',
    type: 'CPTM',
    address: 'Rodovia Hélio Smidt, s/n (Terminal 1)',
    neighborhood: 'Aeroporto Internacional de Guarulhos',
    lat: -23.4322,
    lng: -46.4818,
    lines: [{ code: 'L13', name: '13-Jade', color: '#00A859' }],
    connections: ['Aeroporto Internacional de SP/Guarulhos (GRU Airport)', 'People Mover / Transfer Terminais 1, 2 e 3'],
    isAccessible: true
  },

  // ================= MONOTRILHO LINHA 15 - PRATA =================
  {
    id: 'metro_oratorio',
    name: 'Estação Oratório',
    type: 'METRO',
    address: 'Av. Prof. Luiz Ignácio Anhaia Mello, 3000',
    neighborhood: 'Vila Prudente / Oratório',
    lat: -23.5781,
    lng: -46.5681,
    lines: [{ code: 'L15', name: '15-Prata', color: '#A7A8AA' }],
    isAccessible: true
  },
  {
    id: 'metro_sao_lucas',
    name: 'Estação São Lucas',
    type: 'METRO',
    address: 'Av. Prof. Luiz Ignácio Anhaia Mello, 4100',
    neighborhood: 'Parque São Lucas, Zona Leste',
    lat: -23.5886,
    lng: -46.5492,
    lines: [{ code: 'L15', name: '15-Prata', color: '#A7A8AA' }],
    isAccessible: true
  },
  {
    id: 'metro_camilo_haddad',
    name: 'Estação Camilo Haddad',
    type: 'METRO',
    address: 'Av. Prof. Luiz Ignácio Anhaia Mello, 5200',
    neighborhood: 'Vila Camilo Haddad, Zona Leste',
    lat: -23.5933,
    lng: -46.5398,
    lines: [{ code: 'L15', name: '15-Prata', color: '#A7A8AA' }],
    isAccessible: true
  },
  {
    id: 'metro_vila_tolstoi',
    name: 'Estação Vila Tolstói',
    type: 'METRO',
    address: 'Av. Prof. Luiz Ignácio Anhaia Mello, 6300',
    neighborhood: 'Vila Tolstói, Zona Leste',
    lat: -23.5986,
    lng: -46.5297,
    lines: [{ code: 'L15', name: '15-Prata', color: '#A7A8AA' }],
    isAccessible: true
  },
  {
    id: 'metro_sapopemba',
    name: 'Estação Sapopemba',
    type: 'METRO',
    address: 'Av. Prof. Luiz Ignácio Anhaia Mello, 8500',
    neighborhood: 'Sapopemba, Zona Leste',
    lat: -23.6062,
    lng: -46.5053,
    lines: [{ code: 'L15', name: '15-Prata', color: '#A7A8AA' }],
    connections: ['Terminal Sapopemba (SPTrans)'],
    isAccessible: true
  },
  {
    id: 'metro_sao_mateus',
    name: 'Estação São Mateus',
    type: 'METRO',
    address: 'Av. Ragueb Chohfi, 100',
    neighborhood: 'São Mateus, Zona Leste',
    lat: -23.6019,
    lng: -46.4789,
    lines: [{ code: 'L15', name: '15-Prata', color: '#A7A8AA' }],
    connections: ['Terminal São Mateus (SPTrans / EMTU)'],
    isAccessible: true
  },
  {
    id: 'metro_jardim_colonial',
    name: 'Estação Jardim Colonial',
    type: 'METRO',
    address: 'Av. Ragueb Chohfi, 1400',
    neighborhood: 'Jardim Colonial / São Mateus',
    lat: -23.5981,
    lng: -46.4633,
    lines: [{ code: 'L15', name: '15-Prata', color: '#A7A8AA' }],
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
