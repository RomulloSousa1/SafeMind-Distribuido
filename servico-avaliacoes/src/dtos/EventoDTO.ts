import { NivelRisco } from '../models/Avaliacao.js';


export interface RespostaSubmetidaEventDTO {
  id: string;
  avaliacaoId: string;
  colaboradorId?: string;
  scoreIndividual: number;
  nivelRisco: NivelRisco;
  submetidoEm: string;
}
