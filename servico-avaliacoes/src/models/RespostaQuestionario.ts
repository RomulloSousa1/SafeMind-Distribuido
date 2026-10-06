import { NivelRisco } from './Avaliacao.js';

export interface RespostaQuestionario {
  id: string;
  avaliacaoId: string;
  colaboradorId?: string; // Opcional para manter compatibilidade com campanhas anônimas (LGPD)
  sobrecargaTrabalho: number; // 1 (muito baixa) a 5 (crítica)
  suporteLideranca: number;   // 1 (ótimo) a 5 (inexistente)
  clarezaPapel: number;       // 1 (muito clara) a 5 (muito confusa)
  ambienteFisico: number;     // 1 (excelente) a 5 (insalubre/perigoso)
  scoreIndividual: number;
  nivelRisco: NivelRisco;
  submetidoEm: Date;
}
