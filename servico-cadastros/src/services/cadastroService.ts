import crypto from 'node:crypto';
import { HttpError } from '../errors/httpError.js';
import { ColaboradorDto, EmpresaDto } from '../dtos/cadastro.dto.js';
import { Colaborador, Empresa } from '../models/cadastro.js';
import { colaboradorRepository, empresaRepository } from '../repositories/cadastroRepository.js';

export const cadastroService = {
  async criarEmpresa(dto: EmpresaDto): Promise<Empresa> {
    const empresa: Empresa = {
      id: dto.id || `emp-${crypto.randomUUID().slice(0, 8)}`,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia,
      cnpj: dto.cnpj,
      setorPrincipal: dto.setorPrincipal,
      ativa: dto.ativa
    };
    await empresaRepository.salvar(empresa);
    return empresa;
  },

  listarEmpresas: () => empresaRepository.listar(),

  async buscarEmpresa(id: string): Promise<Empresa> {
    const empresa = await empresaRepository.buscarPorId(id);
    if (!empresa) throw new HttpError(404, 'Empresa não encontrada.');
    return empresa;
  },

  async criarColaborador(dto: ColaboradorDto): Promise<Colaborador> {
    await this.buscarEmpresa(dto.empresaId);
    const colaborador: Colaborador = { id: `col-${crypto.randomUUID().slice(0, 8)}`, ...dto };
    await colaboradorRepository.criar(colaborador);
    return colaborador;
  },

  listarColaboradores: (empresaId?: string) => colaboradorRepository.listar(empresaId)
};
