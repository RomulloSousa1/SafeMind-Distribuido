import { Empresa } from '../models/Empresa.js';

export interface IEmpresaRepository {
  criar(empresa: Empresa): Promise<Empresa>;
  buscarPorId(id: string): Promise<Empresa | null>;
  buscarPorCnpj(cnpj: string): Promise<Empresa | null>;
  listarTodas(): Promise<Empresa[]>;
  atualizar(id: string, dados: Partial<Empresa>): Promise<Empresa | null>;
}

export class EmpresaRepository implements IEmpresaRepository {
  private empresas: Map<string, Empresa> = new Map();

  constructor() {
    // Seed inicial para facilitar demonstrações e testes imediatos
    const empresaInicial: Empresa = {
      id: 'emp-1',
      razaoSocial: 'SafeMind Indústria & Tecnologia S.A.',
      nomeFantasia: 'SafeMind Tech',
      cnpj: '12.345.678/0001-90',
      setorPrincipal: 'Operações e Manufatura',
      ativa: true,
      criadaEm: new Date(),
      atualizadaEm: new Date()
    };
    this.empresas.set(empresaInicial.id, empresaInicial);
  }

  async criar(empresa: Empresa): Promise<Empresa> {
    this.empresas.set(empresa.id, { ...empresa });
    return { ...empresa };
  }

  async buscarPorId(id: string): Promise<Empresa | null> {
    const empresa = this.empresas.get(id);
    return empresa ? { ...empresa } : null;
  }

  async buscarPorCnpj(cnpj: string): Promise<Empresa | null> {
    const normalizado = cnpj.replace(/\D/g, '');
    for (const emp of this.empresas.values()) {
      if (emp.cnpj.replace(/\D/g, '') === normalizado) {
        return { ...emp };
      }
    }
    return null;
  }

  async listarTodas(): Promise<Empresa[]> {
    return Array.from(this.empresas.values()).map(e => ({ ...e }));
  }

  async atualizar(id: string, dados: Partial<Empresa>): Promise<Empresa | null> {
    const existente = this.empresas.get(id);
    if (!existente) return null;

    const atualizada: Empresa = {
      ...existente,
      ...dados,
      atualizadaEm: new Date()
    };
    this.empresas.set(id, atualizada);
    return { ...atualizada };
  }
}
