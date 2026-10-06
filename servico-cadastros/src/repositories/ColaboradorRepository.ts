import { Colaborador } from '../models/Colaborador.js';

export interface IColaboradorRepository {
  criar(colaborador: Colaborador): Promise<Colaborador>;
  buscarPorId(id: string): Promise<Colaborador | null>;
  listarPorEmpresa(empresaId: string): Promise<Colaborador[]>;
  buscarPorEmail(email: string): Promise<Colaborador | null>;
}

export class ColaboradorRepository implements IColaboradorRepository {
  private colaboradores: Map<string, Colaborador> = new Map();

  constructor() {
    const colaboradorInicial: Colaborador = {
      id: 'colab-1',
      empresaId: 'emp-1',
      nome: 'Carlos Silva',
      email: 'carlos.silva@safemind.com.br',
      setor: 'Operações',
      cargo: 'Técnico de Produção',
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    this.colaboradores.set(colaboradorInicial.id, colaboradorInicial);
  }

  async criar(colaborador: Colaborador): Promise<Colaborador> {
    this.colaboradores.set(colaborador.id, { ...colaborador });
    return { ...colaborador };
  }

  async buscarPorId(id: string): Promise<Colaborador | null> {
    const colab = this.colaboradores.get(id);
    return colab ? { ...colab } : null;
  }

  async listarPorEmpresa(empresaId: string): Promise<Colaborador[]> {
    return Array.from(this.colaboradores.values())
      .filter(c => c.empresaId === empresaId)
      .map(c => ({ ...c }));
  }

  async buscarPorEmail(email: string): Promise<Colaborador | null> {
    const emailNorm = email.toLowerCase().trim();
    for (const c of this.colaboradores.values()) {
      if (c.email.toLowerCase().trim() === emailNorm) {
        return { ...c };
      }
    }
    return null;
  }
}
