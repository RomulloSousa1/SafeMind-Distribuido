import { Request, Response } from 'express';
import { ColaboradorService } from '../services/ColaboradorService.js';
import { CriarColaboradorSchema } from '../dtos/ColaboradorDTO.js';

export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const validacao = CriarColaboradorSchema.safeParse(req.body);
      if (!validacao.success) {
        res.status(400).json({
          erro: 'Dados inválidos para cadastro de colaborador',
          detalhes: validacao.error.errors.map(e => ({ campo: e.path.join('.'), mensagem: e.message }))
        });
        return;
      }

      const novo = await this.colaboradorService.criarColaborador(validacao.data);
      res.status(201).json(novo);
    } catch (err: any) {
      res.status(400).json({ erro: err.message || 'Erro ao cadastrar colaborador' });
    }
  };

  buscarPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const colab = await this.colaboradorService.buscarPorId(id);
      if (!colab) {
        res.status(404).json({ erro: `Colaborador '${id}' não encontrado` });
        return;
      }
      res.status(200).json(colab);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro interno no servidor' });
    }
  };

  listarPorEmpresa = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresaId = req.query.empresaId as string;
      if (!empresaId) {
        res.status(400).json({ erro: 'Parâmetro query empresaId é obrigatório' });
        return;
      }
      const lista = await this.colaboradorService.listarPorEmpresa(empresaId);
      res.status(200).json(lista);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro ao listar colaboradores' });
    }
  };
}
