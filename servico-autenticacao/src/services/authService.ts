import crypto from 'node:crypto';
import { HttpError } from '../errors/httpError.js';
import { LoginDto, RegistrarDto, TokenResponseDto, UsuarioResponseDto } from '../dtos/auth.dto.js';
import { usuarioRepository } from '../repositories/usuarioRepository.js';
import { hashPassword, verifyPassword, signJwtHS256, verifyJwtHS256, JwtClaims } from '../utils/jwtUtils.js';

export const authService = {
  async registrar(dto: RegistrarDto): Promise<UsuarioResponseDto> {
    if (await usuarioRepository.buscarPorCpf(dto.cpf)) {
      throw new HttpError(409, 'CPF já cadastrado.');
    }
    const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
    await usuarioRepository.criar({
      id,
      cpf: dto.cpf,
      nome: dto.nome,
      role: 'USER',
      senhaHash: hashPassword(dto.senha),
      criadoEm: new Date().toISOString()
    });
    return { id, nome: dto.nome, role: 'USER' };
  },

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await usuarioRepository.buscarPorCpf(dto.cpf);
    if (!user || !verifyPassword(dto.senha, user.senhaHash)) {
      throw new HttpError(401, 'CPF ou senha inválidos.');
    }
    const token = signJwtHS256(user.id, user.role);
    return {
      access_token: token,
      token,
      token_type: 'Bearer',
      expires_in: Number(process.env.JWT_EXPIRES_IN || 3600)
    };
  },

  validar(token: string): JwtClaims {
    try {
      return verifyJwtHS256(token);
    } catch (err) {
      throw new HttpError(401, err instanceof Error ? err.message : 'Token inválido.');
    }
  },

  async listarUsuarios(): Promise<UsuarioResponseDto[]> {
    const todos = await usuarioRepository.listar();
    return todos.map((u) => ({ id: u.id, nome: u.nome, role: u.role }));
  }
};
