import { z } from 'zod';

export const CriarColaboradorSchema = z.object({
  id: z.string().optional(),
  empresaId: z.string().min(1, 'empresaId é obrigatório'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  setor: z.string().min(2, 'Setor é obrigatório'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  ativo: z.boolean().default(true)
}).strict();

export type CriarColaboradorRequestDTO = z.infer<typeof CriarColaboradorSchema>;

export interface ColaboradorResponseDTO {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  setor: string;
  cargo: string;
  ativo: boolean;
  criadoEm: string;
}
