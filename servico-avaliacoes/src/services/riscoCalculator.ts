import { NivelRisco } from '../models/avaliacao.js';

interface Respostas {
  sobrecargaTrabalho: number;
  suporteLideranca: number;
  clarezaPapel: number;
  ambienteFisico: number;
}

/** Pontuação = média das 4 dimensões (1-5); quanto maior, maior o risco psicossocial. */
export function calcularPontuacao(r: Respostas): number {
  const media = (r.sobrecargaTrabalho + r.suporteLideranca + r.clarezaPapel + r.ambienteFisico) / 4;
  return Math.round(media * 100) / 100;
}

export function classificarRisco(pontuacao: number): NivelRisco {
  if (pontuacao >= 4) return 'ALTO';
  if (pontuacao >= 2.5) return 'MEDIO';
  return 'BAIXO';
}
