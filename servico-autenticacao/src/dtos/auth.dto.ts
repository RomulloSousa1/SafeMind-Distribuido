import { z } from 'zod';

// Sem campo "role": o cadastro público sempre cria USER (chaves extras são descartadas).
export const registrarSchema = z.object({
  cpf: z.string().min(11),
  nome: z.string().min(2),
  senha: z.string().min(6)
});

export const loginSchema = z.object({
  cpf: z.string().min(11),
  senha: z.string().min(1)
});

export type RegistrarDto = z.infer<typeof registrarSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export interface UsuarioResponseDto {
  id: string;
  nome: string;
  role: string;
}

export interface TokenResponseDto {
  access_token: string;
  token: string;
  token_type: 'Bearer';
  expires_in: number;
}
