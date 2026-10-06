export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  setorPrincipal: string;
  ativa: boolean;
  criadaEm: Date;
  atualizadaEm: Date;
}
