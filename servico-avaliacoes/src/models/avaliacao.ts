export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO';
export type StatusResposta = 'PENDENTE' | 'PROCESSADA';

export interface Avaliacao {
  id: string;
  empresaId: string;
  titulo: string;
  setor: string;
  criadoEm: string;
}

export interface Resposta {
  id: string;
  avaliacaoId: string;
  sobrecargaTrabalho: number;
  suporteLideranca: number;
  clarezaPapel: number;
  ambienteFisico: number;
  status: StatusResposta;
  pontuacao: number | null;
  nivelRisco: NivelRisco | null;
  criadoEm: string;
  processadoEm: string | null;
}
