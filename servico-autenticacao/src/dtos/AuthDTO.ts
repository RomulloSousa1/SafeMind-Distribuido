import { z } from 'zod';

export const RegistrarUsuarioSchema = z.object({
  cpf: z.string().min(11, 'CPF deve conter no mínimo 11 dígitos'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome: z.string().optional()
}).strict();

export const LoginSchema = z.object({
  cpf: z.string().min(11, 'CPF é obrigatório'),
  senha: z.string().min(1, 'Senha é obrigatória')
}).strict();

export type RegistrarUsuarioRequestDTO = z.infer<typeof RegistrarUsuarioSchema>;
export type LoginRequestDTO = z.infer<typeof LoginSchema>;

export interface UsuarioResponseDTO {
  id: string;
  cpf: string;
  cpfFormatado: string;
  nome?: string;
  criadoEm: string;
}

export interface LoginResponseDTO {
  autenticado: boolean;
  mensagem: string;
  token: string;
  usuario: UsuarioResponseDTO;
}

export interface TokenValidoDTO {
  valido: boolean;
  usuario?: {
    id: string;
    cpf: string;
    nome?: string;
  };
}
