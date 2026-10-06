import { randomUUID } from 'node:crypto';
import { IColaboradorRepository } from '../repositories/ColaboradorRepository.js';
import { IEmpresaRepository } from '../repositories/EmpresaRepository.js';
import { Colaborador } from '../models/Colaborador.js';
import { CriarColaboradorRequestDTO, ColaboradorResponseDTO } from '../dtos/ColaboradorDTO.js';

export class ColaboradorService {
  constructor(
    private readonly colaboradorRepo: IColaboradorRepository,
    private readonly empresaRepo: IEmpresaRepository
  ) {}

  async criarColaborador(dto: CriarColaboradorRequestDTO): Promise<ColaboradorResponseDTO> {
    const empresa = await this.empresaRepo.buscarPorId(dto.empresaId);
    if (!empresa) {
      throw new Error(`Empresa com ID '${dto.empresaId}' não encontrada.`);
    }

    if (!empresa.ativa) {
      throw new Error(`Não é possível cadastrar colaborador para empresa inativa.`);
    }

    const emailExistente = await this.colaboradorRepo.buscarPorEmail(dto.email);
    if (emailExistente) {
      throw new Error(`Colaborador com e-mail '${dto.email}' já existe.`);
    }

    const agora = new Date();
    const novo: Colaborador = {
      id: dto.id || `colab-${randomUUID().slice(0, 8)}`,
      empresaId: dto.empresaId,
      nome: dto.nome,
      email: dto.email,
      setor: dto.setor,
      cargo: dto.cargo,
      ativo: dto.ativo ?? true,
      criadoEm: agora,
      atualizadoEm: agora
    };

    const salvo = await this.colaboradorRepo.criar(novo);
    return this.paraResponseDTO(salvo);
  }

  async buscarPorId(id: string): Promise<ColaboradorResponseDTO | null> {
    const colab = await this.colaboradorRepo.buscarPorId(id);
    if (!colab) return null;
    return this.paraResponseDTO(colab);
  }

  async listarPorEmpresa(empresaId: string): Promise<ColaboradorResponseDTO[]> {
    const colaboradores = await this.colaboradorRepo.listarPorEmpresa(empresaId);
    return colaboradores.map(c => this.paraResponseDTO(c));
  }

  private paraResponseDTO(colab: Colaborador): ColaboradorResponseDTO {
    return {
      id: colab.id,
      empresaId: colab.empresaId,
      nome: colab.nome,
      email: colab.email,
      setor: colab.setor,
      cargo: colab.cargo,
      ativo: colab.ativo,
      criadoEm: colab.criadoEm.toISOString()
    };
  }
}
