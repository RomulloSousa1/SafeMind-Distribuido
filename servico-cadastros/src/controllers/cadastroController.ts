import { Request, Response } from 'express';
import { colaboradorSchema, empresaSchema } from '../dtos/cadastro.dto.js';
import { cadastroService } from '../services/cadastroService.js';

export const cadastroController = {
  async criarEmpresa(req: Request, res: Response): Promise<void> {
    const dto = empresaSchema.parse(req.body);
    res.status(201).json(await cadastroService.criarEmpresa(dto));
  },

  async listarEmpresas(_req: Request, res: Response): Promise<void> {
    res.json(await cadastroService.listarEmpresas());
  },

  async buscarEmpresa(req: Request, res: Response): Promise<void> {
    res.json(await cadastroService.buscarEmpresa(req.params.id));
  },

  async criarColaborador(req: Request, res: Response): Promise<void> {
    const dto = colaboradorSchema.parse(req.body);
    res.status(201).json(await cadastroService.criarColaborador(dto));
  },

  async listarColaboradores(req: Request, res: Response): Promise<void> {
    const empresaId = req.query.empresaId ? String(req.query.empresaId) : undefined;
    res.json(await cadastroService.listarColaboradores(empresaId));
  }
};
