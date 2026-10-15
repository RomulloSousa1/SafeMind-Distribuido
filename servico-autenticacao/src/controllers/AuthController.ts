import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { RegistrarUsuarioSchema, LoginSchema } from '../dtos/AuthDTO.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  registrar = async (req: Request, res: Response): Promise<void> => {
    try {
      const validacao = RegistrarUsuarioSchema.safeParse(req.body);
      if (!validacao.success) {
        res.status(400).json({
          erro: 'Dados inválidos para cadastro de usuário',
          detalhes: validacao.error.errors.map(e => ({ campo: e.path.join('.'), mensagem: e.message }))
        });
        return;
      }

      const novo = await this.authService.registrar(validacao.data);
      res.status(201).json(novo);
    } catch (err: any) {
      const status = err.message.includes('já está cadastrado') ? 409 : 400;
      res.status(status).json({ erro: err.message || 'Erro ao registrar usuário' });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const validacao = LoginSchema.safeParse(req.body);
      if (!validacao.success) {
        res.status(400).json({
          erro: 'Dados inválidos para autenticação',
          detalhes: validacao.error.errors.map(e => ({ campo: e.path.join('.'), mensagem: e.message }))
        });
        return;
      }

      const resultado = await this.authService.login(validacao.data);
      res.status(200).json(resultado);
    } catch (err: any) {
      res.status(401).json({ erro: err.message || 'Falha na autenticação' });
    }
  };

  validarToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.body?.token as string);

      if (!token) {
        res.status(400).json({ erro: 'Token não fornecido no cabeçalho Authorization ou corpo da requisição' });
        return;
      }

      const resultado = this.authService.verificarTokenAcesso(token);
      if (!resultado.valido) {
        res.status(401).json({ erro: 'Token inválido ou expirado' });
        return;
      }

      res.status(200).json(resultado);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro ao validar token' });
    }
  };

  buscarPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const usuario = await this.authService.buscarPorId(id);
      if (!usuario) {
        res.status(404).json({ erro: `Usuário '${id}' não encontrado` });
        return;
      }
      res.status(200).json(usuario);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro interno no servidor' });
    }
  };
}
