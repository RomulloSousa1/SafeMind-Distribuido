import { randomUUID } from 'node:crypto';
import { IAvaliacaoRepository } from '../repositories/AvaliacaoRepository.js';
import { IRespostaQuestionarioRepository } from '../repositories/RespostaQuestionarioRepository.js';
import { Avaliacao, NivelRisco } from '../models/Avaliacao.js';
import { RespostaQuestionario } from '../models/RespostaQuestionario.js';
import { CriarAvaliacaoRequestDTO, AvaliacaoResponseDTO } from '../dtos/AvaliacaoDTO.js';
import { SubmeterRespostaRequestDTO, RespostaResponseDTO, RelatorioAvaliacaoDTO } from '../dtos/RespostaDTO.js';
import { RespostaSubmetidaEventDTO } from '../dtos/EventoDTO.js';

export class AvaliacaoService {
  private publicarEventoFn?: (evento: RespostaSubmetidaEventDTO) => Promise<void>;

  constructor(
    private readonly avaliacaoRepo: IAvaliacaoRepository,
    private readonly respostaRepo: IRespostaQuestionarioRepository,
    private readonly servicoCadastrosUrl: string = process.env.SERVICO_CADASTROS_URL || 'http://localhost:3002',
    publicarEventoFn?: (evento: RespostaSubmetidaEventDTO) => Promise<void>
  ) {
    this.publicarEventoFn = publicarEventoFn;
  }

  setPublicarEvento(fn: (evento: RespostaSubmetidaEventDTO) => Promise<void>): void {
    this.publicarEventoFn = fn;
  }

  /**
   * Comunicação Síncrona (Ex2):
   * O Microsserviço A faz uma chamada HTTP síncrona ao Microsserviço B (Cadastros)
   * para validar a existência e a situação ativa da empresa antes de criar a avaliação.
   */
  async criarAvaliacao(dto: CriarAvaliacaoRequestDTO): Promise<AvaliacaoResponseDTO> {
    const urlValidacao = `${this.servicoCadastrosUrl}/empresas/${dto.empresaId}`;
    console.log(`[SERVIÇO-A] [SYNC] Disparando chamada HTTP Síncrona (Ex2) -> ${urlValidacao}`);

    let empresaDados: { id: string; razaoSocial: string; ativa: boolean };

    try {
      const response = await fetch(urlValidacao, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.status === 404) {
        throw new Error(`Empresa com ID '${dto.empresaId}' não existe no Microsserviço de Cadastros.`);
      }

      if (!response.ok) {
        throw new Error(`Falha na comunicação síncrona com Microsserviço de Cadastros: Status ${response.status}`);
      }

      empresaDados = await response.json() as { id: string; razaoSocial: string; ativa: boolean };
      console.log(`[SERVIÇO-A] [OK] Resposta recebida do Microsserviço B: Empresa '${empresaDados.razaoSocial}' confirmada.`);
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        throw new Error(`Tempo limite excedido ao comunicar com o Microsserviço B (Cadastros).`);
      }
      if (err.cause?.code === 'ECONNREFUSED') {
        throw new Error(`Microsserviço B (Cadastros em ${this.servicoCadastrosUrl}) está offline ou inacessível.`);
      }
      throw err;
    }

    if (!empresaDados.ativa) {
      throw new Error(`Não é permitido criar avaliação para a empresa '${empresaDados.razaoSocial}' pois ela está inativa.`);
    }

    const agora = new Date();
    const novaAvaliacao: Avaliacao = {
      id: dto.id || `aval-${randomUUID().slice(0, 8)}`,
      empresaId: dto.empresaId,
      empresaRazaoSocial: empresaDados.razaoSocial,
      titulo: dto.titulo,
      setor: dto.setor,
      status: 'ABERTA',
      totalRespostas: 0,
      criadaEm: agora,
      atualizadaEm: agora
    };

