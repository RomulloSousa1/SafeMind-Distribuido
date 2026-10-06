import { z } from 'zod';
import { NivelRisco, StatusAvaliacao } from '../models/Avaliacao.js';

export const CriarAvaliacaoSchema = z.object({
  id: z.string().optional(),
  empresaId: z.string().min(1, 'empresaId é obrigatório'),
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  setor: z.string().min(2, 'Setor é obrigatório')
}).strict();

export type CriarAvaliacaoRequestDTO = z.infer<typeof CriarAvaliacaoSchema>;

export interface AvaliacaoResponseDTO {
  id: string;
  empresaId: string;
  empresaRazaoSocial?: string;
  titulo: string;
  setor: string;
  status: StatusAvaliacao;
  nivelRiscoGeral?: NivelRisco;
  scoreMedio?: number;
  totalRespostas: number;
  criadaEm: string;
  atualizadaEm: string;
}
