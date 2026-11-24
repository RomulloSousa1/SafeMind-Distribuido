import crypto from 'node:crypto';
import { HttpError } from '../errors/httpError.js';
import { CriarAvaliacaoDto, RelatorioDto } from '../dtos/avaliacao.dto.js';
import { Avaliacao, NivelRisco } from '../models/avaliacao.js';
import { avaliacaoRepository, respostaRepository } from '../repositories/avaliacaoRepository.js';
import { validarEmpresaAtiva } from './cadastrosClient.js';
import { classificarRisco } from './riscoCalculator.js';

export const avaliacaoService = {
  async criar(dto: CriarAvaliacaoDto, authorization: string): Promise<Avaliacao> {
    await validarEmpresaAtiva(dto.empresaId, authorization);
    const avaliacao: Avaliacao = {
      id: `aval-${crypto.randomUUID().slice(0, 8)}`,
      ...dto,
      criadoEm: new Date().toISOString()
    };
    await avaliacaoRepository.criar(avaliacao);
    return avaliacao;
  },

  listar: () => avaliacaoRepository.listar(),

  async buscar(id: string): Promise<Avaliacao> {
    const avaliacao = await avaliacaoRepository.buscarPorId(id);
    if (!avaliacao) throw new HttpError(404, 'Avaliação não encontrada.');
    return avaliacao;
  },

  async relatorio(id: string): Promise<RelatorioDto> {
    await this.buscar(id);
    const respostas = await respostaRepository.listarPorAvaliacao(id);
    const processadas = respostas.filter((r) => r.status === 'PROCESSADA');
    const distribuicao: Record<NivelRisco, number> = { BAIXO: 0, MEDIO: 0, ALTO: 0 };
    processadas.forEach((r) => {
      if (r.nivelRisco) distribuicao[r.nivelRisco]++;
    });

    const soma = processadas.reduce((acc, r) => acc + (r.pontuacao ?? 0), 0);
    const media = processadas.length ? Math.round((soma / processadas.length) * 100) / 100 : null;

    return {
      avaliacaoId: id,
      totalRespostas: respostas.length,
      processadas: processadas.length,
      pendentes: respostas.length - processadas.length,
      mediaPontuacao: media,
      nivelRiscoGeral: media === null ? null : classificarRisco(media),
      distribuicaoRisco: distribuicao
    };
  }
};
