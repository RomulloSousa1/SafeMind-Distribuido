import crypto from 'node:crypto';
import { HttpError } from '../errors/httpError.js';
import { RespostaSubmetidaEvent, SubmeterRespostaDto } from '../dtos/avaliacao.dto.js';
import { avaliacaoRepository, respostaRepository } from '../repositories/avaliacaoRepository.js';
import { publicarRespostaSubmetida } from '../messaging/publisher.js';
import { calcularPontuacao, classificarRisco } from './riscoCalculator.js';

export const respostaService = {
  /** Produtor: salva como PENDENTE, publica o evento e devolve o id (controller responde 202). */
  async submeter(avaliacaoId: string, dto: SubmeterRespostaDto): Promise<string> {
    if (!(await avaliacaoRepository.buscarPorId(avaliacaoId))) {
      throw new HttpError(404, 'Avaliação não encontrada.');
    }

    const respostaId = `resp-${crypto.randomUUID().slice(0, 8)}`;
    const agora = new Date().toISOString();
    await respostaRepository.criar({
      id: respostaId,
      avaliacaoId,
      ...dto,
      status: 'PENDENTE',
      pontuacao: null,
      nivelRisco: null,
      criadoEm: agora,
      processadoEm: null
    });

    await publicarRespostaSubmetida({ respostaId, avaliacaoId, ...dto, submetidoEm: agora });
    return respostaId;
  },

  /** Consumidor: calcula o nível de risco e atualiza a resposta. */
  async processar(evento: RespostaSubmetidaEvent): Promise<void> {
    const pontuacao = calcularPontuacao(evento);
    const nivel = classificarRisco(pontuacao);
    const atualizada = await respostaRepository.marcarProcessada(evento.respostaId, pontuacao, nivel);
    console.log(
      `[Consumer ${process.env.HOSTNAME || 'local'}] ${evento.respostaId} -> ${nivel} (${pontuacao})` +
        (atualizada ? '' : ' [já processada]')
    );
  }
};
