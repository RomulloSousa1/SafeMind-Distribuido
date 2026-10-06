import { z } from 'zod';
import { NivelRisco } from '../models/Avaliacao.js';
import { AvaliacaoResponseDTO } from './AvaliacaoDTO.js';

export const SubmeterRespostaSchema = z.object({
  colaboradorId: z.string().optional(),
  sobrecargaTrabalho: z.number().int().min(1).max(5),
  suporteLideranca: z.number().int().min(1).max(5),
  clarezaPapel: z.number().int().min(1).max(5),
  ambienteFisico: z.number().int().min(1).max(5)
}).strict();

export type SubmeterRespostaRequestDTO = z.infer<typeof SubmeterRespostaSchema>;

export interface RespostaResponseDTO {
  id: string;
  avaliacaoId: string;
  colaboradorId?: string;
  sobrecargaTrabalho: number;
  suporteLideranca: number;
  clarezaPapel: number;
  ambienteFisico: number;
  scoreIndividual: number;
  nivelRisco: NivelRisco;
  submetidoEm: string;
}

export interface RelatorioAvaliacaoDTO {
  avaliacao: AvaliacaoResponseDTO;
  respostas: RespostaResponseDTO[];
  distribuicaoRisco: {
    baixo: number;
    medio: number;
    alto: number;
    critico: number;
  };
}
