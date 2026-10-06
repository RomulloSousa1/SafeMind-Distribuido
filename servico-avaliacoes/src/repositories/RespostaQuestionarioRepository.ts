import { RespostaQuestionario } from '../models/RespostaQuestionario.js';

export interface IRespostaQuestionarioRepository {
  criar(resposta: RespostaQuestionario): Promise<RespostaQuestionario>;
  listarPorAvaliacao(avaliacaoId: string): Promise<RespostaQuestionario[]>;
  contarPorAvaliacao(avaliacaoId: string): Promise<number>;
}

export class RespostaQuestionarioRepository implements IRespostaQuestionarioRepository {
  private respostas: Map<string, RespostaQuestionario> = new Map();

  async criar(resposta: RespostaQuestionario): Promise<RespostaQuestionario> {
    this.respostas.set(resposta.id, { ...resposta });
    return { ...resposta };
  }

  async listarPorAvaliacao(avaliacaoId: string): Promise<RespostaQuestionario[]> {
    return Array.from(this.respostas.values())
      .filter(r => r.avaliacaoId === avaliacaoId)
      .map(r => ({ ...r }));
  }

  async contarPorAvaliacao(avaliacaoId: string): Promise<number> {
    let count = 0;
    for (const r of this.respostas.values()) {
      if (r.avaliacaoId === avaliacaoId) count++;
    }
    return count;
  }
}
