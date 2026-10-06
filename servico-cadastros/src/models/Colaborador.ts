export interface Colaborador {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  setor: string;
  cargo: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}
