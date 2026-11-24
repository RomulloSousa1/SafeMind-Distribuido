export type Role = 'USER' | 'ADMIN';

export interface Usuario {
  id: string;
  cpf: string;
  nome: string;
  role: Role;
  senhaHash: string;
  criadoEm: string;
}
