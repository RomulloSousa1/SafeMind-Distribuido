import { z } from 'zod';

export const CriarEmpresaSchema = z.object({
  id: z.string().optional(),
  razaoSocial: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ deve ser informado corretamente'),
  setorPrincipal: z.string().min(2, 'Setor principal é obrigatório'),
  ativa: z.boolean().default(true)
}).strict();

export type CriarEmpresaRequestDTO = z.infer<typeof CriarEmpresaSchema>;

export interface EmpresaResponseDTO {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  setorPrincipal: string;
  ativa: boolean;
  criadaEm: string;
}
