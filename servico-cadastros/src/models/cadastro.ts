export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  setorPrincipal: string;
  ativa: boolean;
}

export interface Colaborador {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  setor: string;
  cargo: string;
  ativo: boolean;
}