    const salva = await this.avaliacaoRepo.criar(novaAvaliacao);
    return this.paraAvaliacaoDTO(salva);
  }

  async buscarPorId(id: string): Promise<AvaliacaoResponseDTO | null> {
    const av = await this.avaliacaoRepo.buscarPorId(id);
    return av ? this.paraAvaliacaoDTO(av) : null;
  }

  async listarPorEmpresa(empresaId?: string): Promise<AvaliacaoResponseDTO[]> {
    const avaliacoes = await this.avaliacaoRepo.listarPorEmpresa(empresaId);
    return avaliacoes.map(a => this.paraAvaliacaoDTO(a));
  }

  async submeterResposta(avaliacaoId: string, dto: SubmeterRespostaRequestDTO): Promise<RespostaResponseDTO> {
    const avaliacao = await this.avaliacaoRepo.buscarPorId(avaliacaoId);
    if (!avaliacao) {
      throw new Error(`Avaliação com ID '${avaliacaoId}' não encontrada.`);
    }

    if (avaliacao.status === 'CONCLUIDA') {
      throw new Error('Não é possível submeter respostas para uma avaliação já concluída.');
    }

    // Cálculo do score e nível de risco individual
    const soma = dto.sobrecargaTrabalho + dto.suporteLideranca + dto.clarezaPapel + dto.ambienteFisico;
    const scoreIndividual = Number((soma / 4).toFixed(2));
    const nivelRisco = this.determinarNivelRisco(scoreIndividual);

    const novaResposta: RespostaQuestionario = {
      id: `resp-${randomUUID().slice(0, 8)}`,
      avaliacaoId,
      colaboradorId: dto.colaboradorId,
      sobrecargaTrabalho: dto.sobrecargaTrabalho,
      suporteLideranca: dto.suporteLideranca,
      clarezaPapel: dto.clarezaPapel,
      ambienteFisico: dto.ambienteFisico,
      scoreIndividual,
      nivelRisco,
      submetidoEm: new Date()
    };

    const salva = await this.respostaRepo.criar(novaResposta);
    const respostaDTO = this.paraRespostaDTO(salva);

    // Emissão do evento assíncrono para o Message Broker (desacoplamento total)
    if (this.publicarEventoFn) {
      const evento: RespostaSubmetidaEventDTO = {
        id: salva.id,
        avaliacaoId: salva.avaliacaoId,
        colaboradorId: salva.colaboradorId,
        scoreIndividual: salva.scoreIndividual,
        nivelRisco: salva.nivelRisco,
        submetidoEm: salva.submetidoEm.toISOString()
      };

      // Dispara assincronamente sem reter o ciclo HTTP da requisição
      this.publicarEventoFn(evento).catch(err => {
        console.error(`[AVALIAÇÕES] [ERRO] Erro ao despachar evento assíncrono:`, err.message);
      });
    }

    return respostaDTO;
  }

  /**
   * Processamento assíncrono acionado exclusivamente pelo Consumidor do Broker
   */
  async processarRecalculoRiscoAssincrono(avaliacaoId: string): Promise<void> {
    const { total, scoreMedio } = await this.respostaRepo.obterEstatisticas(avaliacaoId);
    const riscoGeral = this.determinarNivelRisco(scoreMedio);

    await this.avaliacaoRepo.atualizar(avaliacaoId, {
      status: 'EM_ANDAMENTO',
      totalRespostas: total,
      scoreMedio,
      nivelRiscoGeral: riscoGeral
    });
  }

  async obterRelatorio(avaliacaoId: string): Promise<RelatorioAvaliacaoDTO> {
    const avaliacao = await this.avaliacaoRepo.buscarPorId(avaliacaoId);
    if (!avaliacao) {
      throw new Error(`Avaliação com ID '${avaliacaoId}' não encontrada.`);
    }

    const respostas = await this.respostaRepo.listarPorAvaliacao(avaliacaoId);

    // Distribuição de risco consolidada em passagem única O(N)
    const distribuicao = { baixo: 0, medio: 0, alto: 0, critico: 0 };
    for (const r of respostas) {
      switch (r.nivelRisco) {
        case 'BAIXO': distribuicao.baixo++; break;
        case 'MEDIO': distribuicao.medio++; break;
        case 'ALTO': distribuicao.alto++; break;
        case 'CRITICO': distribuicao.critico++; break;
      }
    }

    return {
      avaliacao: this.paraAvaliacaoDTO(avaliacao),
      respostas: respostas.map(r => this.paraRespostaDTO(r)),
      distribuicaoRisco: distribuicao
    };
  }

  private determinarNivelRisco(score: number): NivelRisco {
    if (score <= 2.0) return 'BAIXO';
    if (score <= 3.2) return 'MEDIO';
    if (score <= 4.2) return 'ALTO';
    return 'CRITICO';
  }

  private paraAvaliacaoDTO(av: Avaliacao): AvaliacaoResponseDTO {
    return {
      id: av.id,
      empresaId: av.empresaId,
      empresaRazaoSocial: av.empresaRazaoSocial,
      titulo: av.titulo,
      setor: av.setor,
      status: av.status,
      nivelRiscoGeral: av.nivelRiscoGeral,
      scoreMedio: av.scoreMedio,
      totalRespostas: av.totalRespostas,
      criadaEm: av.criadaEm.toISOString(),
      atualizadaEm: av.atualizadaEm.toISOString()
    };
  }

  private paraRespostaDTO(r: RespostaQuestionario): RespostaResponseDTO {
    return {
      id: r.id,
      avaliacaoId: r.avaliacaoId,
      colaboradorId: r.colaboradorId,
      sobrecargaTrabalho: r.sobrecargaTrabalho,
      suporteLideranca: r.suporteLideranca,
      clarezaPapel: r.clarezaPapel,
      ambienteFisico: r.ambienteFisico,
      scoreIndividual: r.scoreIndividual,
      nivelRisco: r.nivelRisco,
      submetidoEm: r.submetidoEm.toISOString()
    };
  }
}
