export type StatusAvaliacao = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA';
export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface Avaliacao {
  id: string;
  empresaId: string;
  empresaRazaoSocial?: string;
  titulo: string;
  setor: string;
  status: StatusAvaliacao;
  nivelRiscoGeral?: NivelRisco;
  scoreMedio?: number;
  totalRespostas: number;
  criadaEm: Date;
  atualizadaEm: Date;
}
