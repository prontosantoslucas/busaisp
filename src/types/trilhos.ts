// Tipos para Status de Linhas de Trilhos (Metrô, CPTM, ViaQuatro, ViaMobilidade)

export type RailOperator = 'METRO' | 'CPTM' | 'VIAQUATRO' | 'VIAMOBILIDADE';

export type RailStatusType =
  | 'NORMAL'
  | 'VELOCIDADE_REDUZIDA'
  | 'OPERACAO_PARCIAL'
  | 'PARALISADA'
  | 'ENCERRADA'
  | 'DESCONHECIDO';

export interface RailLine {
  id: string;              // ex: "1", "2", "3", "4", "5", "7", "8", "9", "10", "11", "12", "13", "15"
  name: string;            // ex: "Linha 1 - Azul"
  number: string;          // ex: "1"
  colorName: string;       // ex: "Azul"
  hexColor: string;        // ex: "#003399"
  operator: RailOperator;  // ex: "METRO"
  status: RailStatusType;  // ex: "NORMAL"
  statusText: string;      // ex: "Operação Normal", "Velocidade Reduzida"
  description?: string;    // Detalhes da ocorrência ou boletim técnico
  updatedAt: string;       // Timestamp ISO ou HH:MM
}

export interface RailsResponse {
  lines: RailLine[];
  summary: {
    total: number;
    normal: number;
    withIssues: number;
  };
  lastChecked: string;
  source: string;
}
