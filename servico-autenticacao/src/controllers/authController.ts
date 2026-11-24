import { Request, Response } from 'express';
import { loginSchema, registrarSchema } from '../dtos/auth.dto.js';
import { authService } from '../services/authService.js';
import { HttpError } from '../errors/httpError.js';

export const authController = {
  async registrar(req: Request, res: Response): Promise<void> {
    const dto = registrarSchema.parse(req.body);
    res.status(201).json(await authService.registrar(dto));
  },

  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'Credenciais inválidas.');
    res.status(200).json(await authService.login(parsed.data));
  },

  async validar(req: Request, res: Response): Promise<void> {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ valido: false, erro: 'Token ausente.' });
      return;
    }
    try {
      res.status(200).json({ valido: true, claims: authService.validar(header.substring(7).trim()) });
    } catch (err) {
      res.status(401).json({ valido: false, erro: (err as Error).message });
    }
  },

  async listarUsuarios(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await authService.listarUsuarios());
  }
};
