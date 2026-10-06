import { randomUUID } from 'node:crypto';
import { IAvaliacaoRepository } from '../repositories/AvaliacaoRepository.js';
import { IRespostaQuestionarioRepository } from '../repositories/RespostaQuestionarioRepository.js';
import { Avaliacao, NivelRisco } from '../models/Avaliacao.js';
import { RespostaQuestionario } from '../models/RespostaQuestionario.js';
import { CriarAvaliacaoRequestDTO, AvaliacaoResponseDTO } from '../dtos/AvaliacaoDTO.js';
import { SubmeterRespostaRequestDTO, RespostaResponseDTO, RelatorioAvaliacaoDTO } from '../dtos/RespostaDTO.js';

export class AvaliacaoService {
  constructor(
    private readonly avaliacaoRepo: IAvaliacaoRepository,
    private readonly respostaRepo: IRespostaQuestionarioRepository,
    private readonly servicoCadastrosUrl: string = process.env.SERVICO_CADASTROS_URL || 'http://localhost:3002'
  ) {}

  /**
   * Comunicação Síncrona (Ex2):
   * O Microsserviço A faz uma chamada HTTP síncrona ao Microsserviço B (Cadastros)
   * para validar a existência e a situação ativa da empresa antes de criar a avaliação.
   */
  async criarAvaliacao(dto: CriarAvaliacaoRequestDTO): Promise<AvaliacaoResponseDTO> {
    const urlValidacao = `${this.servicoCadastrosUrl}/empresas/${dto.empresaId}`;
    console.log(`[SERVIÇO-A] 🔄 Disparando chamada HTTP Síncrona (Ex2) -> ${urlValidacao}`);

    let empresaDados: { id: string; razaoSocial: string; ativa: boolean };

    try {
      const response = await fetch(urlValidacao, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 404) {
        throw new Error(`Empresa com ID '${dto.empresaId}' não existe no Microsserviço de Cadastros.`);
      }

      if (!response.ok) {
        throw new Error(`Falha na comunicação síncrona com Microsserviço de Cadastros: Status ${response.status}`);
      }

      empresaDados = await response.json() as { id: string; razaoSocial: string; ativa: boolean };
      console.log(`[SERVIÇO-A] ✅ Resposta recebida do Microsserviço B: Empresa '${empresaDados.razaoSocial}' confirmada.`);
    } catch (err: any) {
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

    // Recalcular métricas globais da avaliação
    const todasRespostas = await this.respostaRepo.listarPorAvaliacao(avaliacaoId);
    const mediaGeral = Number((todasRespostas.reduce((acc, r) => acc + r.scoreIndividual, 0) / todasRespostas.length).toFixed(2));
    const riscoGeral = this.determinarNivelRisco(mediaGeral);

    await this.avaliacaoRepo.atualizar(avaliacaoId, {
      status: 'EM_ANDAMENTO',
      totalRespostas: todasRespostas.length,
      scoreMedio: mediaGeral,
      nivelRiscoGeral: riscoGeral
    });

    return this.paraRespostaDTO(salva);
  }

  async obterRelatorio(avaliacaoId: string): Promise<RelatorioAvaliacaoDTO> {
    const avaliacao = await this.avaliacaoRepo.buscarPorId(avaliacaoId);
    if (!avaliacao) {
      throw new Error(`Avaliação com ID '${avaliacaoId}' não encontrada.`);
    }

    const respostas = await this.respostaRepo.listarPorAvaliacao(avaliacaoId);

    const distribuicao = {
      baixo: respostas.filter(r => r.nivelRisco === 'BAIXO').length,
      medio: respostas.filter(r => r.nivelRisco === 'MEDIO').length,
      alto: respostas.filter(r => r.nivelRisco === 'ALTO').length,
      critico: respostas.filter(r => r.nivelRisco === 'CRITICO').length
    };

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
