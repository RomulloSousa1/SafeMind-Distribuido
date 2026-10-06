import { randomUUID } from 'node:crypto';
import { IEmpresaRepository } from '../repositories/EmpresaRepository.js';
import { Empresa } from '../models/Empresa.js';
import { CriarEmpresaRequestDTO, EmpresaResponseDTO } from '../dtos/EmpresaDTO.js';

export class EmpresaService {
  constructor(private readonly empresaRepo: IEmpresaRepository) {}

  async criarEmpresa(dto: CriarEmpresaRequestDTO): Promise<EmpresaResponseDTO> {
    const jaExiste = await this.empresaRepo.buscarPorCnpj(dto.cnpj);
    if (jaExiste) {
      throw new Error(`Empresa com CNPJ ${dto.cnpj} já está cadastrada.`);
    }

    const agora = new Date();
    const novaEmpresa: Empresa = {
      id: dto.id || `emp-${randomUUID().slice(0, 8)}`,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia,
      cnpj: dto.cnpj,
      setorPrincipal: dto.setorPrincipal,
      ativa: dto.ativa ?? true,
      criadaEm: agora,
      atualizadaEm: agora
    };

    const salva = await this.empresaRepo.criar(novaEmpresa);
    return this.paraResponseDTO(salva);
  }

  async buscarPorId(id: string): Promise<EmpresaResponseDTO | null> {
    const empresa = await this.empresaRepo.buscarPorId(id);
    if (!empresa) return null;
    return this.paraResponseDTO(empresa);
  }

  async listarTodas(): Promise<EmpresaResponseDTO[]> {
    const empresas = await this.empresaRepo.listarTodas();
    return empresas.map(e => this.paraResponseDTO(e));
  }

  private paraResponseDTO(empresa: Empresa): EmpresaResponseDTO {
    return {
      id: empresa.id,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      setorPrincipal: empresa.setorPrincipal,
      ativa: empresa.ativa,
      criadaEm: empresa.criadaEm.toISOString()
    };
  }
}
