import { Request, Response } from 'express';
import { EmpresaService } from '../services/EmpresaService.js';
import { CriarEmpresaSchema } from '../dtos/EmpresaDTO.js';

export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const validacao = CriarEmpresaSchema.safeParse(req.body);
      if (!validacao.success) {
        res.status(400).json({
          erro: 'Dados inválidos para cadastro de empresa',
          detalhes: validacao.error.errors.map(e => ({ campo: e.path.join('.'), mensagem: e.message }))
        });
        return;
      }

      const nova = await this.empresaService.criarEmpresa(validacao.data);
      res.status(201).json(nova);
    } catch (err: any) {
      res.status(400).json({ erro: err.message || 'Erro ao cadastrar empresa' });
    }
  };

  buscarPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const empresa = await this.empresaService.buscarPorId(id);
      if (!empresa) {
        res.status(404).json({ erro: `Empresa '${id}' não encontrada` });
        return;
      }
      res.status(200).json(empresa);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro interno no servidor' });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      const empresas = await this.empresaService.listarTodas();
      res.status(200).json(empresas);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro ao listar empresas' });
    }
  };
}
