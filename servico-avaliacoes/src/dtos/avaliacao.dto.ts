import { z } from 'zod';
import { NivelRisco } from '../models/avaliacao.js';

export const criarAvaliacaoSchema = z.object({
  empresaId: z.string().min(1),
  titulo: z.string().min(3),
  setor: z.string().min(2)
});

export const submeterRespostaSchema = z.object({
  sobrecargaTrabalho: z.number().min(1).max(5),
  suporteLideranca: z.number().min(1).max(5),
  clarezaPapel: z.number().min(1).max(5),
  ambienteFisico: z.number().min(1).max(5)
});

export type CriarAvaliacaoDto = z.infer<typeof criarAvaliacaoSchema>;
export type SubmeterRespostaDto = z.infer<typeof submeterRespostaSchema>;

/** Evento publicado no broker quando uma resposta é aceita. */
export const respostaSubmetidaEventSchema = submeterRespostaSchema.extend({
  respostaId: z.string(),
  avaliacaoId: z.string(),
  submetidoEm: z.string()
});
export type RespostaSubmetidaEvent = z.infer<typeof respostaSubmetidaEventSchema>;

export interface RelatorioDto {
  avaliacaoId: string;
  totalRespostas: number;
  processadas: number;
  pendentes: number;
  mediaPontuacao: number | null;
  nivelRiscoGeral: NivelRisco | null;
  distribuicaoRisco: Record<NivelRisco, number>;
}
