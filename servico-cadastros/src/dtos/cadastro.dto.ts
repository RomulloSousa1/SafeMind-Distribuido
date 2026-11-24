import { z } from 'zod';

export const empresaSchema = z.object({
  id: z.string().optional(),
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(2),
  cnpj: z.string().min(14),
  setorPrincipal: z.string().min(2),
  ativa: z.boolean().default(true)
});

export const colaboradorSchema = z.object({
  empresaId: z.string().min(1),
  nome: z.string().min(2),
  email: z.string().email(),
  setor: z.string().min(2),
  cargo: z.string().min(2),
  ativo: z.boolean().default(true)
});

export type EmpresaDto = z.infer<typeof empresaSchema>;
export type ColaboradorDto = z.infer<typeof colaboradorSchema>;
