import { Avaliacao } from '../models/Avaliacao.js';

export interface IAvaliacaoRepository {
  criar(avaliacao: Avaliacao): Promise<Avaliacao>;
  buscarPorId(id: string): Promise<Avaliacao | null>;
  listarPorEmpresa(empresaId?: string): Promise<Avaliacao[]>;
  atualizar(id: string, dados: Partial<Avaliacao>): Promise<Avaliacao | null>;
}

export class AvaliacaoRepository implements IAvaliacaoRepository {
  private avaliacoes: Map<string, Avaliacao> = new Map();

  async criar(avaliacao: Avaliacao): Promise<Avaliacao> {
    this.avaliacoes.set(avaliacao.id, { ...avaliacao });
    return { ...avaliacao };
  }

  async buscarPorId(id: string): Promise<Avaliacao | null> {
    const av = this.avaliacoes.get(id);
    return av ? { ...av } : null;
  }

  async listarPorEmpresa(empresaId?: string): Promise<Avaliacao[]> {
    const todas = Array.from(this.avaliacoes.values());
    if (!empresaId) return todas.map(a => ({ ...a }));
    return todas.filter(a => a.empresaId === empresaId).map(a => ({ ...a }));
  }

  async atualizar(id: string, dados: Partial<Avaliacao>): Promise<Avaliacao | null> {
    const existente = this.avaliacoes.get(id);
    if (!existente) return null;

    const atualizada: Avaliacao = {
      ...existente,
      ...dados,
      atualizadaEm: new Date()
    };
    this.avaliacoes.set(id, atualizada);
    return { ...atualizada };
  }
}
