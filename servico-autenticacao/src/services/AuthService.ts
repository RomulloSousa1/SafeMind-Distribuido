import { randomUUID } from 'node:crypto';
import { IUsuarioRepository } from '../repositories/UsuarioRepository.js';
import { Usuario } from '../models/Usuario.js';
import {
  RegistrarUsuarioRequestDTO,
  LoginRequestDTO,
  UsuarioResponseDTO,
  LoginResponseDTO,
  TokenValidoDTO
} from '../dtos/AuthDTO.js';
import {
  hashPassword,
  verificarSenha,
  normalizarCpf,
  formatarCpf,
  gerarToken,
  validarToken
} from '../utils/cryptoUtils.js';

export class AuthService {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async registrar(dto: RegistrarUsuarioRequestDTO): Promise<UsuarioResponseDTO> {
    const cpfLimpo = normalizarCpf(dto.cpf);
    if (cpfLimpo.length !== 11) {
      throw new Error('CPF inválido. O CPF deve conter exatamente 11 dígitos numéricos.');
    }

    const jaExiste = await this.usuarioRepo.buscarPorCpf(cpfLimpo);
    if (jaExiste) {
      throw new Error(`Usuário com o CPF informado já está cadastrado.`);
    }

    const agora = new Date();
    const novoUsuario: Usuario = {
      id: `usr-${randomUUID().slice(0, 8)}`,
      cpf: cpfLimpo,
      cpfFormatado: formatarCpf(cpfLimpo),
      nome: dto.nome || 'Colaborador',
      senhaHash: hashPassword(dto.senha),
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora
    };

    const salvo = await this.usuarioRepo.criar(novoUsuario);
    return this.paraUsuarioResponseDTO(salvo);
  }

  async login(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const cpfLimpo = normalizarCpf(dto.cpf);
    const usuario = await this.usuarioRepo.buscarPorCpf(cpfLimpo);

    if (!usuario || !usuario.ativo) {
      throw new Error('CPF ou senha inválidos.');
    }

    const senhaCorreta = verificarSenha(dto.senha, usuario.senhaHash);
    if (!senhaCorreta) {
      throw new Error('CPF ou senha inválidos.');
    }

    const payload = {
      id: usuario.id,
      cpf: usuario.cpf,
      nome: usuario.nome
    };

    const token = gerarToken(payload);

    return {
      autenticado: true,
      mensagem: 'Autenticação realizada com sucesso.',
      token,
      usuario: this.paraUsuarioResponseDTO(usuario)
    };
  }

  verificarTokenAcesso(token: string): TokenValidoDTO {
    const payload = validarToken(token);
    if (!payload) {
      return { valido: false };
    }
    return {
      valido: true,
      usuario: payload
    };
  }

  async buscarPorId(id: string): Promise<UsuarioResponseDTO | null> {
    const usuario = await this.usuarioRepo.buscarPorId(id);
    return usuario ? this.paraUsuarioResponseDTO(usuario) : null;
  }

  private paraUsuarioResponseDTO(u: Usuario): UsuarioResponseDTO {
    return {
      id: u.id,
      cpf: u.cpf,
      cpfFormatado: u.cpfFormatado || formatarCpf(u.cpf),
      nome: u.nome,
      criadoEm: u.criadoEm.toISOString()
    };
  }
}
