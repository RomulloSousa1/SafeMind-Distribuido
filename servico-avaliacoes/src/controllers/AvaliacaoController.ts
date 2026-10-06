import { Request, Response } from 'express';
import { AvaliacaoService } from '../services/AvaliacaoService.js';
import { CriarAvaliacaoSchema } from '../dtos/AvaliacaoDTO.js';
import { SubmeterRespostaSchema } from '../dtos/RespostaDTO.js';

export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const validacao = CriarAvaliacaoSchema.safeParse(req.body);
      if (!validacao.success) {
        res.status(400).json({
          erro: 'Dados inválidos para criação da avaliação',
          detalhes: validacao.error.errors.map(e => ({ campo: e.path.join('.'), mensagem: e.message }))
        });
        return;
      }

      const nova = await this.avaliacaoService.criarAvaliacao(validacao.data);
      res.status(201).json(nova);
    } catch (err: any) {
      const status = err.message.includes('não existe no Microsserviço') ? 404 : 400;
      res.status(status).json({ erro: err.message || 'Erro ao criar avaliação' });
    }
  };

  buscarPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const avaliacao = await this.avaliacaoService.buscarPorId(id);
      if (!avaliacao) {
        res.status(404).json({ erro: `Avaliação '${id}' não encontrada` });
        return;
      }
      res.status(200).json(avaliacao);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro interno no servidor' });
    }
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const empresaId = req.query.empresaId as string | undefined;
      const avaliacoes = await this.avaliacaoService.listarPorEmpresa(empresaId);
      res.status(200).json(avaliacoes);
    } catch (err: any) {
      res.status(500).json({ erro: err.message || 'Erro ao listar avaliações' });
    }
  };

  submeterResposta = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const validacao = SubmeterRespostaSchema.safeParse(req.body);
      if (!validacao.success) {
        res.status(400).json({
          erro: 'Respostas de questionário inválidas',
          detalhes: validacao.error.errors.map(e => ({ campo: e.path.join('.'), mensagem: e.message }))
        });
        return;
      }

      const resposta = await this.avaliacaoService.submeterResposta(id, validacao.data);
      res.status(201).json(resposta);
    } catch (err: any) {
      const status = err.message.includes('não encontrada') ? 404 : 400;
      res.status(status).json({ erro: err.message || 'Erro ao submeter resposta' });
    }
  };

  obterRelatorio = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const relatorio = await this.avaliacaoService.obterRelatorio(id);
      res.status(200).json(relatorio);
    } catch (err: any) {
      const status = err.message.includes('não encontrada') ? 404 : 400;
      res.status(status).json({ erro: err.message || 'Erro ao gerar relatório' });
    }
  };
}
