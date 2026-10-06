import { Request, Response } from 'express';

export class GatewayController {
  private readonly servicoAvaliacoesUrl: string;
  private readonly servicoCadastrosUrl: string;

  constructor() {
    this.servicoAvaliacoesUrl = process.env.SERVICO_AVALIACOES_URL || 'http://localhost:3001';
    this.servicoCadastrosUrl = process.env.SERVICO_CADASTROS_URL || 'http://localhost:3002';
  }

  // --- Verificação de Saúde do Cluster Distribuído ---
  obterStatusCluster = async (_req: Request, res: Response): Promise<void> => {
    const checarServico = async (nome: string, url: string) => {
      try {
        const resp = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
        if (resp.ok) {
          const dados = await resp.json();
          return { nome, status: 'ONLINE', url, dados };
        }
        return { nome, status: 'DEGRADED', url, erro: `HTTP ${resp.status}` };
      } catch (e: any) {
        return { nome, status: 'OFFLINE', url, erro: e.message };
      }
    };

    const [statusA, statusB] = await Promise.all([
      checarServico('Microsserviço A (Avaliações)', this.servicoAvaliacoesUrl),
      checarServico('Microsserviço B (Cadastros)', this.servicoCadastrosUrl)
    ]);

    res.status(200).json({
      gateway: { nome: 'API Gateway Principal', status: 'ONLINE', porta: 3000 },
      servicosInternos: [statusA, statusB],
      topologia: 'Síncrona (Postman -> Gateway:3000 -> ServicoA:3001 -> ServicoB:3002)',
      timestamp: new Date()
    });
  };

  // --- Rotas de Avaliações (Microsserviço A) ---
  criarAvaliacao = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes`;
    console.log(`[GATEWAY] 🔄 Requisição recebida do cliente. Disparando chamada HTTP Síncrona (Ex1) -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  buscarAvaliacaoPorId = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes/${req.params.id}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  listarAvaliacoes = async (req: Request, res: Response): Promise<void> => {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes${qs}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  submeterResposta = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes/${req.params.id}/respostas`;
    console.log(`[GATEWAY] 🔄 Encaminhando resposta de questionário psicossocial -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  obterRelatorioAvaliacao = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes/${req.params.id}/relatorio`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  // --- Rotas de Cadastros (Microsserviço B) ---
  criarEmpresa = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/empresas`;
    console.log(`[GATEWAY] 🔄 Cadastrando empresa no Microsserviço B -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  buscarEmpresaPorId = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/empresas/${req.params.id}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  listarEmpresas = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/empresas`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  criarColaborador = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/colaboradores`;
    console.log(`[GATEWAY] 🔄 Cadastrando colaborador no Microsserviço B -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  listarColaboradores = async (req: Request, res: Response): Promise<void> => {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const destino = `${this.servicoCadastrosUrl}/colaboradores${qs}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  // Helper de despacho de rede
  private async repassarRequisicao(req: Request, res: Response, url: string, metodo: string): Promise<void> {
    try {
      const opcoes: RequestInit = {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-By': 'SafeMind-API-Gateway'
        }
      };

      if (['POST', 'PUT', 'PATCH'].includes(metodo)) {
        opcoes.body = JSON.stringify(req.body);
      }

      const resposta = await fetch(url, opcoes);
      const corpo = await resposta.json().catch(() => ({}));

      res.status(resposta.status).json(corpo);
    } catch (err: any) {
      console.error(`[GATEWAY] ❌ Erro ao comunicar com serviço interno (${url}):`, err.message);
      if (err.cause?.code === 'ECONNREFUSED') {
        res.status(503).json({
          erro: 'Serviço interno indisponível',
          detalhe: `Não foi possível conectar em ${url}. Certifique-se de que os microsserviços estão ativos.`
        });
        return;
      }
      res.status(502).json({
        erro: 'Bad Gateway',
        detalhe: err.message
      });
    }
  }
}
