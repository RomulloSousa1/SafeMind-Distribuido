export interface Usuario {
  id: string;
  cpf: string;
  cpfFormatado?: string;
  nome?: string;
  senhaHash: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}
