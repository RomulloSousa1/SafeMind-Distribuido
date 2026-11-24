import { Request, Response } from 'express';
import { criarAvaliacaoSchema, submeterRespostaSchema } from '../dtos/avaliacao.dto.js';
import { avaliacaoService } from '../services/avaliacaoService.js';
import { respostaService } from '../services/respostaService.js';

const instancia = () => process.env.HOSTNAME || 'local';

export const avaliacaoController = {
  async criar(req: Request, res: Response): Promise<void> {
    const dto = criarAvaliacaoSchema.parse(req.body);
    const avaliacao = await avaliacaoService.criar(dto, req.headers.authorization || '');
    res.status(201).json({ ...avaliacao, instancia: instancia() });
  },

  async listar(_req: Request, res: Response): Promise<void> {
    const avaliacoes = await avaliacaoService.listar();
    res.status(200).json({ instancia: instancia(), total: avaliacoes.length, avaliacoes });
  },

  async buscar(req: Request, res: Response): Promise<void> {
    const avaliacao = await avaliacaoService.buscar(req.params.id);
    res.status(200).json({ instancia: instancia(), avaliacao });
  },

  async submeterResposta(req: Request, res: Response): Promise<void> {
    const dto = submeterRespostaSchema.parse(req.body);
    const respostaId = await respostaService.submeter(req.params.id, dto);
    res.status(202).json({ mensagem: 'Resposta aceita para processamento.', respostaId, instancia: instancia() });
  },

  async relatorio(req: Request, res: Response): Promise<void> {
    res.status(200).json({ instancia: instancia(), ...(await avaliacaoService.relatorio(req.params.id)) });
  }
};
