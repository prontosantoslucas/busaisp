// Tipos da API Olho Vivo (SPTrans)

export interface SPTransLinha {
  cl: number;          // Código identificador da linha (codigoLinha)
  lc: boolean;         // Linha circular
  lt: string;          // Letreiro numérico (ex: "1703")
  tl: number;          // Tipo de linha (ex: 10)
  sl: number;          // Sentido da linha (1 = TP para TS, 2 = TS para TP)
  tp: string;          // Denominação do terminal principal (ex: "JD. FONTALIS")
  ts: string;          // Denominação do terminal secundário (ex: "SHOPPING CENTER NORTE")
}

export interface SPTransParada {
  cp: number;          // Código identificador da parada
  np: string;          // Nome da parada
  ed: string;          // Endereço / referência
  py: number;          // Latitude
  px: number;          // Longitude
}

export interface SPTransVeiculo {
  p: string;           // Prefixo do veículo (ex: "21045")
  a: boolean;          // Acessível para pessoas com deficiência ♿
  ta: string;          // Timestamp do envio da posição (UTC/Local)
  py: number;          // Latitude atual
  px: number;          // Longitude atual
  heading?: number;    // Direção estimada em graus (0-360)
  speed?: number;      // Velocidade estimada (km/h)
  destination?: string; // Destino do veículo de acordo com o sentido (ex: "SHOPPING CENTER NORTE" ou "JD. FONTÁLIS")
  direction?: number;   // 1 ou 2
}

export interface SPTransPosicaoLinha {
  hr: string;          // Horário de referência da consulta (HH:MM)
  vs: SPTransVeiculo[]; // Lista de veículos operando na linha
}

export interface SPTransPrevisaoVeiculo {
  p: string;           // Prefixo do veículo
  t: string;           // Horário previsto de chegada (HH:MM)
  a: boolean;          // Acessível ♿
  ta: string;          // Hora da última transmissão
  py: number;          // Latitude
  px: number;          // Longitude
  destination?: string; // Destino da viagem
}

export interface SPTransPrevisaoLinha {
  cl: number;          // Código da linha
  c: string;           // Letreiro completo (ex: "1703-10")
  sl: number;          // Sentido
  lt0: string;         // Destino letreiro principal (ex: "SHOPPING CENTER NORTE")
  lt1: string;         // Destino secundário (ex: "JD. FONTÁLIS")
  qv: number;          // Quantidade de veículos
  vs: SPTransPrevisaoVeiculo[]; // Veículos previstos
}

export interface SPTransPrevisaoParada {
  cp: number;          // Código da parada
  np: string;          // Nome da parada
  py: number;          // Latitude da parada
  px: number;          // Longitude da parada
  l: SPTransPrevisaoLinha[]; // Linhas com previsão de chegada nesta parada
}

export interface SPTransPrevisaoResponse {
  hr: string;          // Horário da consulta
  p?: SPTransPrevisaoParada;
  l?: SPTransPrevisaoLinha[];
}

export interface SearchResult {
  linhas: SPTransLinha[];
  paradas: SPTransParada[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isMock?: boolean;
  cached?: boolean;
  timestamp: string;
}
